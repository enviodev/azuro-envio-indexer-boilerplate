import {
  FactoryContract_NewCore_loader,
  FactoryContract_NewCore_handler,
  FactoryContract_NewPool_loader,
  FactoryContract_NewPool_handler,
} from "../../generated/src/Handlers.gen";
import { connectCore, createCoreEntity, createExpressPrematchRelationEntity, getPrematchAddressByExpressAddressV2, getPrematchAddressByExpressAddressV3 } from "../common/factory";
import { createPoolEntity } from "../common/pool";
import { CORE_TYPES, CORE_TYPE_EXPRESS, CORE_TYPE_EXPRESS_V2, VERSION_V2 } from "../constants";
import { LP_WHITELIST } from "../whitelists";

FactoryContract_NewCore_loader(({ event, context }) => { });
FactoryContract_NewCore_handler(({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress) === -1) {
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
    createExpressPrematchRelationEntity(coreAddress, prematchAddress, context)
  }
});

FactoryContract_NewPool_loader(({ event, context }) => {
  context.contractRegistration.addLPv2(event.params.lp);
});
FactoryContract_NewPool_handler(({ event, context }) => {
  const liquidityPoolAddress = event.params.lp

  if (LP_WHITELIST.indexOf(liquidityPoolAddress) === -1) {
    context.log.warn(`v2 handleNewPool skip ${liquidityPoolAddress} because it isn\'t whitelisted`)
    return
  }

  const coreAddress = event.params.core

  const coreType = CORE_TYPES.get(event.params.coreType)

  if (coreType === null) {
    return
  }

  const liquidityPoolSC = LPAbiV2.bind(event.params.lp)

  const token = liquidityPoolSC.try_token()

  if (token.reverted) {
    return
  }

  const liquidityPoolContractEntity = await createPoolEntity(
    VERSION_V2,
    coreAddress,
    liquidityPoolAddress,
    token.value.toHexString(),
    event.blockNumber,
    event.blockTimestamp,
    event.chainId,
  )

  LPV2.create(event.params.lp)

  let coreContractEntity = context.CoreContract.get(coreAddress)

  if (!coreContractEntity) {
    coreContractEntity = createCoreEntity(coreAddress, liquidityPoolContractEntity, coreType, context)
    connectCore(coreAddress, coreType, context)
  }

  if (coreType === CORE_TYPE_EXPRESS) {
    const prematchAddress = getPrematchAddressByExpressAddressV2(coreAddress, context)

    if (prematchAddress !== null) {
      createExpressPrematchRelationEntity(coreAddress, prematchAddress, context)
    }
 });
