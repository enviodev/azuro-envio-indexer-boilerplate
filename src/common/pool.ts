import { LiquidityPoolContractEntity, LiquidityPoolNftEntity, LiquidityPoolTransactionEntity } from "../../generated/src/Types.gen";

import { getErc20TokenDetails, getErc20TokenBalance } from "../contracts/erc20";

import { LP_TRANSACTION_TYPE_DEPOSIT, LP_TRANSACTION_TYPE_WITHDRAWAL, X_PROFIT, X_PROFIT_DIVIDER, ZERO_ADDRESS } from "../constants";

import { toDecimal } from "../utils/math";

import { daysBetweenTimestamps } from "../utils/time";

import { addUniqueItem } from "../utils/array";

async function updatePoolOnCommonEvents(
  liquidityPoolAddress: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: any,
) {
  const liquidityPoolContractEntity: LiquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!;

  context.LiquidityPoolContract.set({
    ...liquidityPoolContractEntity,
    lastCalculatedBlockNumber: BigInt(blockNumber),
    lastCalculatedBlockTimestamp: BigInt(blockTimestamp),
    daysSinceDeployment: daysBetweenTimestamps(
      liquidityPoolContractEntity.firstCalculatedBlockTimestamp,
      liquidityPoolContractEntity.lastCalculatedBlockTimestamp,
    ),
  })

  if (
    liquidityPoolContractEntity.daysSinceDeployment > 0n
    && (liquidityPoolContractEntity.depositedAmount - liquidityPoolContractEntity.withdrawnAmount) > 0n
  ) {
    context.liquidityPoolContractEntity.set({
      ...liquidityPoolContractEntity,
      rawApr: BigInt(liquidityPoolContractEntity.betsAmount - liquidityPoolContractEntity.wonBetsAmount)
        * X_PROFIT
        * BigInt('365')
        * bigInt.pow(BigInt('10'), 8) // too low number * 10^8
        / X_PROFIT_DIVIDER
        / liquidityPoolContractEntity.daysSinceDeployment
        / liquidityPoolContractEntity.depositedAmount - liquidityPoolContractEntity.withdrawnAmount,
      apr: toDecimal(liquidityPoolContractEntity.rawApr, 6),  // (x 100 - percents)
    })
  }

  const balance = await getErc20TokenBalance(liquidityPoolContractEntity.token, liquidityPoolContractEntity.address, chainId)

  if (balance && balance != 0n) {
    context.liquidityPoolContractEntity.set({
      ...liquidityPoolContractEntity,
      rawTvl: balance,
      tvl: toDecimal(balance, liquidityPoolContractEntity.tokenDecimals),
    })
  }

  return liquidityPoolContractEntity
}

