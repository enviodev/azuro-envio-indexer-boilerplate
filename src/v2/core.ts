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
  Corev2Contract_NewBet_handlerAsync,
  Corev2Contract_ConditionResolved_handlerAsync,
  Corev2Contract_OddsChanged_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createCondition, pauseUnpauseCondition, resolveCondition, updateConditionOdds } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V2 } from "../constants";
import { deserialiseConditionV2Result, getConditionV2FromId } from "../contracts/corev2";
import { createBet } from "../common/bets";
import { OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Corev2Contract_ConditionCreated_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
});
Corev2Contract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV2FromId(event.srcAddress, event.chainId, conditionId, context)
  const conditionData = deserialiseConditionV2Result(_conditionData.condition)

  const coreContractEntity = await context.CoreContract.get(coreAddress)

  if (!coreContractEntity) {
    throw new Error(`v2 ConditionCreated coreContractEntity not found. coreAddress = ${coreAddress}`)
  }

  const liquidityPoolAddress = coreContractEntity.liquidityPool_id
  const gameEntityId = getEntityId(liquidityPoolAddress, event.params.gameId.toString())
  const gameEntity = await context.Game.get(gameEntityId)

  // TODO remove later
  if (!gameEntity) {
    throw new Error(`v2 ConditionCreated gameEntity not found. gameEntityId = ${gameEntityId}`)
  }

  await createCondition(
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
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {})
});
Corev2Contract_ConditionResolved_handlerAsync(async({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v2 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  const liquidityPoolAddress = (await context.CoreContract.get(coreAddress))!.liquidityPool_id

  await resolveCondition(
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
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {loadGame: {}})
});
Corev2Contract_ConditionStopped_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v2 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  pauseUnpauseCondition(
    conditionEntity,
    event.params.flag,
    BigInt(event.blockTimestamp),
    context
  )
});

Corev2Contract_NewBet_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {loadLiquidityPool: true})
  
  const conditionEntityId = getEntityId(event.srcAddress, event.params.conditionId.toString())
  context.Condition.load(conditionEntityId, {})
  
  const outComeEntityId = getEntityId(conditionEntityId,event.params.outcomeId.toString())
  context.Outcome.load(outComeEntityId, {})
});
Corev2Contract_NewBet_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = await context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v2 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  }

  const lp = (await context.CoreContract.get(coreAddress))!.liquidityPool_id
  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(lp))!

  const outcomeEntityId = getEntityId(conditionEntity.id, event.params.outcomeId.toString())
  const outcomeEntity = await context.Outcome.get(outcomeEntityId)

  if (!outcomeEntity) {
    throw new Error(`Outcome not found with id ${outcomeEntityId}`)
  }

  await createBet(
    VERSION_V2,
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
    BigInt(event.blockTimestamp),
    BigInt(event.blockNumber),
    event.params.funds,
    context,
  )
});

Corev2Contract_OddsChanged_loader(({ event, context }) => {
  context.Condition.load(getEntityId(event.srcAddress, event.params.conditionId.toString()), {})
  context.CoreContract.load(event.srcAddress, {})
});
Corev2Contract_OddsChanged_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const _conditionData = await getConditionV2FromId(event.srcAddress, event.chainId, conditionId, context)
  const conditionData = deserialiseConditionV2Result(_conditionData.condition)

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = await context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    throw new Error(`v2 handleNewBet handleOddsChanged not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  let outcomesEntities: OutcomeEntity[] = []

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = getEntityId(conditionEntity.id, conditionEntity.outcomesIds![i].toString())
    const outcomeEntity = await context.Outcome.get(outcomeEntityId)

    if (!outcomeEntity) {
      throw new Error(`v2 handleNewBet handleOddsChanged outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
    }

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
