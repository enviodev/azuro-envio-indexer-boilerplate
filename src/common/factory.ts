import { CoreContractEntity, CoreContract_LpChangedEvent_handlerContextAsync, ExpressPrematchRelationEntity, FactoryContract_NewCoreEvent_handlerContext, FactoryContract_NewCoreEvent_handlerContextAsync, FactoryContract_NewPoolEvent_handlerContextAsync, LiquidityPoolContractEntity } from "../../generated/src/Types.gen";
import { CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, CORE_TYPE_LIVE, CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2 } from "../constants";
import { getAzuroBetAddress } from "../contracts/lpv1";
import { createAzuroBetEntity } from "./azurobet";


export function createCoreEntity(
  coreAddress: string,
  liquidityPoolContractEntity: LiquidityPoolContractEntity,
  coreType: string,
  context: FactoryContract_NewPoolEvent_handlerContextAsync | CoreContract_LpChangedEvent_handlerContextAsync,
): CoreContractEntity {
  const coreContractEntity: CoreContractEntity = {
    id: coreAddress.toLowerCase(),
    liquidityPool_id: liquidityPoolContractEntity.id,
    address: coreAddress.toLowerCase(),
    type_: coreType,
  }
  // 0x4fE6A9e47db94a9b2a4FfeDE8db1602FD1fdd37d v1
  // 0xC95C831c7bDb0650b8cD5F2a542b263872d8ed0e v2
  context.CoreContract.set(coreContractEntity) 
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
  context: FactoryContract_NewCoreEvent_handlerContextAsync,
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
  context: FactoryContract_NewPoolEvent_handlerContextAsync,
): ExpressPrematchRelationEntity {
  const expressPrematchRelationEntity: ExpressPrematchRelationEntity = {
    id: expressAddress,
    prematchAddress: coreContractId,
  }
  context.ExpressPrematchRelation.set(expressPrematchRelationEntity)
  return expressPrematchRelationEntity
}


export async function connectCore(
  coreAddress: string, 
  coreType: string, 
  chainId: number,
  context: FactoryContract_NewPoolEvent_handlerContextAsync
): Promise<void> {
  const coreAddressTyped = coreAddress

  if (coreType === CORE_TYPE_PRE_MATCH) {

    const azuroBetAddress = await getAzuroBetAddress(coreAddress, chainId)

    createAzuroBetEntity(coreAddress, azuroBetAddress.azuroBetAddress, context)
  }
  else if (coreType === CORE_TYPE_PRE_MATCH_V2) {
    throw new Error("Method not implemented for core type pre match v2.")
    // CoreV3.create(coreAddressTyped)

    // const coreSC = CoreAbiV3.bind(coreAddressTyped)

    // const azuroBetAddress = coreSC.try_azuroBet()

    // if (azuroBetAddress.reverted) {
    //   context.log.error(`handleNewPool call azuroBet reverted`)
    //   return
    // }

    // createAzuroBetEntity(coreAddress, azuroBetAddress.value.toHexString(), context)

    // AzuroBet.create(azuroBetAddress.value)
  }
  else if (coreType === CORE_TYPE_LIVE) {
    throw new Error("Method not implemented for core type live.")
    // LiveCoreV1.create(coreAddressTyped)

    // const coreSC = LiveCoreAbiV1.bind(coreAddressTyped)

    // const azuroBetAddress = coreSC.try_azuroBet()

    // if (azuroBetAddress.reverted) {
    //   context.log.error(`handleNewPool call azuroBet reverted`)
    //   return
    // }

    // createAzuroBetEntity(coreAddress, azuroBetAddress.value.toHexString(), context)

    // AzuroBet.create(azuroBetAddress.value)
  }
  else if (coreType === CORE_TYPE_EXPRESS) {
    throw new Error("Method not implemented for core type express.")
    // ExpressV2.create(coreAddressTyped)
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    throw new Error("Method not implemented for core type express v2.")
    // ExpressV3.create(coreAddressTyped)
  }
}