import { CoreContractEntity, CoreContract_LpChangedEvent_handlerContextAsync, ExpressPrematchRelationEntity, FactoryContract_NewCoreEvent_handlerContext, FactoryContract_NewPoolEvent_handlerContextAsync, LiquidityPoolContractEntity } from "../../generated/src/Types.gen";
import { CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2 } from "../constants";
import { createAzuroBetEntity } from "./azurobet";


export function createCoreEntity(
  coreAddress: string,
  liquidityPoolContractEntity: LiquidityPoolContractEntity,
  coreType: string,
  context: FactoryContract_NewPoolEvent_handlerContextAsync | CoreContract_LpChangedEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): CoreContractEntity {
  const coreContractEntity: CoreContractEntity = {
    id: coreAddress,
    liquidityPool_id: liquidityPoolContractEntity.id,
    address: coreAddress,
    type_: coreType,
  }
  context.CoreContract.set(coreContractEntity)
  context.log.debug(`createCoreEntity coreAddress = ${coreAddress} coreType = ${coreType} liquidityPool_id = ${liquidityPoolContractEntity.id}`)
  return coreContractEntity
}


export function getPrematchAddressByExpressAddressV2(
  expressAddress: string,
  context: FactoryContract_NewPoolEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): string | null {
  context.log.error(`getPrematchAddressByExpressAddressV2 expressAddress = ${expressAddress}`)
  throw new Error("Method not implemented.")
  // const expressSC = ExpressAbiV2.bind(Address.fromString(expressAddress))
  // const prematchCore = expressSC.try_core()

  // if (prematchCore.reverted) {
  //   context.log.error('core reverted.')
  //   return null
  // }

  // return prematchCore.value.toHexString()
  return ""
}


export function getPrematchAddressByExpressAddressV3(
  expressAddress: string,
  context: FactoryContract_NewCoreEvent_handlerContext,
): string | null {
  // const expressSC = ExpressAbiV3.bind(Address.fromString(expressAddress))
  // const prematchCore = expressSC.try_core()

  // if (prematchCore.reverted) {
  //   context.log.error(`core reverted.`)
  //   return null
  // }

  // return prematchCore.value.toHexString()

  return ""
}


export function createExpressPrematchRelationEntity(
  expressAddress: string,
  coreContractId: string,
  context: FactoryContract_NewPoolEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): ExpressPrematchRelationEntity {
  const expressPrematchRelationEntity: ExpressPrematchRelationEntity = {
    id: expressAddress,
    prematchAddress: coreContractId,
  }
  context.ExpressPrematchRelation.set(expressPrematchRelationEntity)
  return expressPrematchRelationEntity
}


export function connectCore(
  coreAddress: string, 
  coreType: string, 
  context: FactoryContract_NewPoolEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext
): void {
  console.log(coreAddress)
  context.log.error(`connectCore coreAddress = ${coreAddress}`)
  throw new Error("Method not implemented.")
  // const coreAddressTyped = coreAddress

  // if (coreType === CORE_TYPE_PRE_MATCH) {

  //   const coreSC = CoreAbiV2.bind(coreAddressTyped)

  //   const azuroBetAddress = coreSC.try_azuroBet()

  //   if (azuroBetAddress.reverted) {
  //     context.log.error(`handleNewPool call azuroBet reverted`)
  //     return
  //   }

  //   createAzuroBetEntity(coreAddress, azuroBetAddress.value.toHexString(), context)

  //   AzuroBet.create(azuroBetAddress.value)
  // }
  // else if (coreType === CORE_TYPE_PRE_MATCH_V2) {
  //   CoreV3.create(coreAddressTyped)

  //   const coreSC = CoreAbiV3.bind(coreAddressTyped)

  //   const azuroBetAddress = coreSC.try_azuroBet()

  //   if (azuroBetAddress.reverted) {
  //     context.log.error(`handleNewPool call azuroBet reverted`)
  //     return
  //   }

  //   createAzuroBetEntity(coreAddress, azuroBetAddress.value.toHexString(), context)

  //   AzuroBet.create(azuroBetAddress.value)
  // }
  // else if (coreType === CORE_TYPE_LIVE) {
  //   LiveCoreV1.create(coreAddressTyped)

  //   const coreSC = LiveCoreAbiV1.bind(coreAddressTyped)

  //   const azuroBetAddress = coreSC.try_azuroBet()

  //   if (azuroBetAddress.reverted) {
  //     context.log.error(`handleNewPool call azuroBet reverted`)
  //     return
  //   }

  //   createAzuroBetEntity(coreAddress, azuroBetAddress.value.toHexString(), context)

  //   AzuroBet.create(azuroBetAddress.value)
  // }
  // else if (coreType === CORE_TYPE_EXPRESS) {
  //   ExpressV2.create(coreAddressTyped)
  // }
  // else if (coreType === CORE_TYPE_EXPRESS_V2) {
  //   ExpressV3.create(coreAddressTyped)
  // }
}