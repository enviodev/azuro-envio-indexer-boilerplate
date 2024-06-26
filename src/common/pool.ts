import {
  CoreContract_ConditionCreatedEvent_handlerContext,
  CoreContract_ConditionResolvedEvent_handlerContextAsync,
  CoreContract_LpChangedEvent_handlerContextAsync,
  LPv2Contract_LiquidityAddedEvent_handlerContext,
  LPv2Contract_LiquidityAddedEvent_handlerContextAsync,
  LPv2Contract_LiquidityManagerChangedEvent_handlerContext,
  LPv2Contract_LiquidityRemovedEvent_handlerContext,
  LPv2Contract_LiquidityRemovedEvent_handlerContextAsync,
  LPv2Contract_TransferEvent_handlerContext,
  LPv2Contract_WithdrawTimeoutChangedEvent_handlerContext,
  LiquidityPoolContractEntity,
  LiquidityPoolNftEntity,
  LiquidityPoolTransactionEntity,
} from "../../generated/src/Types.gen";

import { getErc20TokenDetails, getErc20TokenBalance } from "../contracts/erc20";

import {
  LP_TRANSACTION_TYPE_DEPOSIT,
  LP_TRANSACTION_TYPE_WITHDRAWAL,
  VERSION_V1,
  VERSION_V2,
  VERSION_V3,
  X_PROFIT,
  X_PROFIT_DIVIDER,
  ZERO_ADDRESS,
} from "../constants";

import { toDecimal } from "../utils/math";

import { daysBetweenTimestamps } from "../utils/time";

import { addUniqueItem } from "../utils/array";
import { getEntityId } from "../utils/schema";
import { deepCopy } from "../utils/mapping";

async function updatePoolOnCommonEvents(
  liquidityPoolAddress: string,
  blockNumber: bigint,
  blockTimestamp: bigint,
  chainId: number,
  context:
    | LPv2Contract_LiquidityAddedEvent_handlerContext
    | LPv2Contract_LiquidityRemovedEvent_handlerContextAsync
) {
  const _liquidityPoolContractEntity = await context.LiquidityPoolContract.get(liquidityPoolAddress);

  if (!_liquidityPoolContractEntity) {
    throw new Error(`updatePoolOnCommonEvents liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`);
  }

  const liquidityPoolContractEntity = deepCopy(_liquidityPoolContractEntity);

  liquidityPoolContractEntity.lastCalculatedBlockNumber = blockNumber
  liquidityPoolContractEntity.lastCalculatedBlockTimestamp = blockTimestamp
  liquidityPoolContractEntity.daysSinceDeployment = BigInt(
    daysBetweenTimestamps(
      liquidityPoolContractEntity.firstCalculatedBlockTimestamp,
      liquidityPoolContractEntity.lastCalculatedBlockTimestamp,
    ),
  )

  if (
    (liquidityPoolContractEntity.daysSinceDeployment > 0n) &&
    ((liquidityPoolContractEntity.depositedAmount -
      liquidityPoolContractEntity.withdrawnAmount) >
      0n)
  ) {
    liquidityPoolContractEntity.rawApr =
      (liquidityPoolContractEntity.betsAmount - liquidityPoolContractEntity.wonBetsAmount) *
      X_PROFIT *
      365n *
      (10n ** BigInt(8)) / // too low number * 10^8
      X_PROFIT_DIVIDER /
      liquidityPoolContractEntity.daysSinceDeployment /
      liquidityPoolContractEntity.depositedAmount -
      liquidityPoolContractEntity.withdrawnAmount

    liquidityPoolContractEntity.apr = toDecimal(liquidityPoolContractEntity.rawApr, 6) // (x 100 - percents)
  }

  const balance = await getErc20TokenBalance(
    liquidityPoolContractEntity.token,
    liquidityPoolContractEntity.address,
    chainId,
    Number(blockNumber),
  );

  if (balance && balance != 0n) {
    liquidityPoolContractEntity.rawTvl = balance
    // liquidityPoolContractEntity.tvl = toDecimal(balance, liquidityPoolContractEntity.tokenDecimals)
  }

  context.LiquidityPoolContract.set(liquidityPoolContractEntity);

  return liquidityPoolContractEntity;
}

