import { FreeBetContract_BettorWinEvent_handlerContext, FreeBetContract_BettorWinEvent_handlerContextAsync, FreeBetContract_FreeBetMintedEvent_handlerContext, FreeBetContract_FreeBetMintedEvent_handlerContextAsync, FreeBetContract_FreeBetRedeemedEvent_eventArgs, FreeBetContract_FreeBetRedeemedEvent_handlerContext, FreeBetContract_FreeBetRedeemedEvent_handlerContextAsync, FreeBetContract_FreeBetReissuedEvent_handlerContext, FreeBetContract_TransferEvent_handlerContext, FreeBetv3Contract_NewBetEvent_handlerContext, FreebetContractEntity, FreebetEntity, XYZFreeBetContract_FreeBetMintedBatchEvent_handlerContextAsync, XYZFreeBetContract_FreeBetRedeemedEvent_eventArgs, XYZFreeBetContract_FreeBetRedeemedEvent_handlerContext, XYZFreeBetContract_FreeBetRedeemedEvent_handlerContextAsync, eventLog } from "../../generated/src/Types.gen";
import { FREEBET_STATUS_CREATED, FREEBET_STATUS_REDEEMED } from "../constants";
import { getEntityId } from "../utils/schema";

export function createFreebetContractEntity(
  chainId: string,
  freebetContractAddress: string,
  liquidityPoolAddress: string,
  freebetContractName: string | null,
  freebetContractAffiliate: string | null,
  freebetContractManager: string | null,
  context: XYZFreeBetContract_FreeBetMintedBatchEvent_handlerContextAsync | XYZFreeBetContract_FreeBetRedeemedEvent_handlerContext,
): FreebetContractEntity {
  const freebetContractEntity: FreebetContractEntity = {
    id: getEntityId(freebetContractAddress, chainId),
    liquidityPool_id: liquidityPoolAddress,
    address: freebetContractAddress,
    name: freebetContractName ? freebetContractName : undefined,
    affiliate: freebetContractAffiliate ? freebetContractAffiliate : undefined,
    manager: freebetContractManager ? freebetContractManager : undefined,
  };
  context.FreebetContract.set(freebetContractEntity);
  return freebetContractEntity;
}

export function createFreebet(
  version: string,
  freebetContractEntityId: string,
  freebetContractAddress: string,
  freebetContractName: string | undefined,
  freebetContractAffiliate: string | undefined,
  freebetId: bigint,
  owner: string,
  amount: bigint,
  tokenDecimals: number,
  minOdds: bigint,
  durationTime: bigint,
  txHash: string,
  coreAddress: string | undefined,
  azuroBetId: bigint | undefined,
  createBlock: bigint,
  context: FreeBetContract_FreeBetMintedEvent_handlerContextAsync | FreeBetv3Contract_NewBetEvent_handlerContext,
): FreebetEntity {
  const freebetEntityId = getEntityId(freebetContractAddress, freebetId.toString())

  let _status: typeof FREEBET_STATUS_REDEEMED | typeof FREEBET_STATUS_CREATED;

  if (coreAddress !== null && azuroBetId !== null) {
    _status = FREEBET_STATUS_REDEEMED
  }
  else {
    _status = FREEBET_STATUS_CREATED
  }

  const freebetEntity: FreebetEntity = {
    id: freebetEntityId,
    freebet_id: freebetContractEntityId,
    freebetContractAddress: freebetContractAddress,
    freebetContractName: freebetContractName,
    freebetId: freebetId,
    freebetContractAffiliate: freebetContractAffiliate,
    owner: owner,
    azuroBetId: azuroBetId,
    core_id: coreAddress,
    status: _status,
    rawAmount: amount,
    // amount: amount.toBigDecimal(),
    tokenDecimals: tokenDecimals,
    rawMinOdds: minOdds,
    // minOdds: minOdds.toBigDecimal(),
    durationTime: durationTime,
    expiresAt: durationTime + createBlock,
    createdTxHash: txHash,
    createdBlockNumber: createBlock,
    createdBlockTimestamp: createBlock,
    burned: false,
    isResolved: false,
    _updatedAt: createBlock,
  }
  context.Freebet.set(freebetEntity)

  return freebetEntity
}


