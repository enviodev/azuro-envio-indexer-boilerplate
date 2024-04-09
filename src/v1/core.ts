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
  context.CoreContract.load(event.srcAddress, {})
});
CoreContract_ConditionCreated_handlerAsync(async ({ event, context }) => {
  // const coreContractEntity = await context.CoreContract.get(event.srcAddress);

  // if (!coreContractEntity) {
  //   context.log.error(`coreContractEntity not found. coreContractEntityId = ${event.srcAddress}`)
  //   return
  // }

  // const conditionId = event.params.conditionId
  // const startsAt = event.params.timestamp
  // const _conditionData = await getConditionV1FromId(event.srcAddress, event.chainId, conditionId, context)
  // // context.log.debug(`_conditionData ${JSON.stringify(_conditionData.condition)}`)
  // const conditionData = deserialiseConditionV1Result(_conditionData.condition)

  // const coreAddress = event.srcAddress
  // const liquidityPoolAddress = coreContractEntity.liquidityPool_id

  // const gameEntity = createGame(
  //   liquidityPoolAddress,
  //   null,
  //   "", //conditionData.value.ipfsHash,
  //   null,
  //   startsAt,
  //   null,
  //   event.transactionHash,
  //   BigInt(event.blockNumber),
  //   BigInt(event.blockTimestamp),
  //   context,
  // )

  // if (!gameEntity) {
  //   context.log.error(`v1 ConditionCreated can\'t create game. conditionId = ${conditionId.toString()}`)
  //   return
  // }

  // createCondition(
  //   VERSION_V1,
  //   coreAddress,
  //   conditionId,
  //   gameEntity.id,
  //   conditionData.margin,
  //   conditionData.reinforcement,
  //   conditionData.outcomes,
  //   conditionData.fundBank,
  //   1,
  //   false,
  //   gameEntity.provider,
  //   event.transactionHash,
  //   event.blockNumber,
  //   event.blockTimestamp,
  //   context,
  //   startsAt,
  // )
});

CoreContract_ConditionResolved_loader(({ event, context }) => {
  context.CoreContract.load(event.srcAddress, {})
  context.Condition.load(event.srcAddress + "_" + event.params.conditionId.toString(), {})
});
CoreContract_ConditionResolved_handler(({ event, context }) => {
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v1 handleConditionResolved conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // const liquidityPoolAddress = context.CoreContract.get(coreAddress)!.liquidityPool_id

  // resolveCondition(
  //   VERSION_V1,
  //   liquidityPoolAddress,
  //   conditionEntityId,
  //   [event.params.outcomeWin],
  //   event.transactionHash,
  //   event.blockNumber,
  //   event.blockTimestamp,
  //   event.chainId,
  //   context,
  // )
});

CoreContract_ConditionShifted_loader(({ event, context }) => {
});
CoreContract_ConditionShifted_handler(({ event, context }) => {
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = getEntityId(coreAddress, conditionId.toString())
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v1 ConditionShifted conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // shiftGame(conditionEntity.game_id, event.params.newTimestamp, event.transactionHash, event.blockNumber, event.blockTimestamp, context)

  // context.Condition.set({
  //   ...conditionEntity,
  //   internalStartsAt: event.params.newTimestamp,
  //   _updatedAt: BigInt(event.blockTimestamp),
  // })

});

CoreContract_ConditionStopped_loader(({ event, context }) => {
  
});
CoreContract_ConditionStopped_handler(({ event, context }) => { 
  // const conditionId = event.params.conditionId
  // const coreAddress = event.srcAddress

  // const conditionEntityId = coreAddress + "_" + conditionId.toString()
  // const conditionEntity = context.Condition.get(conditionEntityId)

  // // TODO remove later
  // if (!conditionEntity) {
  //   context.log.error(`v1 handleConditionStopped conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //   return
  // }

  // pauseUnpauseCondition(
  //   conditionEntity, 
  //   event.params.flag, 
  //   BigInt(event.blockTimestamp), 
  //   context
  // )
});

CoreContract_LpChanged_loader(async ({ event, context }) => {
  await context.contractRegistration.addLP(event.params.newLp);
  context.CoreContract.load(event.srcAddress, {});

  const resp = await getAzuroBetAddress(event.params.newLp, event.chainId)
  await context.contractRegistration.addAzurobets(resp.azuroBetAddress)
});

CoreContract_LpChanged_handlerAsync(async ({ event, context }) => {
  // const coreAddress = event.srcAddress
  // const liquidityPoolAddress = event.params.newLp;

  // const token = await getTokenForPool(liquidityPoolAddress, event.chainId);

  // const liquidityPool = await createPoolEntity(
  //   VERSION_V1,
  //   coreAddress,
  //   liquidityPoolAddress,
  //   token.token,
  //   BigInt(event.blockNumber),
  //   BigInt(event.blockTimestamp),
  //   event.chainId,
  //   context,
  // );

  // const coreContractEntity = await context.CoreContract.get(event.srcAddress);

  // if (!coreContractEntity) {
  //   createCoreEntity(event.srcAddress, 
  //     liquidityPool, 
  //     CORE_TYPE_PRE_MATCH, 
  //     context,
  //   );
  // }

  // const resp = await getAzuroBetAddress(liquidityPoolAddress, event.chainId)

  // createAzuroBetEntity(coreAddress, resp.azuroBetAddress, context)
});