export async function createPoolEntity(
  version: typeof VERSION_V1 | typeof VERSION_V2,
  coreAddress: string,
  liquidityPoolAddress: string,
  tokenAddress: string,
  blockNumber: bigint,
  blockTimestamp: bigint,
  chainId: number,
  context: CoreContract_LpChangedEvent_handlerContextAsync
): Promise<LiquidityPoolContractEntity> {
  const { decimals, symbol } = await getErc20TokenDetails(
    tokenAddress,
    chainId
  );
  const tokenBalance = await getErc20TokenBalance(tokenAddress, liquidityPoolAddress, chainId, Number(blockNumber));

  const liquidityPoolContractEntity: LiquidityPoolContractEntity = {
    id: liquidityPoolAddress,
    address: liquidityPoolAddress,
    coreAddresses: [coreAddress],
    type_: version,
    chainName: 'gnosis', // TODO: get chain name
    token: tokenAddress,
    version: version,
    chainId: chainId, // TODO: get chain id
    tokenDecimals: decimals,
    asset: symbol,
    rawApr: 0n,
    apr: '0',
    betsAmount: 0n,
    betsCount: 0n,
    wonBetsAmount: 0n,
    wonBetsCount: 0n,
    rawTvl: tokenBalance,
    // tvl: toDecimal(
    //   liquidityPoolContractEntity.rawTvl,
    //   liquidityPoolContractEntity.tokenDecimals,
    // )
    firstCalculatedBlockNumber: blockNumber,
    firstCalculatedBlockTimestamp: blockTimestamp,
    lastCalculatedBlockNumber: blockNumber,
    lastCalculatedBlockTimestamp: blockTimestamp,
    daysSinceDeployment: 0n,
    depositedAmount: 0n,
    withdrawnAmount: 0n,
    withdrawTimeout: 0n,
    depositedWithStakingAmount: 0n,
    withdrawnWithStakingAmount: 0n,
    liquidityManager: undefined,
  };
  context.LiquidityPoolContract.set(liquidityPoolContractEntity);
  return liquidityPoolContractEntity;
}

export async function depositLiquidity(
  liquidityPoolAddress: string,
  amount: bigint,
  leaf: bigint,
  account: string,
  blockNumber: number,
  blockTimestamp: number,
  txHash: string,
  chainId: number,
  context: LPv2Contract_LiquidityAddedEvent_handlerContextAsync
): Promise<LiquidityPoolTransactionEntity | null> {
  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(liquidityPoolAddress);

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    throw new Error(`depositLiquidity liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`);
  }

  const depositedAmount = liquidityPoolContractEntity.depositedAmount + amount;
  
  let depositedWithStakingAmount: bigint; 

  if (liquidityPoolContractEntity.liquidityManager) {
    depositedWithStakingAmount =
      liquidityPoolContractEntity.depositedWithStakingAmount + amount;
  } else {
    depositedWithStakingAmount =
    liquidityPoolContractEntity.depositedWithStakingAmount;
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    depositedAmount: depositedAmount,
    depositedWithStakingAmount: depositedWithStakingAmount,
  });

  await updatePoolOnCommonEvents(
    liquidityPoolAddress,
    BigInt(blockNumber),
    BigInt(blockTimestamp),
    chainId,
    context
  );

  if (!leaf) {
    throw new Error(`depositLiquidity leaf is falsy. liquidityPoolAddress = ${liquidityPoolAddress}`);
  }

  const liquidityPoolNftEntityId = getEntityId(liquidityPoolAddress, leaf.toString());
  const liquidityPoolNftEntity: LiquidityPoolNftEntity = {
    id: liquidityPoolNftEntityId,
    nftId: leaf,
    owner: account,
    historicalOwners: [account],
    liquidityPool_id: liquidityPoolContractEntity.id,
    rawDepositedAmount: amount,
    // depositedAmount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    rawWithdrawnAmount: 0n,
    // withdrawnAmount: BigDecimal.fromString('0'),
    isFullyWithdrawn: false,
    createBlockNumber: BigInt(blockNumber),
    createBlockTimestamp: BigInt(blockTimestamp),
    withdrawTimeout:
      BigInt(blockTimestamp) + liquidityPoolContractEntity.withdrawTimeout,
  };
  context.LiquidityPoolNft.set(liquidityPoolNftEntity);

  const transactionEntity: LiquidityPoolTransactionEntity = {
    id: txHash,
    txHash: txHash,
    account: account,
    type_: LP_TRANSACTION_TYPE_DEPOSIT,
    nft_id: liquidityPoolNftEntity.id,
    rawAmount: amount,
    // amount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    blockNumber: BigInt(blockNumber),
    blockTimestamp: BigInt(blockTimestamp),
    liquidityPool_id: liquidityPoolContractEntity.id,
  };
  context.LiquidityPoolTransaction.set(transactionEntity);

  return transactionEntity;
}

