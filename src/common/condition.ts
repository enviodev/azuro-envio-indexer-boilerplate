import { start } from "repl";
import { ConditionEntity, CoreContract_ConditionCreatedEvent_handlerContext, CoreContract_ConditionCreatedEvent_handlerContextAsync, CoreContract_ConditionStoppedEvent_handlerContext, Corev2Contract_ConditionCreatedEvent_handlerContext, Corev2Contract_ConditionCreatedEvent_handlerContextAsync, Corev2Contract_OddsChangedEvent_handlerContext, Corev3Contract_MarginChangedEvent_handlerContext, Corev3Contract_ReinforcementChangedEvent_handlerContext, CountryEntity, GameEntity, LeagueEntity, LiveConditionEntity, LiveCorev1Contract_ConditionCreatedEvent_handlerContext, LiveCorev1Contract_ConditionResolvedEvent_handlerContext, LiveCorev1Contract_ConditionResolvedEvent_loaderContext, LiveOutcomeEntity, OutcomeEntity, outcomeLoaderConfig } from "../../generated/src/Types.gen";
import { BASES_VERSIONS, BET_RESULT_LOST, BET_RESULT_WON, BET_STATUS_CANCELED, BET_STATUS_RESOLVED, BET_TYPE_EXPRESS, BET_TYPE_ORDINAR, CONDITION_STATUS_CANCELED, CONDITION_STATUS_CREATED, CONDITION_STATUS_PAUSED, CONDITION_STATUS_RESOLVED, GAME_STATUS_CANCELED, GAME_STATUS_CREATED, GAME_STATUS_PAUSED, GAME_STATUS_RESOLVED, SELECTION_RESULT_LOST, SELECTION_RESULT_WON, VERSION_V2, VERSION_V3 } from "../constants";
import { removeItem } from "../utils/array";
import { getOdds, toDecimal } from '../utils/math'
import { calcPayoutV2, calcPayoutV3 } from "./express";
import { countConditionResolved } from "./pool";
import { Condition, LiveCondition } from "../src/DbFunctions.bs";
import { getEntityId } from "../utils/schema";
import { Mutable } from "../utils/types";

