import {
  Expressv2Contract_NewBet_loader,
  Expressv2Contract_NewBet_handler,
  Expressv2Contract_Transfer_loader,
  Expressv2Contract_Transfer_handler,
} from "../../generated/src/Handlers.gen";
import { createBet, transferBet } from "../common/bets";
import { BET_TYPE_EXPRESS, VERSION_V2 } from "../constants";
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen";

Expressv2Contract_NewBet_loader(({ event, context }) => { });
Expressv2Contract_NewBet_handler(({ event, context }) => {
  const expressAddress = event.srcAddress
  const prematchAddress = context.ExpressPrematchRelation.get(expressAddress)!.prematchAddress

  let conditionEntities: ConditionEntity[] = []
  let outcomeEntities: OutcomeEntity[] = []
  let conditionOdds: bigint[] = []

  context.log.debug(`Expressv2Contract_NewBet_handler: ${event.srcAddress}`)
  throw new Error("Expressv2Contract_NewBet_handler not implemented")

  // for (let i = 0; i < event.params.bet.subBets.length; i++) {
  //   const bet = event.params.bet.subBets[i]

  //   const conditionEntityId = prematchAddress + "_" + bet.conditionId.toString()
  //   const conditionEntity = context.Condition.get(conditionEntityId)

  //   // TODO remove later
  //   if (!conditionEntity) {
  //     context.log.error(`v2 handleNewBet express conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
  //     return
  //   }

  //   conditionEntities[i] = conditionEntity

  //   const outcomeEntityId = conditionEntityId +  bet.outcomeId.toString()
  //   const outcomeEntity = context.Outcome.get(outcomeEntityId)

  //   // TODO remove later
  //   if (!outcomeEntity) {
  //     context.log.error(`v2 handleNewBet express outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
  //     return
  //   }

  //   outcomeEntities[i] = outcomeEntity

  //   conditionOdds[i] = event.params.bet.conditionOdds[i]
  // }

  // const lp = context.CoreContract.get(prematchAddress)!.liquidityPool_id
  // const liquidityPoolContractEntity = context.LiquidityPoolContract.get(lp)!

  // createBet(
  //   VERSION_V2,
  //   BET_TYPE_EXPRESS,
  //   conditionEntities,
  //   outcomeEntities,
  //   conditionOdds,
  //   event.params.bet.odds,
  //   expressAddress,
  //   event.params.bettor,
  //   event.params.bet.affiliate,
  //   event.params.betId,
  //   liquidityPoolContractEntity.tokenDecimals,
  //   event.params.bet.amount,
  //   event.transactionHash,
  //   event.blockTimestamp,
  //   event.blockNumber,
  //   null,
  //   context,
  // )
});

Expressv2Contract_Transfer_loader(({ event, context }) => { });
Expressv2Contract_Transfer_handler(({ event, context }) => {
  context.log.debug(`Expressv2Contract_Transfer_handler address: ${event.srcAddress}`)
  const betEntity = transferBet(
    event.srcAddress,
    null,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context,
  )
});
