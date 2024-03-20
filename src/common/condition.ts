import { ConditionEntity } from "../../generated/src/Types.gen";
import { Condition } from "../src/DbFunctions.bs";
import { getOdds } from '../utils/math'

export function createCondition(
  version: string,
  coreAddress: string,
  conditionId: bigint,
  gameEntityId: string,
  margin: bigint,
  reinforcement: bigint,
  outcomes: bigint[],
  funds: bigint[],
  winningOutcomesCount: number,  // number?
  isExpressForbidden: boolean,
  provider: bigint,
  txHash: string,
  createBlock: number,  // number?
  startsAt: bigint | null = null,
): ConditionEntity {

  const conditionEntityId = coreAddress + "_" + conditionId.toString()

  const conditionEntity: ConditionEntity = {
    id: conditionEntityId,
    core_id: coreAddress,
    coreAddress: coreAddress,
    conditionId: conditionId,
    // game: gameEntityId,
    _winningOutcomesCount: winningOutcomesCount,
    // isExpressForbidden: isExpressForbidden,
    // createdTxHash: txHash,
    // createdBlockNumber: createBlock.number,
    // createdBlockTimestamp: createBlock.timestamp,
    // status: CONDITION_STATUS_CREATED.toString(),
    margin: margin,
    // reinforcement: reinforcement,
    // turnover: BigInt.zero(),
    // provider: provider,
    // status: CONDITION_STATUS_CREATED.toString()
    // margin: margin
    // reinforcement: reinforcement
    // turnover: BigInt.zero()
    // provider: provider

    // _updatedAt: createBlock.timestamp
  }

  const newOdds = getOdds(
    version,
    funds,
    conditionEntity.margin,
    conditionEntity._winningOutcomesCount,
  )

  return conditionEntity //  why are we returning here again?

  // context.ConditionEntity.set()
  //conditionEntity.save()

  // let outcomeIds: BigInt[] = []

  // for (let i = 0; i < outcomes.length; i++) {
  //   outcomeIds = outcomeIds.concat([outcomes[i]])

  //   const outcomeId = outcomes[i].toString()

  //   const outcomeEntityId = getOutcomeEntityId(conditionEntityId, outcomeId)
  //   const outcomeEntity = new Outcome(outcomeEntityId)

  //   outcomeEntity.core = coreAddress
  //   outcomeEntity.outcomeId = outcomes[i]
  //   outcomeEntity.condition = conditionEntity.id
  //   outcomeEntity.sortOrder = i
  //   outcomeEntity.fund = funds[i]
  //   outcomeEntity.rawCurrentOdds = newOdds[i]

  //   outcomeEntity._betsEntityIds = []
  //   outcomeEntity.currentOdds = toDecimal(
  //     outcomeEntity.rawCurrentOdds,
  //     BASES_VERSIONS.mustGetEntry(version).value,
  //   )
  //   outcomeEntity._updatedAt = createBlock.timestamp

  //   outcomeEntity.save()
  // }

  // conditionEntity.outcomesIds = outcomeIds

  // if (startsAt) {
  //   conditionEntity.internalStartsAt = startsAt
  // }

  // conditionEntity._updatedAt = createBlock.timestamp
  // conditionEntity.save()

  // const gameEntity = Game.load(gameEntityId)!

  // gameEntity._activeConditionsEntityIds = gameEntity._activeConditionsEntityIds!.concat([conditionEntityId])
  // gameEntity.hasActiveConditions = true
  // gameEntity.status = GAME_STATUS_CREATED.toString()

  // gameEntity._updatedAt = createBlock.timestamp

  // gameEntity.save()

  // const leagueEntity = League.load(gameEntity.league)!

  // if (!leagueEntity.activeGamesEntityIds!.includes(gameEntityId)) {
  //   leagueEntity.activeGamesEntityIds = leagueEntity.activeGamesEntityIds!.concat([gameEntityId])
  //   leagueEntity.hasActiveGames = true
  //   leagueEntity.save()

  //   const countryEntity = Country.load(leagueEntity.country)!

  //   if (!countryEntity.activeLeaguesEntityIds!.includes(leagueEntity.id)) {
  //     countryEntity.activeLeaguesEntityIds = countryEntity.activeLeaguesEntityIds!.concat([leagueEntity.id])
  //     countryEntity.hasActiveLeagues = true
  //     countryEntity.save()
  //   }
  // }

  // return conditionEntity
}