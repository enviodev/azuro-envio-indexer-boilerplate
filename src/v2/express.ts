// import {
//   Expressv2Contract_NewBet_loader,
//   Expressv2Contract_NewBet_handler,
//   Expressv2Contract_Transfer_loader,
//   Expressv2Contract_Transfer_handler,
// } from "../../generated/src/Handlers.gen";
// import { transferBet } from "../common/bets";

// Expressv2Contract_NewBet_loader(({ event, context }) => { });
// Expressv2Contract_NewBet_handler(({ event, context }) => {
//   const expressAddress = event.srcAddress
//   const prematchAddress = context..load(expressAddress)!.prematchAddress




//   let conditionEntities: Condition[] = []
//   let outcomeEntities: Outcome[] = []
//   let conditionOdds: BigInt[] = []

//   for (let i = 0; i < event.params.bet.subBets.length; i++) {
//     const bet = event.params.bet.subBets[i]

//     const conditionEntityId = getConditionEntityId(prematchAddress, bet.conditionId.toString())
//     const conditionEntity = Condition.load(conditionEntityId)

//     // TODO remove later
//     if (!conditionEntity) {
//       log.error('v2 handleNewBet express conditionEntity not found. conditionEntityId = {}', [conditionEntityId])

//       return
//     }

//     conditionEntities[i] = conditionEntity

//     const outcomeEntityId = getOutcomeEntityId(conditionEntityId, bet.outcomeId.toString())
//     const outcomeEntity = Outcome.load(outcomeEntityId)

//     // TODO remove later
//     if (!outcomeEntity) {
//       log.error('v2 handleNewBet express outcomeEntity not found. outcomeEntityId = {}', [outcomeEntityId])

//       return
//     }

//     outcomeEntities[i] = outcomeEntity

//     conditionOdds[i] = event.params.bet.conditionOdds[i]
//   }

//   const lp = CoreContract.load(prematchAddress)!.liquidityPool
//   const liquidityPoolContractEntity = LiquidityPoolContract.load(lp)!

//   createBet(
//     VERSION_V2,
//     BET_TYPE_EXPRESS.toString(),
//     conditionEntities,
//     outcomeEntities,
//     conditionOdds,
//     event.params.bet.odds,
//     expressAddress,
//     event.params.bettor,
//     event.params.bet.affiliate,
//     event.params.betId,
//     liquidityPoolContractEntity.tokenDecimals,
//     event.params.bet.amount,
//     event.transaction.hash.toHexString(),
//     event.block,
//     null,
//   )
// });

// Expressv2Contract_Transfer_loader(({ event, context }) => { });
// Expressv2Contract_Transfer_handler(({ event, context }) => {
//   const betEntity = transferBet(
//     event.address.toHexString(),
//     null,
//     event.params.tokenId,
//     event.params.from,
//     event.params.to,
//     event.blockNumber,
//     context,
//   )
// });
