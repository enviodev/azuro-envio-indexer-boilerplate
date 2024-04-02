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
} from "../../generated/src/Handlers.gen";

import { getTokenForPool } from "../contracts/lpv1";

import { createPoolEntity } from "../common/pool";
import { createCoreContractEntity } from "../common/factory";
import { createCondition, pauseUnpauseCondition, resolveCondition } from "../common/condition";
import { VERSION_V1 } from "../constants";
import { createAzuroBetEntity } from "../common/azurobet";
import { ConditionEntity, coreContractEntity } from "../src/Types.gen";
import { shiftGame } from "../common/games";

CoreContract_ConditionCreated_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
});
CoreContract_ConditionCreated_handler(({ event, context }) => {
  const coreContractEntity = context.CoreContract.get(event.srcAddress);

  if (!coreContractEntity) {
    context.log.error(`coreContractEntity not found. coreContractEntityId = ${event.srcAddress}`)
    return
  }

  const conditionId = event.params.conditionId
  const startsAt = event.params.timestamp

  const coreSC = CoreV1.bind(event.srcAddress)
  const conditionData = coreSC.try_getCondition(conditionId)

  if (conditionData.reverted) {
    context.log.error('getCondition reverted. conditionId = {}')
    return
  }

  const coreAddress = event.srcAddress
  const liquidityPoolAddress = coreContractEntity.liquidityPool_id

  // const liquidityPoolAddress = CoreContract.load(coreAddress)!.liquidityPool

  const gameEntity = createGame(
    coreContractEntity?.liquidityPool_id,
    null,
    "", //conditionData.value.ipfsHash,
    null,
    startsAt,
    null,
    event.transactionHash,
    event.blockNumber,
  )

  if (!gameEntity) {
    context.log.error('v1 ConditionCreated can\'t create game. conditionId = {}')
    return
  }

  let conditionCreated = createCondition(
    VERSION_V1,
    event.srcAddress,
    conditionId,
    gameEntity.id,
    conditionData.value.margin,
    conditionData.value.reinforcement,
    conditionData.value.outcomes,
    conditionData.value.fundBank,
    1,
    false,
    gameEntity.provider,
    event.transactionHash,
    event.blockNumber,
    startsAt,
  )

  context.Condition.set(conditionCreated)
});

CoreContract_ConditionResolved_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
});
CoreContract_ConditionResolved_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = coreAddress + "_" + conditionId.toString()
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v1 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntity}`)
    return
  }

  const liquidityPoolAddress = context.CoreContract.get(coreAddress)!.liquidityPool_id

  resolveCondition(
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
});
CoreContract_ConditionShifted_handler(({ event, context }) => {
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = coreAddress + "_" + conditionId
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
    _updatedAt: event.blockTimestamp,
  })

});

CoreContract_ConditionStopped_loader(({ event, context }) => { });
CoreContract_ConditionStopped_handler(({ event, context }) => { 
  const conditionId = event.params.conditionId
  const coreAddress = event.srcAddress

  const conditionEntityId = coreAddress + "_" + conditionId.toString()
  const conditionEntity = context.Condition.get(conditionEntityId)

  // TODO remove later
  if (!conditionEntity) {
    context.log.error(`v1 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)

    return
  }

  pauseUnpauseCondition(conditionEntity, event.params.flag, event.blockNumber, event.blockTimestamp, context)
});

CoreContract_LpChanged_loader(async ({ event, context }) => {
  await context.contractRegistration.addLP(event.params.newLp);
  context.CoreContract.load(event.srcAddress, {});
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
    event.blockNumber,
    event.blockTimestamp,
    event.chainId
  );

  context.LiquidityPoolContract.set(liquidityPool);

  const coreContractEntity = await context.CoreContract.get(event.srcAddress);

  if (!coreContractEntity) {
    let coreContract = createCoreContractEntity(event.srcAddress, liquidityPoolAddress, "v1");
    context.CoreContract.set(coreContract);
  }

  const azuroBetAddress = liquidityPoolSC.try_azuroBet()

  if (azuroBetAddress.reverted) {
    context.log.error('v1 handleLpChanged call azuroBet reverted')

    return
  }

  createAzuroBetEntity(coreAddress, azuroBetAddress, context)

  AzuroBetV1.create(azuroBetAddress.value)

});