export async function createCondition(
  version: string,
  coreAddress: string,
  conditionId: bigint,
  gameEntityId: string,
  margin: bigint,
  reinforcement: bigint,
  outcomes: bigint[],
  funds: bigint[],
  winningOutcomesCount: number,
  isExpressForbidden: boolean,
  provider: bigint,
  txHash: string,
  createBlockNumber: number,
  createBlockTimestamp: number,
  context: CoreContract_ConditionCreatedEvent_handlerContextAsync | Corev2Contract_ConditionCreatedEvent_handlerContextAsync,
  startsAt: bigint | null = null,
): Promise<Mutable<typeof conditionEntity> | null> {

  const conditionEntityId = coreAddress + "_" + conditionId.toString()

  const conditionEntity: Mutable<ConditionEntity> = {
    id: conditionEntityId,
    core_id: coreAddress,
    coreAddress: coreAddress,
    conditionId: conditionId,
    game_id: gameEntityId,
    _winningOutcomesCount: winningOutcomesCount,
    isExpressForbidden: isExpressForbidden,
    createdTxHash: txHash,
    createdBlockNumber: BigInt(createBlockNumber),
    createdBlockTimestamp: BigInt(createBlockTimestamp),
    status: CONDITION_STATUS_CREATED,
    margin: margin,
    reinforcement: reinforcement,
    turnover: 0n,
    provider: provider,
    _updatedAt: BigInt(createBlockTimestamp),
    resolvedTxHash: undefined,
    resolvedBlockNumber: undefined,
    wonOutcomeIds: undefined,
    internalStartsAt: startsAt ? BigInt(startsAt) : undefined,
    resolvedBlockTimestamp: undefined,
    outcomesIds: undefined,
  }

  const newOdds = getOdds(
    version,
    funds,
    conditionEntity.margin,
    conditionEntity._winningOutcomesCount,
  )

  if (newOdds === null) {
    context.log.error(`createCondition getOdds returned null, conditionId {}`)
    return null
  }

  let outcomeIds: bigint[] = []

  for (let i = 0; i < outcomes.length; i++) {
    outcomeIds = outcomeIds.concat([outcomes[i]])

    const outcomeId = outcomes[i].toString()

    const outcomeEntityId = getEntityId(conditionEntityId, outcomeId)

    const outcomeEntity: Mutable<OutcomeEntity> = {
      id: outcomeEntityId,
      core_id: coreAddress,
      outcomeId: outcomes[i],
      condition_id: conditionEntity.id,
      sortOrder: i,
      fund: funds[i],
      rawCurrentOdds: newOdds[i],
      _betsEntityIds: [],
      // currentOdds: toDecimal(
      //   newOdds[i],
      //   BASES_VERSIONS.mustGetEntry(version).value,
      // ),
      _updatedAt: BigInt(createBlockTimestamp),
    }

    context.Outcome.set(outcomeEntity)
  }

  conditionEntity.outcomesIds = outcomeIds

  if (startsAt) {
    conditionEntity.internalStartsAt = startsAt
  }

  conditionEntity._updatedAt = BigInt(createBlockTimestamp)

  context.Condition.set(conditionEntity)

  const gameEntity = (await context.Game.get(gameEntityId))!

  context.Game.set({
    ...gameEntity,
    _activeConditionsEntityIds: gameEntity._activeConditionsEntityIds!.concat([conditionEntityId]),
    hasActiveConditions: true,
    status: GAME_STATUS_CREATED,
    _updatedAt: BigInt(createBlockTimestamp),
  })

  const leagueEntity = (await context.League.get(gameEntity.league_id))!
  // context.log.debug(`leagueEntity ${JSON.stringify(leagueEntity)}`)

  if (!leagueEntity.activeGamesEntityIds!.includes(gameEntityId)) {
    context.League.set({
      ...leagueEntity,
      activeGamesEntityIds: leagueEntity.activeGamesEntityIds!.concat([gameEntityId]),
      hasActiveGames: true,
    })

    const countryEntity = (await context.Country.get(leagueEntity.country_id))!

    if (!countryEntity.activeLeaguesEntityIds!.includes(leagueEntity.id)) {
      context.Country.set({
        ...countryEntity,
        activeLeaguesEntityIds: countryEntity.activeLeaguesEntityIds!.concat([leagueEntity.id]),
        hasActiveLeagues: true,
      })
    }

  }
  return conditionEntity
}


export function updateConditionOdds(
  version: string,
  conditionEntity: ConditionEntity,
  outcomesEntities: OutcomeEntity[],
  funds: bigint[],
  block: number,
  context: Corev2Contract_OddsChangedEvent_handlerContext,
): ConditionEntity | null {
  const odds = getOdds(
    version,
    funds,
    conditionEntity.margin,
    conditionEntity._winningOutcomesCount,
  )

  if (odds === null) {
    return null
  }

  for (let i = 0; i < outcomesEntities.length; i++) {
    const outcomeEntity = outcomesEntities[i]

    context.Outcome.set({
      ...outcomeEntity,
      fund: funds[i],
      rawCurrentOdds: odds[i],
      // currentOdds: toDecimal(
      //   odds[i],
      //   BASES_VERSIONS.mustGetEntry(version).value,
      // ),
      _updatedAt: BigInt(block),
    })
  }

  return conditionEntity
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

          if (betEntity.type_ === BET_TYPE_ORDINAR) {
            context.Bet.set({
              ...betEntity,
              rawPayout: betEntity.rawPotentialPayout,
              // payout: betEntity.potentialPayout,
            })
          }
          else if (
            betEntity.type_ === BET_TYPE_EXPRESS
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
                // payout: toDecimal(payoutSC, betEntity._tokenDecimals),
                rawSettledOdds: ((payoutSC * 10n) ** BigInt(betEntity._oddsDecimals)) / betEntity.rawAmount,
                // settledOdds: toDecimal(
                // betEntity.rawSettledOdds!,
                // betEntity._oddsDecimals,
                // ),
              })
            }
            else {
              context.Bet.set({
                ...betEntity,
                rawPayout: 0n,
                // payout: 0n,
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
            // payout: betEntity.amount,
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
  blockTimestamp: bigint,
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
    _updatedAt: blockTimestamp,
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
    _updatedAt: blockTimestamp,
  })

  return conditionEntity
}


