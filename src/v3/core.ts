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
} from "../../generated/src/Handlers.gen";
import { createBet } from "../common/bets";
import { createCondition, pauseUnpauseCondition, resolveCondition, updateConditionMargin, updateConditionOdds, updateConditionReinforcement } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V3 } from "../constants";
import { getConditionV3FromId } from "../contracts/corev3";
import { OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Corev3Contract_ConditionCreated_loader(({ event, context }) => { });
Corev3Contract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  throw new Error(`v3 event address needed: ${event.srcAddress}`)

  const conditionData = await getConditionV3FromId(event.srcAddress, event.chainId, conditionId)

  const liquidityPoolAddress = (await context.CoreContract.get(coreAddress))!.liquidityPool_id
  const gameEntityId = getEntityId(
    liquidityPoolAddress,
    event.params.gameId.toString(),
  )

  const gameEntity = await context.Game.get(gameEntityId)

  // TODO remove later
  if (!gameEntity) {
    context.log.error('v3 ConditionCreated gameEntity not found. gameEntityId = ${gameEntityId}')
    return
  }

  // createCondition(
  //   VERSION_V3,
  //   coreAddress,
  //   conditionId,
  //   gameEntity.id,
  //   conditionData.margin,
  //   conditionData.reinforcement,
  //   event.params.outcomes,
  //   conditionData.virtualFunds,
  //   conditionData.winningOutcomesCount,
  //   conditionData.isExpressForbidden,
  //   gameEntity.provider,
  //   event.transactionHash,
  //   event.blockNumber,
  //   event.blockTimestamp,
  //   context,
  // )
});

Corev3Contract_ConditionResolved_loader(({ event, context }) => { });
Corev3Contract_ConditionResolved_handler(({ event, context }) => {
  throw new Error(`v3 event core (condition resolved) address needed: ${event.srcAddress}`)
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(
      `v3 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntityId}`,
    )
    return
  }

  const liquidityPoolAddress = context.CoreContract.get(coreAddress)!.liquidityPool_id

  resolveCondition(
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

Corev3Contract_ConditionStopped_loader(({ event, context }) => { });
Corev3Contract_ConditionStopped_handler(({ event, context }) => {
  throw new Error(`v3 event core (condition stopped) address needed: ${event.srcAddress}`)
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v3 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // pauseUnpauseCondition(
  //   conditionEntity,
  //   event.params.flag,
  //   BigInt(event.blockTimestamp),
  //   context,
  // )
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
Corev3Contract_NewBet_handler(({ event, context }) => {
  throw new Error(`v3 core event address needed: ${event.srcAddress}`)
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(
  //   coreAddress,
  //   conditionId.toString(),
  // )
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v3 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // const lp = context.CoreContract.get(coreAddress)!.liquidityPool_id
  // const liquidityPoolContractEntity = context.LiquidityPoolContract.get(lp)!

  // const outcomeEntityId = getEntityId(
  //   conditionEntity.id,
  //   event.params.outcomeId.toString(),
  // )
  // const outcomeEntity = context.Outcome.get(outcomeEntityId)!

  // createBet(
  //   VERSION_V3,
  //   BET_TYPE_ORDINAR,
  //   [conditionEntity],
  //   [outcomeEntity],
  //   [event.params.odds],
  //   event.params.odds,
  //   conditionEntity.coreAddress,
  //   event.params.bettor,
  //   event.params.affiliate,
  //   event.params.tokenId,
  //   liquidityPoolContractEntity.tokenDecimals,
  //   event.params.amount,
  //   event.transactionHash,
  //   BigInt(event.blockNumber),
  //   BigInt(event.blockTimestamp),
  //   event.params.funds,
  //   context
  // )
});

Corev3Contract_OddsChanged_loader(({ event, context }) => { });
Corev3Contract_OddsChanged_handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionData = await getConditionV3FromId(event.srcAddress, event.chainId, conditionId)
  throw new Error(`v3 core event address needed: ${event.srcAddress}`)
  // const conditionEntityId = getEntityId(
  //   coreAddress,
  //   conditionId.toString(),
  // )
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(
  //     `v3 handleNewBet handleOddsChanged not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // let outcomesEntities: OutcomeEntity[] = []

  // for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
  //   const outcomeEntityId = getEntityId(
  //     conditionEntity.id,
  //     conditionEntity.outcomesIds![i].toString(),
  //   )
  //   const outcomeEntity = context.Outcome.get(outcomeEntityId)!

  //   outcomesEntities = outcomesEntities.concat([outcomeEntity])
  // }

  // updateConditionOdds(
  //   VERSION_V3,
  //   conditionEntity,
  //   outcomesEntities,
  //   conditionData.virtualFunds,
  //   event.blockNumber,
  //   context,
  // )
});

Corev3Contract_MarginChanged_loader(({ event, context }) => { });
Corev3Contract_MarginChanged_handler(({ event, context }) => {
  throw new Error(`v3 core (margin changed) event address needed: ${event.srcAddress}`)
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(
  //   coreAddress,
  //   conditionId.toString(),
  // )
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v3 handleMarginChanged conditionEntity not found. conditionEntityId = {conditionEntityId}`)
  //   return
  // }

  // updateConditionMargin(conditionEntity, event.params.newMargin, event.blockTimestamp, context)
});

Corev3Contract_ReinforcementChanged_loader(({ event, context }) => { });
Corev3Contract_ReinforcementChanged_handler(({ event, context }) => {
  throw new Error(`v3 core (reinforcement changed) event address needed: ${event.srcAddress}`)
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(
  //   coreAddress,
  //   conditionId.toString(),
  // )

  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v3 handleReinforcementChanged conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // updateConditionReinforcement(
  //   conditionEntity,
  //   event.params.newReinforcement,
  //   event.blockTimestamp,
  //   context,
  // )
});
