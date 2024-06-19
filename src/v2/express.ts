import {
  Expressv2Contract_NewBet_loader,
  Expressv2Contract_NewBet_handler,
  Expressv2Contract_Transfer_loader,
  Expressv2Contract_Transfer_handler,
  Expressv2Contract_Transfer_handlerAsync,
  Expressv2Contract_NewBet_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { createBet, transferBet } from "../common/bets";
import { BET_TYPE_EXPRESS, VERSION_V2 } from "../constants";
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

Expressv2Contract_NewBet_loader(({ event, context }) => {
  context.ExpressPrematchRelation.load(event.srcAddress);
});
Expressv2Contract_NewBet_handlerAsync(async ({ event, context }) => {
  // struct Bet {
  //     address affiliate; // 0
  //     uint64 odds; // 1
  //     uint128 amount; // 2
  //     uint48 leaf; // 3
  //     bool isClaimed; // 4
  //     SubBet[] subBets; // 5
  //     uint64[] conditionOdds; // 6
  // }

  // struct SubBet {
  //   uint256 conditionId; // the match or condition ID
  //   uint64 outcomeId; // predicted outcome
  // }

  const expressAddress = event.srcAddress
  const prematchAddress = (await context.ExpressPrematchRelation.get(expressAddress))!.prematchAddress

  let conditionEntities: ConditionEntity[] = []
  let outcomeEntities: OutcomeEntity[] = []
  let conditionOdds: bigint[] = []

  conditionOdds = event.params.bet[6]
  const _subBet = event.params.bet[5]

  for (let i = 0; i < _subBet.length; i++) {
    const subBet = _subBet[i]
    const conditionId = subBet[0]
    const outcomeId = subBet[1]

    const conditionEntityId = getEntityId(prematchAddress, conditionId.toString())
    const conditionEntity = await context.Condition.get(conditionEntityId)

    // TODO remove later
    if (!conditionEntity) {
      context.log.error(`v2 handleNewBet express conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
      return
    }

    conditionEntities[i] = conditionEntity

    const outcomeEntityId = getEntityId(conditionEntityId, outcomeId.toString())
    const outcomeEntity = await context.Outcome.get(outcomeEntityId)

    // TODO remove later
    if (!outcomeEntity) {
      throw new Error(`v2 handleNewBet express outcomeEntity not found. outcomeEntityId = ${outcomeEntityId}`)
    }

    outcomeEntities[i] = outcomeEntity
    conditionOdds[i] = conditionOdds[i]
  }

  const lp = (await context.CoreContract.get(prematchAddress))!.liquidityPool_id
  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(lp))!

  await createBet(
    VERSION_V2,
    BET_TYPE_EXPRESS,
    conditionEntities,
    outcomeEntities,
    conditionOdds,
    event.params.bet[1],
    expressAddress,
    event.params.bettor,
    event.params.bet[0],
    event.params.betId,
    liquidityPoolContractEntity.tokenDecimals,
    event.params.bet[2],
    event.transactionHash,
    BigInt(event.blockTimestamp),
    BigInt(event.blockNumber),
    null,
    context,
  )
});

Expressv2Contract_Transfer_loader(({ event, context }) => { });
Expressv2Contract_Transfer_handlerAsync(async ({ event, context }) => {
  await transferBet(
    event.srcAddress,
    null,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockTimestamp,
    context,
  )
});
