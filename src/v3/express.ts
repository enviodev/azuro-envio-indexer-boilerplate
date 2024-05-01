import {
  Expressv3Contract_NewBet_loader,
  Expressv3Contract_NewBet_handler,
  Expressv3Contract_Transfer_loader,
  Expressv3Contract_Transfer_handler,
  Expressv3Contract_Transfer_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createBet, transferBet } from "../common/bets";
import { BET_TYPE_EXPRESS, VERSION_V3 } from "../constants";
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Expressv3Contract_NewBet_loader(({ event, context }) => {
  context.log.debug(`Expressv3Contract_NewBet_loader: ${event.srcAddress}`)
 });
Expressv3Contract_NewBet_handler(({ event, context }) => {
  throw new Error(`express v3 new bet not implemented: ${event.srcAddress}`)

  // const expressAddress = event.srcAddress
  // const prematchAddress = context.ExpressPrematchRelation.get(expressAddress)!.prematchAddress

  // let conditionEntities: ConditionEntity[] = []
  // let outcomeEntities: OutcomeEntity[] = []
  // let conditionOdds: bigint[] = []

  // for (let i = 0; i < event.params.bet.subBets.length; i++) {
  //   const bet = event.params.bet.subBets[i]

  //   const conditionEntityId = getEntityId(prematchAddress, bet.conditionId.toString())
  //   const conditionEntity = context.Condition.get(conditionEntityId)

  //   // TODO remove later
  //   if (!conditionEntity) {
  //     context.log.error(`v3 handleNewBet express conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //     return
  //   }

  //   conditionEntities[i] = conditionEntity

  //   const outcomeEntityId = getEntityId(conditionEntityId, bet.outcomeId.toString())
  //   const outcomeEntity = context.Outcome.get(outcomeEntityId)

  //   // TODO remove later
  //   if (!outcomeEntity) {
  //     context.log.error(`v3 handleNewBet express outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
  //     return
  //   }

  //   outcomeEntities[i] = outcomeEntity

  //   conditionOdds[i] = event.params.bet.conditionOdds[i]
  // }

  // const lp = context.CoreContract.get(prematchAddress)!.liquidityPool_id
  // const liquidityPoolContractEntity = context.LiquidityPoolContract.get(lp)!

  // await createBet(
  //   VERSION_V3,
  //   BET_TYPE_EXPRESS,
  //   conditionEntities,
  //   outcomeEntities,
  //   conditionOdds,
  //   event.params.bet.odds,
  //   expressAddress,
  //   event.params.bettor,
  //   event.params.affiliate,
  //   event.params.betId,
  //   liquidityPoolContractEntity.tokenDecimals,
  //   event.params.bet.amount,
  //   event.transactionHash,
  //   BigInt(event.blockTimestamp),
  //   BigInt(event.blockNumber),
  //   null,
  //   context,
  // )
});

Expressv3Contract_Transfer_loader(({ event, context }) => {
  const betEntityId = getEntityId(event.srcAddress, event.params.tokenId.toString())
  context.Bet.load(betEntityId, {})
 });
Expressv3Contract_Transfer_handlerAsync(async ({ event, context }) => {
  await transferBet(
    event.srcAddress,
    null,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context,
  )
});
