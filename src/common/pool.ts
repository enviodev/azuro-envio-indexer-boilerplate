import { CoreContract_ConditionCreatedEvent_handlerContext, CoreContract_LpChangedEvent_handlerContextAsync, LPv2Contract_LiquidityAddedEvent_handlerContext, LPv2Contract_LiquidityManagerChangedEvent_handlerContext, LPv2Contract_LiquidityRemovedEvent_handlerContext, LPv2Contract_TransferEvent_handlerContext, LPv2Contract_WithdrawTimeoutChangedEvent_handlerContext, LiquidityPoolContractEntity, LiquidityPoolNftEntity, LiquidityPoolTransactionEntity } from "../../generated/src/Types.gen";

import { getErc20TokenDetails, getErc20TokenBalance } from "../contracts/erc20";

import { LP_TRANSACTION_TYPE_DEPOSIT, LP_TRANSACTION_TYPE_WITHDRAWAL, VERSION_V1, VERSION_V2, VERSION_V3, X_PROFIT, X_PROFIT_DIVIDER, ZERO_ADDRESS } from "../constants";

import { toDecimal } from "../utils/math";

import { daysBetweenTimestamps } from "../utils/time";

import { addUniqueItem } from "../utils/array";

async function updatePoolOnCommonEvents(
  liquidityPoolAddress: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: LPv2Contract_LiquidityAddedEvent_handlerContext,
) {
  const liquidityPoolContractEntity: LiquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!;

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    lastCalculatedBlockNumber: BigInt(blockNumber),
    lastCalculatedBlockTimestamp: BigInt(blockTimestamp),
    daysSinceDeployment: BigInt(daysBetweenTimestamps(
      liquidityPoolContractEntity.firstCalculatedBlockTimestamp,
      liquidityPoolContractEntity.lastCalculatedBlockTimestamp,
    )),
  })

  if (
    liquidityPoolContractEntity.daysSinceDeployment > 0n
    && (liquidityPoolContractEntity.depositedAmount - liquidityPoolContractEntity.withdrawnAmount) > 0n
  ) {
    context.LiquidityPoolContract.set({
      ...liquidityPoolContractEntity,
      rawApr: BigInt(liquidityPoolContractEntity.betsAmount - liquidityPoolContractEntity.wonBetsAmount)
        * X_PROFIT
        * BigInt('365')
        * (BigInt('10') ** BigInt(8)) // too low number * 10^8
        / X_PROFIT_DIVIDER
        / liquidityPoolContractEntity.daysSinceDeployment
        / liquidityPoolContractEntity.depositedAmount - liquidityPoolContractEntity.withdrawnAmount,
      apr: toDecimal(liquidityPoolContractEntity.rawApr, 6),  // (x 100 - percents)
    })
  }

  const balance = await getErc20TokenBalance(liquidityPoolContractEntity.token, liquidityPoolContractEntity.address, chainId)

  if (balance && balance != 0n) {
    context.LiquidityPoolContract.set({
      ...liquidityPoolContractEntity,
      rawTvl: balance,
      // tvl: toDecimal(balance, liquidityPoolContractEntity.tokenDecimals),
    })
  }

  return liquidityPoolContractEntity
}

export async function createPoolEntity(
  version: string,
  coreAddress: string,
  liquidityPoolAddress: string,
  tokenAddress: string,
  blockNumber: bigint,
  blockTimestamp: bigint,
  chainId: number,
  context: CoreContract_LpChangedEvent_handlerContextAsync,
): Promise<LiquidityPoolContractEntity> {
  const { decimals, symbol } = await getErc20TokenDetails(tokenAddress, chainId);

  const tokenBalance = await getErc20TokenBalance(tokenAddress, liquidityPoolAddress, chainId)

  const _version = version as typeof VERSION_V1 | typeof VERSION_V2

  const liquidityPoolContractEntity: LiquidityPoolContractEntity = {
    id: liquidityPoolAddress,
    address: liquidityPoolAddress,
    coreAddresses: [coreAddress],
    type_: _version,
    token: tokenAddress,
    version: version,
    chainId: chainId,
    tokenDecimals: decimals,
    asset: symbol,
    rawApr: 0n,
    apr: 0n,
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

export function depositLiquidity(
  liquidityPoolAddress: string,
  amount: bigint,
  leaf: bigint,
  account: string,
  blockNumber: number,
  blockTimestamp: number,
  txHash: string,
  chainId: number,
  context: LPv2Contract_LiquidityAddedEvent_handlerContext,
): LiquidityPoolTransactionEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!;

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    context.log.error(`depositLiquidity liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`);
    return null
  }

  const depositedAmount = liquidityPoolContractEntity.depositedAmount + amount
  let depositedWithStakingAmount = liquidityPoolContractEntity.depositedWithStakingAmount

  if (liquidityPoolContractEntity.liquidityManager) {
    depositedWithStakingAmount = liquidityPoolContractEntity.depositedWithStakingAmount + amount
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    depositedAmount: depositedAmount,
    depositedWithStakingAmount: depositedWithStakingAmount,
  })

  updatePoolOnCommonEvents(liquidityPoolAddress, blockNumber, blockTimestamp, chainId, context)

  const liquidityPoolNftEntityId = liquidityPoolAddress + "_" + leaf.toString()
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
    withdrawTimeout: BigInt(blockTimestamp) + liquidityPoolContractEntity.withdrawTimeout,
  }

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
  }

  return transactionEntity

}