export function resolveLiveCondition(
  liveConditionEntityId: string,
  winningOutcomes: bigint[],
  transactionHash: string,
  blockNumber: bigint,
  blockTimestamp: bigint,
  context: LiveCorev1Contract_ConditionResolvedEvent_handlerContext,
): LiveConditionEntity | null {
  const _liveConditionEntity = context.LiveCondition.get(liveConditionEntityId)!
  const liveConditionEntity = {..._liveConditionEntity}

  const isCanceled = winningOutcomes.length === 0 || winningOutcomes[0] === 0n

  let betsAmount = 0n
  let wonBetsAmount = 0n

  if (isCanceled) {
    liveConditionEntity.status = CONDITION_STATUS_CANCELED
  }
  else {
    let wonOutcomes: string[] = []

    for (let i = 0; i < winningOutcomes.length; i++) {
      const liveOutcomeEntityId = getEntityId(
        liveConditionEntity.id,
        winningOutcomes[i].toString(),
      )
      const liveOutcomeEntity = context.LiveOutcome.get(liveOutcomeEntityId)!.id

      wonOutcomes = wonOutcomes.concat([liveOutcomeEntity])
    }

    // liveConditionEntity.wonOutcomes = wonOutcomes
    liveConditionEntity.wonOutcomeIds = winningOutcomes
    liveConditionEntity.status = CONDITION_STATUS_RESOLVED
  }

  liveConditionEntity.resolvedTxHash = transactionHash
  liveConditionEntity.resolvedBlockNumber = BigInt(blockNumber)
  liveConditionEntity.resolvedBlockTimestamp = BigInt(blockTimestamp)

  liveConditionEntity._updatedAt = BigInt(blockTimestamp)
  context.LiveCondition.set(liveConditionEntity)

  if (!liveConditionEntity.outcomesIds) {
    context.log.error('resolveCondition outcomesIds is empty.')
    return null
  }

  for (let i = 0; i < liveConditionEntity.outcomesIds!.length; i++) {
    const liveOutcomeEntityId = getEntityId(
      liveConditionEntity.id,
      liveConditionEntity.outcomesIds![i].toString(),
    )
    const liveOutcomeEntity = context.LiveOutcome.get(liveOutcomeEntityId)!

    if (liveOutcomeEntity._betsEntityIds!.length === 0) {
      continue
    }

    for (let j = 0; j < liveOutcomeEntity._betsEntityIds!.length; j++) {
      const livebetEntityId = liveOutcomeEntity._betsEntityIds![j]
      const _liveBetEntity = context.LiveBet.get(livebetEntityId)!
      const liveBetEntity = {..._liveBetEntity}

      betsAmount = betsAmount + liveBetEntity.rawAmount

      const liveSelectionEntityId = getEntityId(
        livebetEntityId,
        liveConditionEntity.conditionId.toString(),
      )
      const _liveSelectionEntity = context.LiveSelection.get(liveSelectionEntityId)!
      const liveSelectionEntity = {..._liveSelectionEntity}

      if (!isCanceled) {
        if (winningOutcomes.indexOf(liveSelectionEntity._outcomeId) !== -1) {
          liveBetEntity._wonSubBetsCount += 1
          liveSelectionEntity.result = SELECTION_RESULT_WON
        }
        else {
          liveBetEntity._lostSubBetsCount += 1
          liveSelectionEntity.result = SELECTION_RESULT_LOST
        }
      }
      else {
        liveBetEntity._canceledSubBetsCount += 1
      }

      context.LiveSelection.set(liveSelectionEntity)

      // All subBets is resolved
      if (
        liveBetEntity._wonSubBetsCount
          + liveBetEntity._lostSubBetsCount
          + liveBetEntity._canceledSubBetsCount
        === liveBetEntity._subBetsCount
      ) {
        liveBetEntity.resolvedBlockTimestamp = BigInt(blockTimestamp)
        liveBetEntity.resolvedBlockNumber = BigInt(blockNumber)
        liveBetEntity.resolvedTxHash = transactionHash

        liveBetEntity.rawSettledOdds = liveBetEntity.rawOdds
        // liveBetEntity.settledOdds = liveBetEntity.odds

        // At least one subBet is lost - customer lost
        if (liveBetEntity._lostSubBetsCount > 0) {
          liveBetEntity.result = BET_RESULT_LOST
          liveBetEntity.status = BET_STATUS_RESOLVED
          liveBetEntity.rawPayout = 0n
          // liveBetEntity.payout = BigDecimal.zero()
        }
        // At least one subBet is won and no lost subBets - customer won
        else if (liveBetEntity._wonSubBetsCount > 0) {
          liveBetEntity.result = BET_RESULT_WON
          liveBetEntity.status = BET_STATUS_RESOLVED
          liveBetEntity.isRedeemable = true

          liveBetEntity.rawPayout = liveBetEntity.rawPotentialPayout
          // liveBetEntity.payout = liveBetEntity.potentialPayout
          wonBetsAmount = wonBetsAmount + liveBetEntity.rawPayout!
        }

        // Only canceled subBets - express was canceled
        else {
          liveBetEntity.status = BET_STATUS_CANCELED
          liveBetEntity.isRedeemable = true
          liveBetEntity.rawPayout = liveBetEntity.rawAmount
          // liveBetEntity.payout = liveBetEntity.amount
        }
      }

      liveBetEntity._updatedAt = blockTimestamp
      context.LiveBet.set(liveBetEntity)
    }
  }

  return liveConditionEntity
}

