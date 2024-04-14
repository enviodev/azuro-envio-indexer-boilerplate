import {
  FactoryContract_NewCore_loader,
  FactoryContract_NewCore_handler,
  FactoryContract_NewPool_loader,
  FactoryContract_NewPool_handler,
  FactoryContract_NewPool_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { connectCore, createCoreEntity, createExpressPrematchRelationEntity, getPrematchAddressByExpressAddressV2, getPrematchAddressByExpressAddressV3 } from "../common/factory";
import { createPoolEntity } from "../common/pool";
import { CORE_TYPES, CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, VERSION_V2 } from "../constants";
import { getTokenForPool } from "../contracts/lpv1";
import { LP_WHITELIST } from "../whitelists";

FactoryContract_NewCore_loader(({ event, context }) => { });
FactoryContract_NewCore_handler(({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress.toLowerCase()) === -1) {
    context.log.warn(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
    return
  }

  const coreAddress = event.params.core

  const coreType = CORE_TYPES.get(event.params.coreType)

  if (coreType === null) {
    return
  }

  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!

  let coreContractEntity = context.CoreContract.get(coreAddress)

  context.log.debug(`create core entity ${coreAddress}`)
  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    connectCore(event.params.core, coreType, context)
  }

  let prematchAddress: string | null = null

  if (coreType === CORE_TYPE_EXPRESS) {
    prematchAddress = getPrematchAddressByExpressAddressV2(coreAddress, context)
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    prematchAddress = getPrematchAddressByExpressAddressV3(coreAddress, context)
  }

  if (prematchAddress !== null) {
    const coreContractId = context.CoreContract.get(prematchAddress)!.id
    createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
  }
});

FactoryContract_NewPool_loader(({ event, context }) => {
  context.contractRegistration.addLPv2(event.params.lp);
  context.contractRegistration.addCorev2(event.params.core);
});
FactoryContract_NewPool_handlerAsync(async ({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress.toLowerCase()) === -1) {
    context.log.warn(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
    return
  }

  const coreAddress = event.params.core
  
  const coreType = CORE_TYPES.get(event.params.coreType)

  if (coreType === null) {
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

  let coreContractEntity = context.CoreContract.get(coreAddress)
  context.log.debug(`v2 new pool handler coreAddress: ${coreAddress}`)
  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    connectCore(coreAddress, coreType, context)
  }

  if (coreType === CORE_TYPE_EXPRESS) {
    const prematchAddress = getPrematchAddressByExpressAddressV2(coreAddress, context)

    if (prematchAddress !== null) {
      const coreContractId = (await context.CoreContract.get(prematchAddress))!.id
      createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
    }
  }
});
