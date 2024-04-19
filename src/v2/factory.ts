import {
  FactoryContract_NewCore_loader,
  FactoryContract_NewCore_handler,
  FactoryContract_NewPool_loader,
  FactoryContract_NewPool_handler,
  FactoryContract_NewPool_handlerAsync,
  FactoryContract_NewCore_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { connectCore, createCoreEntity, createExpressPrematchRelationEntity, getPrematchAddressByExpressAddressV2, getPrematchAddressByExpressAddressV3 } from "../common/factory";
import { createPoolEntity } from "../common/pool";
import { CORE_TYPES, CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, VERSION_V2 } from "../constants";
import { getAzuroBetAddress, getTokenForPool } from "../contracts/lpv1";
import { LP_WHITELIST } from "../whitelists";

FactoryContract_NewCore_loader(async ({ event, context }) => {
    context.contractRegistration.addCorev2(event.params.core);
    
    const resp = await getAzuroBetAddress(event.params.core, event.chainId)
    context.contractRegistration.addAzurobets(resp.azuroBetAddress)
 });
FactoryContract_NewCore_handlerAsync(async ({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress.toLowerCase()) === -1) {
    throw new Error(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
  }

  const coreAddress = event.params.core

  const coreType = CORE_TYPES.get(event.params.coreType)

  if (coreType === null) {
    return
  }

  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(liquidityPoolAddress))!

  let coreContractEntity = await context.CoreContract.get(coreAddress.toLowerCase())

  context.log.debug(`create core entity ${coreAddress}`)
  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    await connectCore(event.params.core, coreType, event.chainId, context)
  }

  let prematchAddress: string | null = null

  if (coreType === CORE_TYPE_EXPRESS) {
    prematchAddress = getPrematchAddressByExpressAddressV2(coreAddress, context)
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    prematchAddress = getPrematchAddressByExpressAddressV3(coreAddress, context)
  }

  if (prematchAddress !== null) {
    const coreContractId = (await context.CoreContract.get(prematchAddress.toLowerCase()))!.id
    createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
  }
});

FactoryContract_NewPool_loader(async ({ event, context }) => {
  context.contractRegistration.addLPv2(event.params.lp);
  context.contractRegistration.addCorev2(event.params.core);

  const resp = await getAzuroBetAddress(event.params.core, event.chainId)
  context.contractRegistration.addAzurobets(resp.azuroBetAddress)
});
FactoryContract_NewPool_handlerAsync(async ({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress.toLowerCase()) === -1) {
    context.log.warn(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
    throw new Error('not whitelisted!!!!!')
    return
  }

  const coreAddress = event.params.core
  
  const coreType = CORE_TYPES.get(event.params.coreType)

  if (coreType === null) {
    context.log.debug(`no core type!!!!`)
    throw new Error(`no core type!!!! ${coreType} ${event.params.coreType} ${event.params.core}`)
    return
  }

  const token = await getTokenForPool(liquidityPoolAddress, event.chainId)

  const liquidityPoolContractEntity = await createPoolEntity(
    VERSION_V2,
    coreAddress,
    liquidityPoolAddress,
    token.token,
    BigInt(event.blockNumber),
    BigInt(event.blockTimestamp),
    event.chainId,
    context,
  )

  let coreContractEntity = await context.CoreContract.get(coreAddress.toLowerCase())

  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    connectCore(coreAddress, coreType, event.chainId, context)
  }

  if (coreType === CORE_TYPE_EXPRESS) {
    const prematchAddress = getPrematchAddressByExpressAddressV2(coreAddress, context)

    if (prematchAddress !== null) {
      const coreContractId = (await context.CoreContract.get(prematchAddress.toLowerCase()))!.id
      createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
    }
  }
});
