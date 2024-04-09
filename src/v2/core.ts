import { start } from "repl";
import {
  Corev2Contract_ConditionCreated_loader,
  Corev2Contract_ConditionCreated_handler,
  Corev2Contract_ConditionResolved_loader,
  Corev2Contract_ConditionResolved_handler,
  Corev2Contract_ConditionStopped_loader,
  Corev2Contract_ConditionStopped_handler,
  Corev2Contract_NewBet_loader,
  Corev2Contract_NewBet_handler,
  Corev2Contract_OddsChanged_loader,
  Corev2Contract_OddsChanged_handler,
  Corev2Contract_ConditionCreated_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createCondition, pauseUnpauseCondition, resolveCondition, updateConditionOdds } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V2 } from "../constants";
import { deserialiseConditionV2Result, getConditionV2FromId } from "../contracts/corev2";
import { createBet } from "../common/bets";
import { OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

// TODO: get contract addresses

Corev2Contract_ConditionCreated_loader(async ({ event, context }) => { 
  context.CoreContract.load(event.srcAddress, {})
});
Corev2Contract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV2FromId(event.srcAddress, event.chainId, conditionId)
  const conditionData = deserialiseConditionV2Result(_conditionData.condition)

  const liquidityPoolAddress = (await context.CoreContract.get(coreAddress))!.liquidityPool_id
  const gameEntityId = liquidityPoolAddress + "_" + event.params.gameId.toString()

  const gameEntity = await context.Game.get(gameEntityId)

  // TODO remove later
  if (!gameEntity) {
    context.log.error(`v2 ConditionCreated gameEntity not found. gameEntityId = ${gameEntityId}`)
    return
  }

  createCondition(
    VERSION_V2,
    coreAddress,
    conditionId,
    gameEntity.id,
    conditionData.margin,
    conditionData.reinforcement,
    conditionData.outcomes,
    conditionData.virtualFunds,
    1,
    false,
    gameEntity.provider,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    context,
    null,
  )
});

Corev2Contract_ConditionResolved_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
  context.Condition.load(event.srcAddress + "_" + event.params.conditionId.toString(), {})
});
Corev2Contract_ConditionResolved_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v2 handleConditionResolved conditionEntity not found. conditionEntityId = $conditionEntityId}`)
    return
  }

  const liquidityPoolAddress = context.CoreContract.get(coreAddress)!.liquidityPool_id

  resolveCondition(
    VERSION_V2,
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

Corev2Contract_ConditionStopped_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
  context.Condition.load(event.srcAddress + "_" + event.params.conditionId.toString(), {})
 });
Corev2Contract_ConditionStopped_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v2 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  pauseUnpauseCondition(
    conditionEntity,
    event.params.flag,
    BigInt(event.blockTimestamp),
    context
  )
});

Corev2Contract_NewBet_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
  context.Condition.load(event.srcAddress + "_" + event.params.conditionId.toString(), {})
 });
Corev2Contract_NewBet_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v2 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  const lp = context.CoreContract.get(coreAddress)!.liquidityPool_id
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(lp)!

  const outcomeEntityId = getEntityId(conditionEntity.id, event.params.outcomeId.toString())
  const outcomeEntity = context.Outcome.get(outcomeEntityId)!

  createBet(
    VERSION_V2,
    BET_TYPE_ORDINAR.toString(),
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
    event.blockTimestamp,
    event.blockNumber,
    event.params.funds,
    context,
  )
 });

Corev2Contract_OddsChanged_loader(({ event, context }) => {
  context.Condition.load(event.srcAddress + "_" + event.params.conditionId.toString(), {})
  context.CoreContract.load(event.srcAddress, {})
 });
Corev2Contract_OddsChanged_handler(async ({ event, context }) => { 
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV2FromId(event.srcAddress, event.chainId, conditionId)
  const conditionData = deserialiseConditionV2Result(_conditionData.condition)

  const conditionEntityId = coreAddress + "_" + conditionId.toString()
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v2 handleNewBet handleOddsChanged not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  let outcomesEntities: OutcomeEntity[] = []

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = getEntityId(conditionEntity.id, conditionEntity.outcomesIds![i].toString())
    const outcomeEntity = context.Outcome.get(outcomeEntityId)!
    outcomesEntities = outcomesEntities.concat([outcomeEntity])
  }

  updateConditionOdds(
    VERSION_V2, 
    conditionEntity, 
    outcomesEntities, 
    conditionData.virtualFunds,
    event.blockNumber,
    context,
  )
});
