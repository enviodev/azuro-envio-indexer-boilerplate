import {
  CoreContract_ConditionCreated_loader,
  CoreContract_ConditionCreated_handler,
  CoreContract_ConditionResolved_loader,
  CoreContract_ConditionResolved_handler,
  CoreContract_ConditionShifted_loader,
  CoreContract_ConditionShifted_handler,
  CoreContract_ConditionStopped_loader,
  CoreContract_ConditionStopped_handler,
  CoreContract_LpChanged_loader,
  CoreContract_LpChanged_handlerAsync,
  CoreContract_ConditionCreated_handlerAsync,
  CoreContract_ConditionResolved_handlerAsync,
} from "../../generated/src/Handlers.gen";

import { getAzuroBetAddress, getTokenForPool } from "../contracts/lpv1";

import { createPoolEntity } from "../common/pool";
import { createCoreEntity } from "../common/factory";
import { createCondition, pauseUnpauseCondition, resolveCondition } from "../common/condition";
import { CORE_TYPE_PRE_MATCH, VERSION_V1 } from "../constants";
import { createAzuroBetEntity } from "../common/azurobet";
import { createGame, shiftGame } from "../common/games";
import { deserialiseConditionV1Result, getConditionV1FromId } from "../contracts/corev1";
import { getEntityId } from "../utils/schema";

CoreContract_ConditionCreated_loader(async ({ event, context }) => {
  context.CoreContract.load(event.srcAddress.toLowerCase(), {})
});
CoreContract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  const coreContractEntity = await context.CoreContract.get(event.srcAddress.toLowerCase());

  if (!coreContractEntity) {
    context.log.error(`coreContractEntity not found. coreContractEntityId = ${event.srcAddress}`)
    return
  }

  const conditionId = event.params.conditionId
  const startsAt = event.params.timestamp
  const _conditionData = await getConditionV1FromId(event.srcAddress, event.chainId, conditionId, context)
  const conditionData = deserialiseConditionV1Result(_conditionData.condition)

  const coreAddress = event.srcAddress
  const liquidityPoolAddress = coreContractEntity.liquidityPool_id

  const gameEntity = await createGame(
    liquidityPoolAddress,
    null,
    conditionData.ipfsHash,
    null,
    startsAt,
    null,
    event.transactionHash,
    BigInt(event.blockNumber),
    BigInt(event.blockTimestamp),
    event.chainId,
    context,
  )

  if (!gameEntity) {
    context.log.error(`v1 ConditionCreated can\'t create game. conditionId = ${conditionId.toString()}`)
    return
  }

  await createCondition(
    VERSION_V1,
    coreAddress,
    conditionId,
    gameEntity.id,
    conditionData.margin,
    conditionData.reinforcement,
    conditionData.outcomes,
    conditionData.fundBank,
    1,
    false,
    gameEntity.provider,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    context,
    startsAt,
  )
});

CoreContract_ConditionResolved_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress.toLowerCase(), {})
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {})
  context.LiquidityPoolContract.load('0xac004b512c33D029cf23ABf04513f1f380B3FD0a');
  // context.Outcome.load(, {})
});
CoreContract_ConditionResolved_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = await context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v1 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  const coreContractEntity = await context.CoreContract.get(coreAddress.toLowerCase())

  if (!coreContractEntity) {
    throw new Error(`CoreContract not found. coreAddress = ${coreAddress}`)
  }

  const liquidityPoolAddress = coreContractEntity.liquidityPool_id

  await resolveCondition(
    VERSION_V1,
    liquidityPoolAddress,
    conditionEntityId,
    [event.params.outcomeWin],
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    event.chainId,
    context,
  )
});

CoreContract_ConditionShifted_loader(({ event, context }) => {
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {})
});
CoreContract_ConditionShifted_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v1 ConditionShifted conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  shiftGame(conditionEntity.game_id, event.params.newTimestamp, event.transactionHash, event.blockNumber, event.blockTimestamp, context)

  context.Condition.set({
    ...conditionEntity,
    internalStartsAt: event.params.newTimestamp,
    _updatedAt: BigInt(event.blockTimestamp),
  })

});

CoreContract_ConditionStopped_loader(({ event, context }) => {
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {})
});
CoreContract_ConditionStopped_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v1 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  pauseUnpauseCondition(
    conditionEntity,
    event.params.flag,
    BigInt(event.blockTimestamp),
    context
  )
});

CoreContract_LpChanged_loader(async ({ event, context }) => {
  await context.contractRegistration.addLP(event.params.newLp);
  context.CoreContract.load(event.srcAddress.toLowerCase(), {});

  const resp = await getAzuroBetAddress(event.params.newLp, event.chainId)
  await context.contractRegistration.addAzurobets(resp.azuroBetAddress)
});

CoreContract_LpChanged_handlerAsync(async ({ event, context }) => {
  const coreAddress = event.srcAddress
  const liquidityPoolAddress = event.params.newLp;

  const token = await getTokenForPool(liquidityPoolAddress, event.chainId);

  const liquidityPool = await createPoolEntity(
    VERSION_V1,
    coreAddress,
    liquidityPoolAddress,
    token.token,
    BigInt(event.blockNumber),
    BigInt(event.blockTimestamp),
    event.chainId,
    context,
  );

  const coreContractEntity = await context.CoreContract.get(event.srcAddress.toLowerCase());

  if (!coreContractEntity) {
    createCoreEntity(
      event.srcAddress,
      liquidityPool,
      CORE_TYPE_PRE_MATCH,
      context,
    );
  }

  const resp = await getAzuroBetAddress(liquidityPoolAddress, event.chainId)

  createAzuroBetEntity(coreAddress, resp.azuroBetAddress, context)
});