export async function withdrawLiquidity(
  liquidityPoolAddress: string,
  amount: bigint,
  leaf: bigint,
  account: string,
  isFullyWithdrawn: boolean,
  blockNumber: number,
  blockTimestamp: number,
  txHash: string,
  chainId: number,
  context: LPv2Contract_LiquidityRemovedEvent_handlerContextAsync
): Promise<LiquidityPoolTransactionEntity | null> {
  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(liquidityPoolAddress)

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    throw new Error(
      `withdrawLiquidity liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`
    );
  }
  
  let withdrawnWithStakingAmount: bigint
  if (liquidityPoolContractEntity.liquidityManager) {
    withdrawnWithStakingAmount = liquidityPoolContractEntity.withdrawnWithStakingAmount + amount
  } else {
    withdrawnWithStakingAmount = liquidityPoolContractEntity.withdrawnWithStakingAmount
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    withdrawnAmount: liquidityPoolContractEntity.withdrawnAmount + amount,
    withdrawnWithStakingAmount: withdrawnWithStakingAmount,
  });

  await updatePoolOnCommonEvents(
    liquidityPoolAddress,
    BigInt(blockNumber),
    BigInt(blockTimestamp),
    chainId,
    context
  );

  const liquidityPoolNftEntityId = getEntityId(liquidityPoolAddress, leaf.toString());
  const liquidityPoolNftEntity = await context.LiquidityPoolNft.get(liquidityPoolNftEntityId);

  // TODO remove later
  if (!liquidityPoolNftEntity) {
    throw new Error(
      `withdrawLiquidity liquidityPoolNftEntity not found. liquidityPoolNftEntityId = ${liquidityPoolNftEntityId}`
    );
  }

  context.LiquidityPoolNft.set({
    ...liquidityPoolNftEntity,
    rawWithdrawnAmount: liquidityPoolNftEntity.rawWithdrawnAmount + amount,
    // withdrawnAmount: toDecimal(
    //   liquidityPoolNftEntity.rawWithdrawnAmount,
    //   liquidityPoolContractEntity.tokenDecimals,
    // ),
    isFullyWithdrawn: isFullyWithdrawn,
  });

  const transactionEntity: LiquidityPoolTransactionEntity = {
    id: txHash,
    txHash: txHash,
    account: account,
    type_: LP_TRANSACTION_TYPE_WITHDRAWAL,
    nft_id: liquidityPoolNftEntity.id,
    rawAmount: amount,
    // amount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    blockNumber: BigInt(blockNumber),
    blockTimestamp: BigInt(blockTimestamp),
    liquidityPool_id: liquidityPoolContractEntity.id,
  };
  context.LiquidityPoolTransaction.set(transactionEntity);

  return transactionEntity;
}

export function transferLiquidity(
  liquidityPoolAddress: string,
  leaf: bigint,
  to: string,
  context: LPv2Contract_TransferEvent_handlerContext
): LiquidityPoolNftEntity | null {
  const liquidityPoolNftEntityId = getEntityId(liquidityPoolAddress, leaf.toString())
  const _liquidityPoolNftEntity = context.LiquidityPoolNft.get(
    liquidityPoolNftEntityId
  );

  // TODO remove later
  if (!_liquidityPoolNftEntity) {
    throw new Error(`transferLiquidity liquidityPoolNftEntity not found. liquidityPoolNftEntityId = ${liquidityPoolNftEntityId}`);
  }

  const liquidityPoolNftEntity = deepCopy(_liquidityPoolNftEntity);

  liquidityPoolNftEntity.owner = to

  if (to !== ZERO_ADDRESS) {
      liquidityPoolNftEntity.historicalOwners = addUniqueItem(liquidityPoolNftEntity.historicalOwners,to)
  }

  context.LiquidityPoolNft.set(liquidityPoolNftEntity);

  return liquidityPoolNftEntity;
}

export function changeWithdrawalTimeout(
  liquidityPoolAddress: string,
  newWithdrawTimeout: bigint,
  context: LPv2Contract_WithdrawTimeoutChangedEvent_handlerContext
): LiquidityPoolContractEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress);

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    throw new Error(
      `changeWithdrawalTimeout liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`
    );
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    withdrawTimeout: newWithdrawTimeout,
  });

  return liquidityPoolContractEntity;
}

export async function countConditionResolved(
  liquidityPoolAddress: string,
  betsAmount: bigint,
  wonBetsAmount: bigint,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: CoreContract_ConditionCreatedEvent_handlerContext | CoreContract_ConditionResolvedEvent_handlerContextAsync
): Promise<LiquidityPoolContractEntity | null> {
  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(liquidityPoolAddress);

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    throw new Error(
      `countConditionResolved liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`
    );
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    betsAmount: liquidityPoolContractEntity.betsAmount + betsAmount,
    betsCount: liquidityPoolContractEntity.betsCount + 1n,
    wonBetsAmount: liquidityPoolContractEntity.wonBetsAmount + wonBetsAmount,
    wonBetsCount: liquidityPoolContractEntity.wonBetsCount + 1n,
  });

  await updatePoolOnCommonEvents(
    liquidityPoolAddress,
    BigInt(blockNumber),
    BigInt(blockTimestamp),
    chainId,
    context
  );

  return liquidityPoolContractEntity;
}

export function updateLiquidityManager(
  liquidityPoolAddress: string,
  liquidityManagerAddress: string | undefined,
  context: LPv2Contract_LiquidityManagerChangedEvent_handlerContext
): LiquidityPoolContractEntity {
  const liquidityPoolContractEntity =
    context.LiquidityPoolContract.get(liquidityPoolAddress);

  if (!liquidityPoolContractEntity) {
    throw new Error(
      `updateLiquidityManager liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`
    );
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    liquidityManager: liquidityManagerAddress
  });

  return liquidityPoolContractEntity;
}