export async function createPoolEntity(
  version: string,
  coreAddress: string,
  liquidityPoolAddress: string,
  tokenAddress: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number
): Promise<LiquidityPoolContractEntity> {
  let { decimals, symbol } = await getErc20TokenDetails(tokenAddress, chainId);

  const liquidityPoolContractEntity = {
    id: liquidityPoolAddress,
    address: liquidityPoolAddress,
    coreAddresses: [coreAddress],
    token: tokenAddress,
    version: version,
    chainId: chainId,
    tokenDecimals: decimals,
    asset: symbol,
    // rawApr: 0n,
    apr: 0n,
    betsAmount: 0n,
    betsCount: 0n,
    wonBetsAmount: 0n,
    wonBetsCount: 0n,
    // rawTvl: todo,
    // tvl: todo,
    firstCalculatedBlockNumber: BigInt(blockNumber),
    // firstCalculatedBlockTimestamp: BigInt(blockTimestamp),
    lastCalculatedBlockNumber: BigInt(blockNumber),
    lastCalculatedBlockTimestamp: BigInt(blockTimestamp),
    daysSinceDeployment: 0n,
    depositedAmount: 0n,
    withdrawnAmount: 0n,
    withdrawTimeout: 0n,
    depositedWithStakingAmount: 0n,
    withdrawnWithStakingAmount: 0n,
  };

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
  context: any,
): LiquidityPoolTransactionEntity | null {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!;

  // TODO remove later
  if (!liquidityPoolContractEntity) {
    context.log.error(`depositLiquidity liquidityPoolContractEntity not found. liquidityPoolAddress = ${liquidityPoolAddress}`);
    return null
  }

  liquidityPoolContractEntity.depositedAmount = liquidityPoolContractEntity.depositedAmount + amount

  if (liquidityPoolContractEntity.liquidityManager) {
    liquidityPoolContractEntity.depositedWithStakingAmount = liquidityPoolContractEntity.depositedWithStakingAmount + amount
  }

  updatePoolOnCommonEvents(liquidityPoolAddress, blockNumber, blockTimestamp, chainId, context)

  const liquidityPoolNftEntityId = liquidityPoolAddress + "_" + leaf.toString()
  const liquidityPoolNftEntity: LiquidityPoolNftEntity = context.LiquidityPoolNft.get(liquidityPoolNftEntityId)

  context.LiquidityPoolNft.set({
    ...liquidityPoolNftEntity,
    nftId: leaf,
    owner: account,
    historicalOwners: [account],
    liquidityPool: liquidityPoolContractEntity.id,
    rawDepositedAmount: amount,
    depositedAmount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    rawWithdrawnAmount: 0n,
    // withdrawnAmount: BigDecimal.fromString('0'),
    isFullyWithdrawn: false,
    createBlockNumber: blockNumber,
    createBlockTimestamp: blockTimestamp,
    withdrawTimeout: blockTimestamp + liquidityPoolContractEntity.withdrawTimeout,
  })

  const transactionEntity: LiquidityPoolTransactionEntity = context.LiquidityPoolTransaction.get(txHash)

  context.LiquidityPoolTransaction.set({
    ...transactionEntity,
    txHash: txHash,
    account: account,
    type: LP_TRANSACTION_TYPE_DEPOSIT,
    nft: liquidityPoolNftEntity.id,
    rawAmount: amount,
    amount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    blockNumber: blockNumber,
    blockTimestamp: blockTimestamp,
    liquidityPool: liquidityPoolContractEntity.id,
  })

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
  context: any,
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
  const liquidityPoolNftEntity: LiquidityPoolNftEntity = context.LiquidityPoolNft.get(liquidityPoolNftEntityId)

  // TODO remove later
  if (!liquidityPoolNftEntity) {
    context.log.error(`withdrawLiquidity liquidityPoolNftEntity not found. liquidityPoolNftEntityId = ${liquidityPoolNftEntityId}`)
    return null
  }

  context.LiquidityPoolNft.set({
    ...liquidityPoolNftEntity,
    rawWithdrawnAmount: liquidityPoolNftEntity.rawWithdrawnAmount + amount,
    withdrawnAmount: toDecimal(
      liquidityPoolNftEntity.rawWithdrawnAmount,
      liquidityPoolContractEntity.tokenDecimals,
    ),
    isFullyWithdrawn: isFullyWithdrawn,
  })

  const transactionEntity: LiquidityPoolTransactionEntity = context.LiquidityPoolTransaction.get(txHash)

  context.LiquidityPoolTransaction.set({
    ...transactionEntity,
    txHash: txHash,
    account: account,
    type: LP_TRANSACTION_TYPE_WITHDRAWAL,
    nft: liquidityPoolNftEntity.id,
    rawAmount: amount,
    amount: toDecimal(amount, liquidityPoolContractEntity.tokenDecimals),
    blockNumber: blockNumber,
    blockTimestamp: blockTimestamp,
    liquidityPool: liquidityPoolContractEntity.id,
  })

  return transactionEntity
}


export function transferLiquidity(
  liquidityPoolAddress: string,
  leaf: bigint,
  to: string,
  context: any,
): LiquidityPoolNftEntity | null {
  const liquidityPoolNftEntityId = liquidityPoolAddress + "_" + leaf.toString()
  const liquidityPoolNftEntity: LiquidityPoolNftEntity = context.LiquidityPoolNft.get(liquidityPoolNftEntityId)

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
  newWithdrawTimeout: BigInt,
  context: any,
): LiquidityPoolContractEntity | null {
  const liquidityPoolContractEntity: LiquidityPoolContractEntity = context.LiquidityPoolContract.load(liquidityPoolAddress)

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