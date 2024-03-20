import { FreebetContractEntity, FreebetEntity } from "../../generated/src/Types.gen";

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
    liquidityPool: liquidityPoolAddress,
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
  freebetContractAffiliate: string | null,
  freebetId: bigint,
  owner: string,
  amount: bigint,
  tokenDecimals: number,
  minOdds: bigint,
  durationTime: bigint,
  txHash: string,
  coreAddress: string | null,
  azuroBetId: bigint | null,
  createBlock: number,
): FreebetEntity {
  const freebetEntityId = freebetContractAddress + '_' + freebetId.toString()

  const freebetEntity: FreebetEntity = {
    id: freebetEntityId,
    // freebet: freebetContractEntityId,
    freebetContractAddress: freebetContractAddress,
    freebetContractName: freebetContractName ? freebetContractName : "",
    freebetId: freebetId,
    freebetContractAffiliate: freebetContractAffiliate ? freebetContractAffiliate : "",
    freebet_id: freebetContractEntityId,
    owner: owner,
    azuroBetId: azuroBetId ? azuroBetId : BigInt(0),
    core_id: coreAddress ? coreAddress : "",
    status: azuroBetId ? "Redeemed" : "Created",
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

  // don't need to do freebetContractEntity.save()

  return freebetEntity
}


export function reissueFreebet(
  freebetContractAddress: string,
  freebetId: bigint,
  reissueBlock: number,
  context: any,
): FreebetEntity {
  
  const freebetEntityId = freebetContractAddress + "_" + freebetId.toString()

  const freebetEntity: FreebetEntity = context.Freebet.get(freebetContractAddress)

  if (!freebetEntity) {
    context.log.error(`freebetEntity not found. freebetentityId = ${freebetEntityId}`)
  }

  // what to do here
  // freebetEntity.expiresAt = freebetEntity.durationTime.plus(reissueBlock.timestamp)
  // freebetEntity.status = FREEBET_STATUS_REISSUED.toString()
  // freebetEntity.core = null
  // freebetEntity.azuroBetId = null
  // freebetEntity._updatedAt = reissueBlock.timestamp

  return freebetEntity
}


export function redeemFreebet(
  freebetContractAddress: string,
  freebetId: bigint,
  coreAddress: string,
  azuroBetId: bigint,
  context: any,
  event: any,
): FreebetEntity {
  const freebetEntityId = freebetContractAddress + "_" + freebetId.toString()

  // do I need to specify all properties here?
  context.Freebet.set({
    azuroBetId: azuroBetId,
    status: "Redeemed",
    core: coreAddress,
    _updatedAt: event.blockTimestamp,
  })

  const freebetEntity: FreebetEntity = context.Freebet.get(freebetEntityId)

  // are these checks unnecessary?
  if (!freebetEntity) {
    context.log.error(`freebetEntity not found. freebetentityId = ${freebetEntityId}`)
  }

  return freebetEntity
}


export function withdrawFreebet(
  freebetEntityId: string, 
  blockTimestamp: number,
  context: any,
): FreebetEntity | null {
  const freebetEntity: FreebetEntity = context.Freebet.get(freebetEntityId)

  // TODO remove later
  if (!freebetEntity) {
    context.log.error('withdrawFreebet freebetEntity not found. freebetEntityId = {}', [freebetEntityId])

    return null
  }

  context.Freebet.set({
    ...freebetEntity,
    status: "Withdrawn",
    _updatedAt: blockTimestamp,
  })

  return freebetEntity
}


export function transferFreebet(
  freebetContractAddress: string,
  tokenId: BigInt,
  to: string,
  blockTimestamp: number,
  context: any,
): FreebetEntity | null {

  const freebetEntityId = freebetContractAddress + "_" + tokenId.toString()
  const freebetEntity: FreebetEntity = context.Freebet.get(freebetEntityId)

  context.Freebet.set({
    ...freebetEntity,
    owner: to,
    _updatedAt: blockTimestamp,
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
      _updatedAt: blockTimestamp,
    })
  }

  return freebetEntity
}


export function resolveFreebet(
  freebetContractAddress: string,
  tokenId: BigInt,
  burned: boolean,
  blockTimestamp: number,
  context: any,
): void {
  const freebetEntityId = freebetContractAddress + "_" + tokenId.toString()
  const freebetEntity = context.Freebet.get(freebetEntityId)

  context.Freebet.set({
    ...freebetEntity,
    isResolved: true,
    _updatedAt: blockTimestamp,
  })
  
  if (burned) {
    context.Freebet.set({
      ...freebetEntity,
      burned: true,
    })
  }
    
}