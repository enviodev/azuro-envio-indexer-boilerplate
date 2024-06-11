import {
  Corev3Contract_ConditionCreated_loader,
  Corev3Contract_ConditionCreated_handler,
  Corev3Contract_ConditionResolved_loader,
  Corev3Contract_ConditionResolved_handler,
  Corev3Contract_ConditionStopped_loader,
  Corev3Contract_ConditionStopped_handler,
  Corev3Contract_NewBet_loader,
  Corev3Contract_NewBet_handler,
  Corev3Contract_OddsChanged_loader,
  Corev3Contract_OddsChanged_handler,
  Corev3Contract_MarginChanged_loader,
  Corev3Contract_MarginChanged_handler,
  Corev3Contract_ReinforcementChanged_loader,
  Corev3Contract_ReinforcementChanged_handler,
  Corev3Contract_ConditionCreated_handlerAsync,
  Corev3Contract_ConditionResolved_handlerAsync,
  Corev3Contract_NewBet_handlerAsync,
  Corev3Contract_OddsChanged_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createBet } from "../common/bets";
import { createCondition, pauseUnpauseCondition, resolveCondition, updateConditionMargin, updateConditionOdds, updateConditionReinforcement } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V3 } from "../constants";
import { deserialiseConditionV3Result, getConditionV3FromId } from "../contracts/corev3";
import { OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Corev3Contract_ConditionCreated_loader(({ event, context }) => { });
Corev3Contract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV3FromId(event.srcAddress, event.chainId, conditionId)
  const conditionData = deserialiseConditionV3Result(_conditionData.condition)

  const liquidityPoolAddress = (await context.CoreContract.get(coreAddress))!.liquidityPool_id
  const gameEntityId = getEntityId(
    liquidityPoolAddress,
    event.params.gameId.toString(),
  )

  const gameEntity = await context.Game.get(gameEntityId)
  
  // TODO remove later
  if (!gameEntity) {
    // 0x204e7371Ade792c5C006fb52711c50a7efC843ed_1577316943
    throw new Error(`v3 ConditionCreated gameEntity not found. gameEntityId = ${gameEntityId}`)
  }

  await createCondition(
    VERSION_V3,
    coreAddress,
    conditionId,
    gameEntity.id,
    conditionData.margin,
    conditionData.reinforcement,
    event.params.outcomes,
    conditionData.virtualFunds,
    Number(conditionData.winningOutcomesCount),
    conditionData.isExpressForbidden,
    gameEntity.provider,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    context,
  )
});

Corev3Contract_ConditionResolved_loader(({ event, context }) => { });
Corev3Contract_ConditionResolved_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = await context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  const liquidityPoolAddress = (await context.CoreContract.get(coreAddress))!.liquidityPool_id

  await resolveCondition(
    VERSION_V3,
    liquidityPoolAddress,
    conditionEntityId,
    event.params.winningOutcomes,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    event.chainId,
    context,
  )
});

Corev3Contract_ConditionStopped_loader(({ event, context }) => { 
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {loadGame: {}});
});
Corev3Contract_ConditionStopped_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  pauseUnpauseCondition(
    conditionEntity,
    event.params.flag,
    BigInt(event.blockTimestamp),
    context,
  )
});

Corev3Contract_NewBet_loader(({ event, context }) => {
  const coreAddress = event.srcAddress
  const conditionId = event.params.conditionId
  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  context.Condition.load(conditionEntityId, {});
 });
Corev3Contract_NewBet_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  const conditionEntity = await context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  const lp = (await context.CoreContract.get(coreAddress))!.liquidityPool_id
  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(lp))!

  const outcomeEntityId = getEntityId(
    conditionEntity.id,
    event.params.outcomeId.toString(),
  )
  const outcomeEntity = await context.Outcome.get(outcomeEntityId)

  if (!outcomeEntity) {
    throw new Error(`v3 handleNewBet outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
  }

  // context.log.debug(`creating v3 bet with id ${getEntityId(coreAddress, event.params.tokenId.toString())}`)

  await createBet(
    VERSION_V3,
    BET_TYPE_ORDINAR,
    [conditionEntity],
    [outcomeEntity],
    [event.params.odds],
    event.params.odds,
    conditionEntity.coreAddress,
    event.params.bettor,
    event.params.affiliate,
    event.params.tokenId,
    liquidityPoolContractEntity.tokenDecimals,
    event.params.amount,
    event.transactionHash,
    BigInt(event.blockNumber),
    BigInt(event.blockTimestamp),
    event.params.funds,
    context
  )
});

Corev3Contract_OddsChanged_loader(({ event, context }) => { });
Corev3Contract_OddsChanged_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV3FromId(event.srcAddress, event.chainId, conditionId)
  const conditionData = deserialiseConditionV3Result(_conditionData.condition)

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )

  const conditionEntity = await context.Condition.get(conditionEntityId)
  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleNewBet handleOddsChanged not found. conditionEntityId = ${conditionEntityId}`)
  }

  let outcomesEntities: OutcomeEntity[] = []

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = getEntityId(
      conditionEntity.id,
      conditionEntity.outcomesIds![i].toString(),
    )
    const outcomeEntity = await context.Outcome.get(outcomeEntityId)

    if (!outcomeEntity) {
      throw new Error(`v3 handleOddsChanged outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
    }

    outcomesEntities = outcomesEntities.concat([outcomeEntity])
  }

  updateConditionOdds(
      VERSION_V3,
      conditionEntity,
      outcomesEntities,
      conditionData.virtualFunds,
      event.blockNumber,
      context,
    )
});

Corev3Contract_MarginChanged_loader(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  context.Condition.load(conditionEntityId, {})
 });
Corev3Contract_MarginChanged_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleMarginChanged conditionEntity not found. conditionEntityId = {conditionEntityId}`)
  }

  updateConditionMargin(conditionEntity, event.params.newMargin, event.blockTimestamp, context)
});

Corev3Contract_ReinforcementChanged_loader(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )

  context.Condition.load(conditionEntityId, {})
 });
Corev3Contract_ReinforcementChanged_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )

  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v3 handleReinforcementChanged conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  updateConditionReinforcement(
    conditionEntity,
    event.params.newReinforcement,
    event.blockTimestamp,
    context,
  )
});
