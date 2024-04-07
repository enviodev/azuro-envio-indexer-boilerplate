import { FreeBetContract_BettorWinEvent_handlerContext, FreeBetContract_FreeBetMintedEvent_handlerContext, FreeBetContract_FreeBetRedeemedEvent_eventArgs, FreeBetContract_FreeBetRedeemedEvent_handlerContext, FreeBetContract_FreeBetReissuedEvent_handlerContext, FreeBetContract_TransferEvent_handlerContext, FreebetContractEntity, FreebetEntity, XYZFreeBetContract_FreeBetRedeemedEvent_eventArgs, eventLog } from "../../generated/src/Types.gen";
import { FREEBET_STATUS_CREATED, FREEBET_STATUS_REDEEMED } from "../constants";

export function createFreebetContractEntity(
  chainId: string,
  freebetContractAddress: string,
  liquidityPoolAddress: string,
  freebetContractName: string | null,
  freebetContractAffiliate: string | null,
  freebetContractManager: string | null
): FreebetContractEntity {
  const freebetContractEntity: FreebetContractEntity = {
    id: freebetContractAddress + "_" + chainId,
    liquidityPool_id: liquidityPoolAddress,
    address: freebetContractAddress,
    name: freebetContractName ? freebetContractName : "",
    affiliate: freebetContractAffiliate ? freebetContractAffiliate : "",
    manager: freebetContractManager ? freebetContractManager : "",
  };

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
  createBlock: number,
  context: FreeBetContract_FreeBetMintedEvent_handlerContext,
): FreebetEntity {
  const freebetEntityId = freebetContractAddress + '_' + freebetId.toString()

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
    expiresAt: durationTime + BigInt(createBlock),
    createdTxHash: txHash,
    createdBlockNumber: BigInt(createBlock),
    createdBlockTimestamp: BigInt(createBlock),
    burned: false,
    isResolved: false,
    _updatedAt: BigInt(createBlock),
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

  const freebetEntityId = freebetContractAddress + "_" + freebetId.toString()

  const freebetEntity = context.Freebet.get(freebetContractAddress)

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


export function redeemFreebet(
  freebetContractAddress: string,
  freebetId: bigint,
  coreAddress: string,
  azuroBetId: bigint,
  context: FreeBetContract_FreeBetRedeemedEvent_handlerContext,
  event: eventLog<FreeBetContract_FreeBetRedeemedEvent_eventArgs> | eventLog<XYZFreeBetContract_FreeBetRedeemedEvent_eventArgs>,
): FreebetEntity | null {
  const freebetEntityId = freebetContractAddress + "_" + freebetId.toString()
  const freebetEntity = context.Freebet.get(freebetEntityId)

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


export function withdrawFreebet(
  freebetEntityId: string,
  blockTimestamp: number,
  context: FreeBetContract_BettorWinEvent_handlerContext,
): FreebetEntity | null {
  const freebetEntity = context.Freebet.get(freebetEntityId)

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
  tokenId: BigInt,
  to: string,
  blockTimestamp: number,
  context: FreeBetContract_TransferEvent_handlerContext,
): FreebetEntity | null {

  const freebetEntityId = freebetContractAddress + "_" + tokenId.toString()
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
  tokenId: BigInt,
  burned: boolean,
  blockTimestamp: number,
  context: FreeBetContract_TransferEvent_handlerContext,
): FreebetEntity | null {
  const freebetEntityId = freebetContractAddress + "_" + tokenId.toString()
  const freebetEntity = context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    context.log.error(`resolveFreebet freebetEntity not found. freebetEntityId = {freebetEntityId}`)
    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    isResolved: true,
    _updatedAt: BigInt(blockTimestamp),
    burned: burned,
  })

  return freebetEntity

}