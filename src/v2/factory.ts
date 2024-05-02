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
import { CORE_TYPES, CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, CORE_TYPE_LIVE, CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2, LPV3_CREATION_BLOCK, VERSION_V2 } from "../constants";
import { getAzuroBetAddress, getTokenForPool } from "../contracts/lpv1";
import { LP_WHITELIST } from "../whitelists";

FactoryContract_NewCore_loader(async ({ event, context }) => {
  const coreAddress = event.params.core
  const chainId = event.chainId
  const coreType = CORE_TYPES.get(event.params.coreType)

  if (!coreType) {
    throw new Error(`no core type!!!! ${coreType} ${event.params.coreType} ${event.params.core}`)
  }

  const coreTypes = [CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2, CORE_TYPE_LIVE]

  if (coreTypes.includes(coreType)) {
    const resp = await getAzuroBetAddress(coreAddress, chainId)
    context.contractRegistration.addAzurobets(resp.azuroBetAddress)
  }

  if (coreType === CORE_TYPE_PRE_MATCH) {
    context.contractRegistration.addCorev2(coreAddress);
  }
  else if (coreType === CORE_TYPE_PRE_MATCH_V2) {
    context.contractRegistration.addCorev3(coreAddress);
  }
  else if (coreType === CORE_TYPE_LIVE) {
    context.contractRegistration.addLiveCorev1(coreAddress);
  }
  else if (coreType === CORE_TYPE_EXPRESS) {
    context.contractRegistration.addExpressv2(coreAddress);
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    context.contractRegistration.addExpressv3(coreAddress);
  } else {
    context.log.debug(`transaction hash: ${event.transactionHash}`)
    throw new Error(`unknown core type in factory v2: ${coreType}`)
  }

});
FactoryContract_NewCore_handlerAsync(async ({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress.toLowerCase()) === -1) {
    throw new Error(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
  }

  const coreAddress = event.params.core

  const coreType = CORE_TYPES.get(event.params.coreType)

  if (!coreType) {
    throw new Error(`no core type!!!! ${coreType} ${event.params.coreType} ${event.params.core}`)
  }

  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(liquidityPoolAddress))!

  let coreContractEntity = await context.CoreContract.get(coreAddress)

  context.log.debug(`create core entity ${coreAddress}`)
  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    await connectCore(event.params.core, coreType, event.chainId, context)
  }

  let prematchAddress: string | null = null

  if (coreType === CORE_TYPE_EXPRESS) {
    prematchAddress = await getPrematchAddressByExpressAddressV2(coreAddress, event.chainId, context)
    context.log.debug(`prematchAddress express ${prematchAddress}`)
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    prematchAddress = await getPrematchAddressByExpressAddressV3(coreAddress, event.chainId, context)
    context.log.debug(`prematchAddress express v2 ${prematchAddress}`)
  }

  if (prematchAddress !== null) {
    const coreContractId = (await context.CoreContract.get(prematchAddress))!.id
    createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
  }
});

FactoryContract_NewPool_loader(async ({ event, context }) => {
  if (event.blockNumber < LPV3_CREATION_BLOCK) {
    context.contractRegistration.addLPv2(event.params.lp);
  } else {
    context.contractRegistration.addLPv3(event.params.lp);
  }

  const coreType = CORE_TYPES.get(event.params.coreType)
  if (!coreType) {
    throw new Error(`no core type!!!! ${coreType} ${event.params.coreType} ${event.params.core}`)
  }

  const coreAddress = event.params.core
  const chainId = event.chainId
  
  const coreTypes = [CORE_TYPE_PRE_MATCH, CORE_TYPE_PRE_MATCH_V2, CORE_TYPE_LIVE]

  if (coreTypes.includes(coreType)) {
    const resp = await getAzuroBetAddress(coreAddress, chainId)
    context.contractRegistration.addAzurobets(resp.azuroBetAddress)
  }

  if (coreType === CORE_TYPE_PRE_MATCH) {
    context.contractRegistration.addCorev2(coreAddress);
  }
  else if (coreType === CORE_TYPE_PRE_MATCH_V2) {
    context.contractRegistration.addCorev3(coreAddress);
  }
  else if (coreType === CORE_TYPE_LIVE) {
    context.contractRegistration.addLiveCorev1(coreAddress);
  }
  else if (coreType === CORE_TYPE_EXPRESS) {
    context.contractRegistration.addExpressv2(coreAddress);
  }
  else if (coreType === CORE_TYPE_EXPRESS_V2) {
    context.contractRegistration.addExpressv3(coreAddress);
  } else {
    context.log.debug(`transaction hash: ${event.transactionHash}`)
    throw new Error(`unknown core type in factory v2: ${coreType}`)
  }

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

  if (!coreType) {
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

  let coreContractEntity = await context.CoreContract.get(coreAddress)

  if (!coreContractEntity) {
    createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    await connectCore(coreAddress, coreType, event.chainId, context)
  }

  if (coreType === CORE_TYPE_EXPRESS) {
    const prematchAddress = await getPrematchAddressByExpressAddressV2(coreAddress, event.chainId, context)

    if (prematchAddress !== null) {
      const coreContractId = (await context.CoreContract.get(prematchAddress))!.id
      createExpressPrematchRelationEntity(coreAddress, coreContractId, context)
    }
  }
});
