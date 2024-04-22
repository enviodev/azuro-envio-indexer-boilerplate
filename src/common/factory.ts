import { CoreContractEntity, CoreContract_LpChangedEvent_handlerContextAsync, ExpressPrematchRelationEntity, FactoryContract_NewCoreEvent_handlerContext, FactoryContract_NewCoreEvent_handlerContextAsync, FactoryContract_NewPoolEvent_handlerContextAsync, LiquidityPoolContractEntity } from "../../generated/src/Types.gen";
import { CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, CORE_TYPE_LIVE, CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2 } from "../constants";
import { getPrematchAddress } from "../contracts/express";
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


export async function getPrematchAddressByExpressAddressV2(
  expressAddress: string,
  chainId: number,
  context: FactoryContract_NewPoolEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): Promise<string> {
  context.log.debug(`getPrematchAddressByExpressAddressV2 expressAddress = ${expressAddress}`)

  const _preMatchCore = await getPrematchAddress(expressAddress, chainId)
  return _preMatchCore.preMatchAddress
}


export async function getPrematchAddressByExpressAddressV3(
  expressAddress: string,
  chainId: number,
  context: FactoryContract_NewCoreEvent_handlerContextAsync,
): Promise<string> {
  context.log.debug(`getPrematchAddressByExpressAddressV3 expressAddress = ${expressAddress}`)

  const _preMatchCore = await getPrematchAddress(expressAddress, chainId)
  return _preMatchCore.preMatchAddress
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
  const coreTypes = [CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2, CORE_TYPE_LIVE]

  if (coreTypes.includes(coreType)) {
    const _azuro = await getAzuroBetAddress(coreAddress, chainId)
    const azuroBetAddress = _azuro.azuroBetAddress
    createAzuroBetEntity(coreAddress, azuroBetAddress, context)
  }
}