import {
    LiveCorev1Contract_ConditionCreated_loader,
    LiveCorev1Contract_ConditionCreated_handler,
    LiveCorev1Contract_ConditionResolved_loader,
    LiveCorev1Contract_ConditionResolved_handler,
    LiveCorev1Contract_NewLiveBet_loader,
    LiveCorev1Contract_NewLiveBet_handler,
    LiveCorev1Contract_ConditionCreated_handlerAsync,
    LiveCorev1Contract_ConditionResolved_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createLiveBet } from "../common/bets";
import { createLiveCondition, resolveLiveCondition } from "../common/condition";
import { BET_TYPE_ORDINAR, VERSION_V3 } from "../constants";
import { deserialiseConditionV3Result } from "../contracts/corev3";
import { getLiveConditionFromId } from "../contracts/livecore";
import { getEntityId } from "../utils/schema";

LiveCorev1Contract_ConditionCreated_loader(({ event, context }) => {
    context.log.debug(`LiveCorev1Contract_ConditionCreated_loader: ${event.srcAddress}`)
});
LiveCorev1Contract_ConditionCreated_handlerAsync(async ({ event, context }) => {
    // const conditionId = event.params.conditionId
    // const coreAddress = event.srcAddress

    // context.log.error(`livecore.ts: handleConditionCreated not implemented, address needed ${event.srcAddress}`)
    
    // const _conditionData = await getLiveConditionFromId(event.srcAddress, event.chainId, conditionId)
    // const conditionData = deserialiseConditionV3Result(_conditionData.condition)
    
    // console.log("LiveCoreV1 address", event.srcAddress)
    // createLiveCondition(
    //     coreAddress,
    //     conditionId,
    //     event.params.gameId,
    //     event.params.outcomes,
    //     1, // conditionData.value.winningOutcomesCount
    //     event.transactionHash,
    //     event.blockNumber,
    //     event.blockTimestamp,
    //     context,
    // )
    // throw new Error(`livecore.ts: handleConditionCreated not implemented, address needed ${event.srcAddress}`)
});

LiveCorev1Contract_ConditionResolved_loader(({ event, context }) => {
    const liveConditionId = event.params.conditionId
    const coreAddress = event.srcAddress

    const liveConditionEntityId = getEntityId(
        coreAddress,
        liveConditionId.toString(),
    )
    context.LiveCondition.load(liveConditionEntityId, {})

    const winningOutcomes = event.params.winningOutcomes
    for (let i = 0; i < winningOutcomes.length; i++) {
        const liveOutcomeEntityId = getEntityId(
            liveConditionEntityId,
            winningOutcomes[i].toString(),
        )
        context.LiveOutcome.load(liveOutcomeEntityId, { })
    }
});
LiveCorev1Contract_ConditionResolved_handlerAsync(async ({ event, context }) => {
    const liveConditionId = event.params.conditionId
    const coreAddress = event.srcAddress

    const liveConditionEntityId = getEntityId(
        coreAddress,
        liveConditionId.toString(),
    )
    const liveConditionEntity = await context.LiveCondition.get(liveConditionEntityId)

    // TODO remove later
    if (!liveConditionEntity) {
        throw new Error(`handleConditionResolved liveConditionEntity not found. liveConditionEntityId = ${liveConditionEntityId}`)
        return
    }

    await resolveLiveCondition(
        liveConditionEntityId,
        event.params.winningOutcomes,
        event.transactionHash,
        BigInt(event.blockNumber),
        BigInt(event.blockTimestamp),
        context,
    )
});

LiveCorev1Contract_NewLiveBet_loader(({ event, context }) => {
    const coreAddress = event.srcAddress
    const liveConditionId = event.params.conditionId

    const liveConditionEntityId = getEntityId(
        coreAddress,
        liveConditionId.toString(),
    )

    const liveOutcomeEntityId = getEntityId(
        liveConditionEntityId,
        event.params.outcomeId.toString(),
    )

    context.CoreContract.load(coreAddress, { loadLiquidityPool: true })
    context.LiveCondition.load(liveConditionEntityId, {})
    context.LiveOutcome.load(liveOutcomeEntityId, {})
});
LiveCorev1Contract_NewLiveBet_handler(({ event, context }) => {
    const liveConditionId = event.params.conditionId
    const coreAddress = event.srcAddress

    const liveConditionEntityId = getEntityId(
        coreAddress,
        liveConditionId.toString(),
    )

    const liveConditionEntity = context.LiveCondition.get(liveConditionEntityId)

    if (!liveConditionEntity) {
        throw new Error('handleNewLiveBet liveConditionEntity not found. liveConditionEntityId = ${liveConditionEntityId}')
    }

    const liquidityPoolAddress = context.CoreContract.get(coreAddress)!.liquidityPool_id
    const liquidityPoolContractEntity = context.LiquidityPoolContract.get(liquidityPoolAddress)!

    const liveOutcomeEntityId = getEntityId(
        liveConditionEntity.id,
        event.params.outcomeId.toString(),
    )

    const liveOutcomeEntity = context.LiveOutcome.get(liveOutcomeEntityId)!

    createLiveBet(
        VERSION_V3,
        BET_TYPE_ORDINAR,
        [liveConditionEntity],
        [liveOutcomeEntity],
        [event.params.odds],
        event.params.odds,
        liveConditionEntity.coreAddress,
        event.params.bettor,
        event.params.affiliate,
        event.params.tokenId,
        liquidityPoolContractEntity.tokenDecimals,
        event.params.amount,
        event.params.payoutLimit,
        event.transactionHash,
        BigInt(event.blockNumber),
        BigInt(event.blockTimestamp),
        context,
    )
});
