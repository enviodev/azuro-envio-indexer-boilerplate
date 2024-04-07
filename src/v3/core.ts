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
} from "../../generated/src/Handlers.gen";
import { createBet } from "../common/bets";
import { pauseUnpauseCondition, resolveCondition, updateConditionMargin, updateConditionOdds, updateConditionReinforcement } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V3 } from "../constants";
import { OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Corev3Contract_ConditionCreated_loader(({ event, context }) => {});
Corev3Contract_ConditionCreated_handler(({ event, context }) => {});

Corev3Contract_ConditionResolved_loader(({ event, context }) => {});
Corev3Contract_ConditionResolved_handler(({ event, context }) => {
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

Corev3Contract_ConditionStopped_loader(({ event, context }) => {});
Corev3Contract_ConditionStopped_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v3 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  pauseUnpauseCondition(conditionEntity, event.params.flag, event.blockNumber, event.blockTimestamp, context)
});

Corev3Contract_NewBet_loader(({ event, context }) => {});
Corev3Contract_NewBet_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v3 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  const lp = context.CoreContract.get(coreAddress)!.liquidityPool_id
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(lp)!

  const outcomeEntityId = getEntityId(
    conditionEntity.id,
    event.params.outcomeId.toString(),
  )
  const outcomeEntity = context.Outcome.get(outcomeEntityId)!

  createBet(
    VERSION_V3,
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
    event.blockNumber,
    event.blockTimestamp,
    event.params.funds,
    context
  )
});

Corev3Contract_OddsChanged_loader(({ event, context }) => {});
Corev3Contract_OddsChanged_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const coreSC = Core.bind(event.address)
  const conditionData = coreSC.try_getCondition(conditionId)

  if (conditionData.reverted) {
    context.log.error(`getCondition reverted. conditionId = ${conditionId.toString()}`)
    return
  }

  const conditionEntityId = getEntityId(
    coreAddress,
    conditionId.toString(),
  )
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(
      `v3 handleNewBet handleOddsChanged not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  let outcomesEntities: OutcomeEntity[] = []

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = getEntityId(
      conditionEntity.id,
      conditionEntity.outcomesIds![i].toString(),
    )
    const outcomeEntity = context.Outcome.get(outcomeEntityId)!

    outcomesEntities = outcomesEntities.concat([outcomeEntity])
  }

  updateConditionOdds(
    VERSION_V3,
    conditionEntity,
    outcomesEntities,
    conditionData.value.virtualFunds,
    event.blockNumber,
    context,
  )
});

Corev3Contract_MarginChanged_loader(({ event, context }) => {});
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
    context.log.error(`v3 handleMarginChanged conditionEntity not found. conditionEntityId = {conditionEntityId}`)
    return
  }

  updateConditionMargin(conditionEntity, event.params.newMargin, event.blockTimestamp, context)
});

Corev3Contract_ReinforcementChanged_loader(({ event, context }) => {});
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
    context.log.error(`v3 handleReinforcementChanged conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  updateConditionReinforcement(
    conditionEntity,
    event.params.newReinforcement,
    event.blockTimestamp,
    context,
  )
});