export function withdrawLiquidity(
  liquidityPoolAddress: string,
  amount: bigint,
  leaf: bigint,
  account: string,
  isFullyWithdrawn: boolean,
  blockNumber: number,
  blockTimestamp: number,
  txHash: string,
  chainId: number,
  context: LPv2Contract_LiquidityRemovedEvent_handlerContext,
): LiquidityPoolTransactionEntity | null {
  const liquidityPoolContractEntity: LiquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!;

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    context.log.error(`withdrawLiquidity liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`);
    return null
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    withdrawnAmount: liquidityPoolContractEntity.withdrawnAmount + amount,
  })

  if (liquidityPoolContractEntity.liquidityManager) {
    context.LiquidityPoolContract.set({
      ...liquidityPoolContractEntity,
      withdrawnWithStakingAmount: liquidityPoolContractEntity.withdrawnWithStakingAmount + amount,
    })
  }

  updatePoolOnCommonEvents(liquidityPoolAddress, blockNumber, blockTimestamp, chainId, context)

  const liquidityPoolNftEntityId = liquidityPoolAddress + "_" + leaf.toString()
  const liquidityPoolNftEntity = context.LiquidityPoolNft.get(liquidityPoolNftEntityId)

  // TODO remove later
  if (!liquidityPoolNftEntity) {
    context.log.error(`withdrawLiquidity liquidityPoolNftEntity not found. liquidityPoolNftEntityId = ${liquidityPoolNftEntityId}`)
    return null
  }

  context.LiquidityPoolNft.set({
    ...liquidityPoolNftEntity,
    rawWithdrawnAmount: liquidityPoolNftEntity.rawWithdrawnAmount + amount,
    // withdrawnAmount: toDecimal(
    //   liquidityPoolNftEntity.rawWithdrawnAmount,
    //   liquidityPoolContractEntity.tokenDecimals,
    // ),
    isFullyWithdrawn: isFullyWithdrawn,
  })

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
  }

  return transactionEntity
}


export function transferLiquidity(
  liquidityPoolAddress: string,
  leaf: bigint,
  to: string,
  context: LPv2Contract_TransferEvent_handlerContext,
): LiquidityPoolNftEntity | null {
  const liquidityPoolNftEntityId = liquidityPoolAddress + "_" + leaf.toString()
  const liquidityPoolNftEntity = context.LiquidityPoolNft.get(liquidityPoolNftEntityId)

  // TODO remove later
  if (!liquidityPoolNftEntity) {
    context.log.error(`transferLiquidity liquidityPoolNftEntity not found. liquidityPoolNftEntityId = ${liquidityPoolNftEntityId}`)
    return null
  }

  context.LiquidityPoolNft.set({
    ...liquidityPoolNftEntity,
    owner: to,
  })

  if (to !== ZERO_ADDRESS) {
    context.LiquidityPoolNft.set({
      ...liquidityPoolNftEntity,
      historicalOwners: addUniqueItem(liquidityPoolNftEntity.historicalOwners, to),
    })
  }

  return liquidityPoolNftEntity
}


export function changeWithdrawalTimeout(
  liquidityPoolAddress: string,
  newWithdrawTimeout: bigint,
  context: LPv2Contract_WithdrawTimeoutChangedEvent_handlerContext,
): LiquidityPoolContractEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    context.log.error(`changeWithdrawalTimeout liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`)
    return null
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    withdrawTimeout: newWithdrawTimeout,
  })

  return liquidityPoolContractEntity
}

export function countConditionResolved(
  liquidityPoolAddress: string,
  betsAmount: bigint,
  wonBetsAmount: bigint,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: CoreContract_ConditionCreatedEvent_handlerContext,
): LiquidityPoolContractEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    context.log.error(`countConditionResolved liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`)
    return null
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    betsAmount: liquidityPoolContractEntity.betsAmount + betsAmount,
    betsCount: liquidityPoolContractEntity.betsCount + 1n,
    wonBetsAmount: liquidityPoolContractEntity.wonBetsAmount + wonBetsAmount,
    wonBetsCount: liquidityPoolContractEntity.wonBetsCount + 1n,
  })

  updatePoolOnCommonEvents(liquidityPoolAddress, blockNumber, blockTimestamp, chainId, context)

  return liquidityPoolContractEntity
}


export function updateLiquidityManager(
  liquidityPoolAddress: string,
  liquidityManagerAddress: string | null,
  context: LPv2Contract_LiquidityManagerChangedEvent_handlerContext,
): LiquidityPoolContractEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)

  if (!liquidityPoolContractEntity) {
    context.log.error(`updateLiquidityManager liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`)
    return null
  }

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    liquidityManager: liquidityManagerAddress ? liquidityManagerAddress : undefined,
  })

  return liquidityPoolContractEntity
}