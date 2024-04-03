import { ConditionEntity, CoreContract_ConditionCreatedEvent_handlerContext, CoreContract_ConditionStoppedEvent_handlerContext, CountryEntity, GameEntity, LeagueEntity } from "../../generated/src/Types.gen";
import { BET_RESULT_LOST, BET_RESULT_WON, BET_STATUS_CANCELED, BET_STATUS_RESOLVED, BET_TYPE_EXPRESS, BET_TYPE_ORDINAR, CONDITION_STATUS_CANCELED, CONDITION_STATUS_CREATED, CONDITION_STATUS_PAUSED, CONDITION_STATUS_RESOLVED, GAME_STATUS_CANCELED, GAME_STATUS_CREATED, GAME_STATUS_PAUSED, GAME_STATUS_RESOLVED, SELECTION_RESULT_LOST, SELECTION_RESULT_WON, VERSION_V2, VERSION_V3 } from "../constants";
import { removeItem } from "../utils/array";
import { getOdds, toDecimal } from '../utils/math'
import { calcPayoutV2, calcPayoutV3 } from "./express";
import { countConditionResolved } from "./pool";

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

  return conditionEntity

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


export function resolveCondition(
  version: string,
  liquidityPoolAddress: string,
  conditionEntityId: string,
  winningOutcomes: bigint[],
  transactionHash: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: CoreContract_ConditionCreatedEvent_handlerContext,
): ConditionEntity | null {
  const conditionEntity: ConditionEntity = context.Condition.get(conditionEntityId)!

  const isCanceled = winningOutcomes.length === 0 || winningOutcomes[0] === 0n

  let betsAmount = 0n
  let wonBetsAmount = 0n

  if (isCanceled) {
    context.Condition.set({
      ...conditionEntity,
      status: CONDITION_STATUS_CANCELED,
    })
  }
  else {
    let wonOutcomes: string[] = []

    for (let i = 0; i < winningOutcomes.length; i++) {
      const outcomeEntityId = conditionEntity.id + "_" + winningOutcomes[i].toString()
      const outcomeEntity = context.Outcome.get(outcomeEntityId)!.id
      wonOutcomes = wonOutcomes.concat([outcomeEntity])
    }

    context.Condition.set({
      ...conditionEntity,
      // wonOutcomes: wonOutcomes, // arrays of entities unsupported
      wonOutcomeIds: winningOutcomes,
      status: CONDITION_STATUS_RESOLVED,
    })
  }

  context.Condition.set({
    ...conditionEntity,
    resolvedTxHash: transactionHash,
    resolvedBlockNumber: BigInt(blockNumber),
    resolvedBlockTimestamp: BigInt(blockTimestamp),
    _updatedAt: BigInt(blockTimestamp),
  })

  // TODO remove later
  if (!conditionEntity.outcomesIds) {
    context.log.error(`resolveCondition outcomesIds is empty.`)
    return null
  }

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = conditionEntity.id + "_" + conditionEntity.outcomesIds![i]
    const outcomeEntity = context.Outcome.get(outcomeEntityId)!

    if (outcomeEntity._betsEntityIds!.length === 0) {
      continue
    }

    for (let j = 0; j < outcomeEntity._betsEntityIds!.length; j++) {
      const betEntityId = outcomeEntity._betsEntityIds![j]
      const betEntity = context.Bet.get(betEntityId)!

      betsAmount = betsAmount + betEntity.rawAmount

      const selectionEntityId = betEntityId + "_" + conditionEntity.conditionId.toString()
      const selectionEntity = context.Selection.get(selectionEntityId)!

      if (!isCanceled) {
        if (winningOutcomes.indexOf(selectionEntity._outcomeId) !== -1) {
          context.Bet.set({
            ...betEntity,
            _wonSubBetsCount: betEntity._wonSubBetsCount + 1,
          })

          context.Selection.set({
            ...selectionEntity,
            result: SELECTION_RESULT_WON,
          })
        }
        else {
          context.Bet.set({
            ...betEntity,
            _lostSubBetsCount: betEntity._lostSubBetsCount + 1,
          })

          context.Selection.set({
            ...selectionEntity,
            result: SELECTION_RESULT_LOST,
          })
        }
      }
      else {
        context.Bet.set({
          ...betEntity,
          _canceledSubBetsCount: betEntity._canceledSubBetsCount + 1,
        })
      }

      // All subBets is resolved
      if (
        betEntity._wonSubBetsCount
        + betEntity._lostSubBetsCount
        + betEntity._canceledSubBetsCount
        === betEntity._subBetsCount
      ) {
        context.Bet.set({
          ...betEntity,
          resolvedBlockTimestamp: BigInt(blockTimestamp),
          resolvedBlockNumber: BigInt(blockNumber),
          resolvedTxHash: transactionHash,
          rawSettledOdds: betEntity.rawOdds,
          // settledOdds: betEntity.odds, // BigDecimal
        })

        // At least one subBet is lost - customer lost
        if (betEntity._lostSubBetsCount > 0) {
          context.Bet.set({
            ...betEntity,
            result: BET_RESULT_LOST,
            status: BET_STATUS_RESOLVED,
            rawPayout: 0n,
            // payout: BigDecimal.zero(), // BigDecimal
          })
        }
        // At least one subBet is won and no lost subBets - customer won
        else if (betEntity._wonSubBetsCount > 0) {
          context.Bet.set({
            ...betEntity,
            result: BET_RESULT_WON,
            status: BET_STATUS_RESOLVED,
            isRedeemable: true,
          })

          if (betEntity.bet_type === BET_TYPE_ORDINAR) {
            context.Bet.set({
              ...betEntity,
              rawPayout: betEntity.rawPotentialPayout,
              payout: betEntity.potentialPayout,
            })
          }
          else if (
            betEntity.bet_type === BET_TYPE_EXPRESS
          ) {
            let payoutSC: bigint | null = null

            if (version === VERSION_V2) {
              payoutSC = calcPayoutV2(betEntity.core_id, betEntity.betId)
            }
            else if (version === VERSION_V3) {
              payoutSC = calcPayoutV3(betEntity.core_id, betEntity.betId)
            }

            if (payoutSC !== null) {
              context.Bet.set({
                ...betEntity,
                rawPayout: payoutSC,
                payout: toDecimal(payoutSC, betEntity._tokenDecimals),
                rawSettledOdds: ((payoutSC * 10n) ** BigInt(betEntity._oddsDecimals)) / betEntity.rawAmount,
                settledOdds: toDecimal(
                  betEntity.rawSettledOdds!,
                  betEntity._oddsDecimals,
                ),
              })
            }
            else {
              context.Bet.set({
                ...betEntity,
                rawPayout: 0n,
                payout: 0n,
              })
            }
          }

          wonBetsAmount = wonBetsAmount + betEntity.rawPayout!
        }

        // Only canceled subBets - express was canceled
        else {
          context.Bet.set({
            ...betEntity,
            status: BET_STATUS_CANCELED,
            isRedeemable: true,
            rawPayout: betEntity.rawAmount,
            payout: betEntity.amount,
          })
        }
      }
      context.Bet.set({
        ...betEntity,
        _updatedAt: BigInt(blockTimestamp),
      })
    }
  }

  // determine game status
  // determine if game has active conditions
  // determine if league has active games
  // determine if sport has active leagues
  // calculate turnover

  const gameEntity: GameEntity = context.Game.get(conditionEntity.game_id)!
  const leagueEntity: LeagueEntity = context.League.get(gameEntity.league_id)!
  const countryEntity: CountryEntity = context.Country.get(leagueEntity.country_id)!

  context.Game.set({
    ...gameEntity,
    _activeConditionsEntityIds: removeItem(
      gameEntity._activeConditionsEntityIds!,
      conditionEntity.id,
    ),
    _pausedConditionsEntityIds: removeItem(
      gameEntity._pausedConditionsEntityIds!,
      conditionEntity.id,
    ),
  })

  if (isCanceled) {
    context.Game.set({
      ...gameEntity,
      _canceledConditionsEntityIds: gameEntity._canceledConditionsEntityIds!.concat([conditionEntity.id]),
    })
  }
  else {
    context.Game.set({
      ...gameEntity,
      _resolvedConditionsEntityIds: gameEntity._resolvedConditionsEntityIds!.concat([conditionEntity.id]),
    })
  }


  if (gameEntity._activeConditionsEntityIds!.length === 0) {
    if (gameEntity.hasActiveConditions) {
      context.Game.set({
        ...gameEntity,
        hasActiveConditions: false,
      })
    }

    if (
      gameEntity._resolvedConditionsEntityIds!.length === 0
      && gameEntity._pausedConditionsEntityIds!.length === 0
      && gameEntity._canceledConditionsEntityIds!.length > 0
    ) {
      context.Game.set({
        ...gameEntity,
        status: GAME_STATUS_CANCELED,
      })
    }
    else if (
      gameEntity._resolvedConditionsEntityIds!.length > 0
      && gameEntity._pausedConditionsEntityIds!.length === 0
    ) {
      context.Game.set({
        ...gameEntity,
        status: GAME_STATUS_RESOLVED,
      })
    }

    context.League.set({
      ...leagueEntity,
      activeGamesEntityIds: removeItem(
        leagueEntity.activeGamesEntityIds!,
        gameEntity.id,
      ),
    })

    if (
      leagueEntity.hasActiveGames
      && leagueEntity.activeGamesEntityIds!.length === 0
    ) {
      context.League.set({
        ...leagueEntity,
        hasActiveGames: false,
      })

      context.Country.set({
        ...countryEntity,
        activeLeaguesEntityIds: removeItem(
          countryEntity.activeLeaguesEntityIds!,
          leagueEntity.id,
        ),
      })

      if (
        countryEntity.hasActiveLeagues
        && countryEntity.activeLeaguesEntityIds!.length === 0
      ) {
        context.Country.set({
          ...countryEntity,
          hasActiveLeagues: false,
        })
      }
    }
  }

  context.Game.set({
    ...gameEntity,
    turnover: gameEntity.turnover - conditionEntity.turnover,
    _updatedAt: BigInt(blockTimestamp),
  })

  context.League.set({
    ...leagueEntity,
    turnover: leagueEntity.turnover - conditionEntity.turnover,
  })

  context.Country.set({
    ...countryEntity,
    turnover: countryEntity.turnover - conditionEntity.turnover,
  })

  countConditionResolved(
    liquidityPoolAddress,
    betsAmount,
    wonBetsAmount,
    blockNumber,
    blockTimestamp,
    chainId,
    context,
  )

  return conditionEntity
}