export function createLiveCondition(
  coreAddress: string,
  liveConditionId: bigint,
  gameId: bigint,
  liveOutcomes: bigint[],
  winningOutcomesCount: number,
  txHash: string,
  _createBlockNumber: number,
  _createBlockTimestamp: number,
  context: LiveCorev1Contract_ConditionCreatedEvent_handlerContext,
): LiveConditionEntity | null {

  const createBlockNumber = BigInt(_createBlockNumber)
  const createBlockTimestamp = BigInt(_createBlockTimestamp)

  const liveConditionEntityId = getEntityId(
    coreAddress,
    liveConditionId.toString(),
  )
  const liveConditionEntity: Mutable<LiveConditionEntity> = {
    id: liveConditionEntityId,
    core_id: coreAddress,
    coreAddress: coreAddress,
    conditionId: liveConditionId,
    gameId: gameId,
    _winningOutcomesCount: winningOutcomesCount,
    createdTxHash: txHash,
    createdBlockNumber: createBlockNumber,
    createdBlockTimestamp: createBlockTimestamp,
    status: CONDITION_STATUS_CREATED,
    turnover: 0n,
    _updatedAt: BigInt(createBlockTimestamp),
    resolvedBlockTimestamp: undefined, 
    wonOutcomeIds: undefined, 
    resolvedBlockNumber: undefined, 
    outcomesIds: undefined, 
    resolvedTxHash: undefined
  }

  let liveOutcomeIds: bigint[] = []

  for (let i = 0; i < liveOutcomes.length; i++) {
    liveOutcomeIds = liveOutcomeIds.concat([liveOutcomes[i]])

    const liveOutcomeId = liveOutcomes[i].toString()

    const liveOutcomeEntityId = getEntityId(
      liveConditionEntityId,
      liveOutcomeId,
    )

    const liveOutcomeEntity: LiveOutcomeEntity = {
      id: liveOutcomeEntityId,
      core_id: coreAddress,
      outcomeId: liveOutcomes[i],
      condition_id: liveConditionEntity.id,
      sortOrder: i,
      _betsEntityIds: [],
      _updatedAt: createBlockTimestamp,
    } 

    context.LiveOutcome.set(liveOutcomeEntity)
  }

  liveConditionEntity.outcomesIds = liveOutcomeIds
  liveConditionEntity._updatedAt = createBlockTimestamp
  context.LiveCondition.set(liveConditionEntity)

  return liveConditionEntity
}


export function updateConditionMargin(
  conditionEntity: ConditionEntity,
  newMargin: bigint,
  blockTimestamp: number,
  context: Corev3Contract_MarginChangedEvent_handlerContext,
): ConditionEntity | null {
  context.Condition.set({
    ...conditionEntity,
    margin: newMargin,
    _updatedAt: BigInt(blockTimestamp),
  })

  return conditionEntity
}

export function updateConditionReinforcement(
  conditionEntity: ConditionEntity,
  newReinforcement: bigint,
  blockTimestamp: number,
  context: Corev3Contract_ReinforcementChangedEvent_handlerContext,
): ConditionEntity | null {
  context.Condition.set({
    ...conditionEntity,
    reinforcement: newReinforcement,
    _updatedAt: BigInt(blockTimestamp),
  })

  return conditionEntity
}