export function reissueFreebet(
  freebetContractAddress: string,
  freebetId: bigint,
  reissueBlock: number,
  context: FreeBetContract_FreeBetReissuedEvent_handlerContext,
): FreebetEntity | null {

  const freebetEntityId = getEntityId(freebetContractAddress, freebetId.toString())

  const freebetEntity = context.Freebet.get(freebetEntityId)

  if (!freebetEntity) {
    context.log.error(`freebetEntity not found. freebetentityId = ${freebetEntityId}`)
    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    expiresAt: freebetEntity.durationTime + BigInt(reissueBlock),
    status: FREEBET_STATUS_REDEEMED,
    core_id: undefined,
    azuroBetId: undefined,
    _updatedAt: BigInt(reissueBlock),
  })

  return freebetEntity
}


export async function redeemFreebet(
  freebetContractAddress: string,
  freebetId: bigint,
  coreAddress: string,
  azuroBetId: bigint,
  context: XYZFreeBetContract_FreeBetRedeemedEvent_handlerContextAsync | FreeBetContract_FreeBetRedeemedEvent_handlerContextAsync,
  event: eventLog<FreeBetContract_FreeBetRedeemedEvent_eventArgs> | eventLog<XYZFreeBetContract_FreeBetRedeemedEvent_eventArgs>,
): Promise<FreebetEntity | null> {
  const freebetEntityId = getEntityId(freebetContractAddress, freebetId.toString())
  const freebetEntity = await context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    context.log.error(`redeemFreebet freebetEntity not found. freebetEntityId = ${freebetEntityId}`)
    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    azuroBetId: azuroBetId,
    status: FREEBET_STATUS_REDEEMED,
    core_id: coreAddress,
    _updatedAt: BigInt(event.blockTimestamp),
  })


  return freebetEntity
}


export async function withdrawFreebet(
  freebetEntityId: string,
  blockTimestamp: number,
  context: FreeBetContract_BettorWinEvent_handlerContextAsync,
): Promise<FreebetEntity | null> {
  const freebetEntity = await context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    context.log.error(`withdrawFreebet freebetEntity not found. freebetEntityId = ${freebetEntityId}`)

    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    status: "Withdrawn",
    _updatedAt: BigInt(blockTimestamp),
  })

  return freebetEntity
}


export function transferFreebet(
  freebetContractAddress: string,
  tokenId: bigint,
  to: string,
  blockTimestamp: number,
  context: FreeBetContract_TransferEvent_handlerContext,
): FreebetEntity | null {

  const freebetEntityId = getEntityId(freebetContractAddress, tokenId.toString())
  const freebetEntity = context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    context.log.error(`transferFreebet freebetEntity not found. freebetEntityId = ${freebetEntityId}`)
    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    owner: to,
    _updatedAt: BigInt(blockTimestamp),
  })

  const coreAddress = freebetEntity.core_id
  const azuroBetId = freebetEntity.azuroBetId

  if (coreAddress !== undefined && azuroBetId !== undefined) {
    const betEntityId = coreAddress + "_" + azuroBetId.toString()
    const betEntity = context.Bet.get(betEntityId)

    // TODO remove later
    if (!betEntity) {
      context.log.error(`transferFreebet betEntity not found. betEntityId = ${betEntityId}`)
      return null
    }

    context.Bet.set({
      ...betEntity,
      actor: to,
      _updatedAt: BigInt(blockTimestamp),
    })
  }

  return freebetEntity
}


export function resolveFreebet(
  freebetContractAddress: string,
  tokenId: bigint,
  burned: boolean,
  blockTimestamp: number,
  context: FreeBetContract_TransferEvent_handlerContext,
): FreebetEntity | null {
  const freebetEntityId = getEntityId(freebetContractAddress, tokenId.toString())
  const freebetEntity = context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    throw new Error(`resolveFreebet freebetEntity not found. freebetEntityId = ${freebetEntityId}`)
  }

  context.Freebet.set({
    ...freebetEntity,
    isResolved: true,
    _updatedAt: BigInt(blockTimestamp),
    burned: burned,
  })

  return freebetEntity

}