export function pauseUnpauseCondition(
  conditionEntity: ConditionEntity,
  flag: boolean,
  blockNumber: number,
  blockTimestamp: number,
  context: CoreContract_ConditionStoppedEvent_handlerContext,
): ConditionEntity | null {
  if (flag) {
    context.Condition.set({
      ...conditionEntity,
      status: CONDITION_STATUS_PAUSED,
    })
  }
  else {
    context.Condition.set({
      ...conditionEntity,
      status: CONDITION_STATUS_CREATED,
    })
  }

  context.Condition.set({
    ...conditionEntity,
    _updatedAt: BigInt(blockTimestamp),
  })

  const gameEntity: GameEntity = context.Game.get(conditionEntity.game_id)!

  if (flag) {
    context.Game.set({
      ...gameEntity,
      _activeConditionsEntityIds: removeItem(
        gameEntity._activeConditionsEntityIds!,
        conditionEntity.id,
      ),
      _pausedConditionsEntityIds: gameEntity._pausedConditionsEntityIds!.concat([conditionEntity.id]),
    })

    if (
      gameEntity.status === GAME_STATUS_CREATED
      && gameEntity._activeConditionsEntityIds!.length === 0
    ) {
      context.Game.set({
        ...gameEntity,
        hasActiveConditions: false,
        status: GAME_STATUS_PAUSED,
      })
    }
  }
  else {
    context.Game.set({
      ...gameEntity,
      _activeConditionsEntityIds: gameEntity._activeConditionsEntityIds!.concat([conditionEntity.id]),
      _pausedConditionsEntityIds: removeItem(
        gameEntity._pausedConditionsEntityIds!,
        conditionEntity.id,
      ),
    })

    if (gameEntity.status === GAME_STATUS_PAUSED) {
      context.Game.set({
        ...gameEntity,
        hasActiveConditions: true,
        status: GAME_STATUS_CREATED,
      })
    }
  }

  context.Game.set({
    ...gameEntity,
    _updatedAt: BigInt(blockTimestamp),
  })

  return conditionEntity
}