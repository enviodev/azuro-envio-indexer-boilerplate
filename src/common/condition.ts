import { start } from "repl";
import { ConditionEntity, CoreContract_ConditionCreatedEvent_handlerContext, CoreContract_ConditionCreatedEvent_handlerContextAsync, CoreContract_ConditionResolvedEvent_handlerContextAsync, CoreContract_ConditionStoppedEvent_handlerContext, Corev2Contract_ConditionCreatedEvent_handlerContext, Corev2Contract_ConditionCreatedEvent_handlerContextAsync, Corev2Contract_OddsChangedEvent_handlerContext, Corev2Contract_OddsChangedEvent_handlerContextAsync, Corev3Contract_MarginChangedEvent_handlerContext, Corev3Contract_ReinforcementChangedEvent_handlerContext, CountryEntity, GameEntity, LeagueEntity, LiveConditionEntity, LiveCorev1Contract_ConditionCreatedEvent_handlerContext, LiveCorev1Contract_ConditionCreatedEvent_handlerContextAsync, LiveCorev1Contract_ConditionResolvedEvent_handlerContext, LiveCorev1Contract_ConditionResolvedEvent_handlerContextAsync, LiveCorev1Contract_ConditionResolvedEvent_loaderContext, LiveOutcomeEntity, OutcomeEntity, outcomeLoaderConfig } from "../../generated/src/Types.gen";
import { BASES_VERSIONS, BET_RESULT_LOST, BET_RESULT_WON, BET_STATUS_CANCELED, BET_STATUS_RESOLVED, BET_TYPE_EXPRESS, BET_TYPE_ORDINAR, CONDITION_STATUS_CANCELED, CONDITION_STATUS_CREATED, CONDITION_STATUS_PAUSED, CONDITION_STATUS_RESOLVED, GAME_STATUS_CANCELED, GAME_STATUS_CREATED, GAME_STATUS_PAUSED, GAME_STATUS_RESOLVED, SELECTION_RESULT_LOST, SELECTION_RESULT_WON, VERSION_V2, VERSION_V3 } from "../constants";
import { removeItem } from "../utils/array";
import { getOdds, toDecimal } from '../utils/math'
import { calcPayoutV2, calcPayoutV3 } from "./express";
import { countConditionResolved } from "./pool";
import { Condition, LiveCondition } from "../src/DbFunctions.bs";
import { getEntityId } from "../utils/schema";
import { Mutable, Version } from "../utils/types";
import { deepCopy } from "../utils/mapping";

export async function createCondition(
  version: Version,
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
): Promise<Mutable<ConditionEntity> | null> {

  const conditionEntityId = getEntityId(coreAddress, conditionId.toString())

  if (!conditionEntityId) {
    throw new Error(`createCondition conditionEntityId is empty, conditionId ${conditionId}`)
  }

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

  if (!newOdds) {
    throw new Error(`createCondition getOdds returned null, conditionId ${conditionEntityId}, version is ${version}`)
  }

  let outcomeIds: bigint[] = []

  for (let i = 0; i < outcomes.length; i++) {
    outcomeIds = outcomeIds.concat([outcomes[i]])

    const outcomeId = outcomes[i].toString()

    if (!outcomeId) {
      throw new Error(`createCondition outcomeId is empty, conditionId ${conditionEntityId}`)
    }

    const outcomeEntityId = getEntityId(conditionEntityId, outcomeId)

    const outcomeEntity: OutcomeEntity = {
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

  // TODO remove
  // Does throw in v3
  if (outcomes.length !== 2) {
    // context.log.debug(`createCondition outcomeIds.length !== 2 length is ${outcomes.length}`)
    // throw new Error(`createCondition outcomeIds.length !== 2`)
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
  version: Version,
  conditionEntity: ConditionEntity,
  outcomesEntities: OutcomeEntity[],
  funds: bigint[],
  block: number,
  context: Corev2Contract_OddsChangedEvent_handlerContextAsync,
): ConditionEntity | null {
  const odds = getOdds(
    version,
    funds,
    conditionEntity.margin,
    conditionEntity._winningOutcomesCount,
  )

  if (!odds) {
    context.log.error(`updateConditionOdds odds is null, conditionId = ${conditionEntity.id}`)
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


export async function resolveCondition(
  version: string,
  liquidityPoolAddress: string,
  conditionEntityId: string,
  winningOutcomes: bigint[],
  transactionHash: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: CoreContract_ConditionCreatedEvent_handlerContext | CoreContract_ConditionResolvedEvent_handlerContextAsync,
): Promise<ConditionEntity | null> {
  const _conditionEntity = await context.Condition.get(conditionEntityId)

  if (!_conditionEntity) {
    throw new Error(`resolveCondition conditionEntity not found with id = ${conditionEntityId}`)
  }

  const conditionEntity = deepCopy(_conditionEntity)

  const isCanceled = winningOutcomes.length === 0 || winningOutcomes[0] === 0n

  let betsAmount = 0n
  let wonBetsAmount = 0n

  if (isCanceled) {
    conditionEntity.status = CONDITION_STATUS_CANCELED
  }
  else {
    let wonOutcomes: string[] = []

    // for (let i = 0; i < winningOutcomes.length; i++) {
    //   const outcomeEntityId = getEntityId(conditionEntity.id, winningOutcomes[i].toString())
    //   // const outcomeEntity = (await context.Outcome.get(outcomeEntityId))!.id
    //   // wonOutcomes = wonOutcomes.concat([outcomeEntity])
    // }

    // conditionEntity.wonOutcomes = wonOutcomes
    conditionEntity.wonOutcomeIds = winningOutcomes
    conditionEntity.status = CONDITION_STATUS_RESOLVED
  }

  conditionEntity.resolvedTxHash = transactionHash
  conditionEntity.resolvedBlockNumber = BigInt(blockNumber)
  conditionEntity.resolvedBlockTimestamp = BigInt(blockTimestamp)
  conditionEntity._updatedAt = BigInt(blockTimestamp)

  context.Condition.set(conditionEntity)

  // TODO remove later
  if (!conditionEntity.outcomesIds) {
    throw new Error(`resolveCondition outcomesIds is empty.`)
  }

  for (let i = 0; i < conditionEntity.outcomesIds!.length; i++) {
    const outcomeEntityId = getEntityId(conditionEntity.id, conditionEntity.outcomesIds![i].toString())
    const outcomeEntity = await context.Outcome.get(outcomeEntityId)

    if (!outcomeEntity) {
      throw new Error(`resolveCondition outcomeEntity not found with id = ${outcomeEntityId}`)
    }

    if (outcomeEntity._betsEntityIds!.length === 0) {
      continue
    }

    for (let j = 0; j < outcomeEntity._betsEntityIds!.length; j++) {
      const betEntityId = outcomeEntity._betsEntityIds![j]
      const _betEntity = (await context.Bet.get(betEntityId))!
      const betEntity = deepCopy(_betEntity)

      betsAmount = betsAmount + betEntity.rawAmount

      const selectionEntityId = getEntityId(betEntityId, conditionEntity.conditionId.toString())
      const _selectionEntity = await context.Selection.get(selectionEntityId)
      if (!_selectionEntity) {
        throw new Error(`resolveCondition selectionEntity not found with id = ${selectionEntityId}`)
      }
      const selectionEntity = deepCopy(_selectionEntity)

      if (!isCanceled) {
        if (winningOutcomes.indexOf(selectionEntity._outcomeId) !== -1) {
          betEntity._wonSubBetsCount += 1
          selectionEntity.result = SELECTION_RESULT_WON
        }
        else {
          betEntity._lostSubBetsCount += 1
          selectionEntity.result = SELECTION_RESULT_LOST
        }
      }
      else {
        betEntity._canceledSubBetsCount += 1
      }

      context.Selection.set(selectionEntity)

      // All subBets is resolved
      if (
        betEntity._wonSubBetsCount
        + betEntity._lostSubBetsCount
        + betEntity._canceledSubBetsCount
        === betEntity._subBetsCount
      ) {
        betEntity.resolvedBlockTimestamp = BigInt(blockTimestamp)
        betEntity.resolvedBlockNumber = BigInt(blockNumber)
        betEntity.resolvedTxHash = transactionHash
        betEntity.rawSettledOdds = betEntity.rawOdds
        // settledOdds: betEntity.odds, // BigDecimal

        // At least one subBet is lost - customer lost
        if (betEntity._lostSubBetsCount > 0) {
          betEntity.result = BET_RESULT_LOST
          betEntity.status = BET_STATUS_RESOLVED
          betEntity.rawPayout = 0n
          // payout: BigDecimal.zero(), // BigDecimal
        }
        // At least one subBet is won and no lost subBets - customer won
        else if (betEntity._wonSubBetsCount > 0) {
          betEntity.result = BET_RESULT_WON
          betEntity.status = BET_STATUS_RESOLVED
          betEntity.isRedeemable = true

          if (betEntity.type_ === BET_TYPE_ORDINAR) {
            betEntity.rawPayout = betEntity.rawPotentialPayout
            // payout: betEntity.potentialPayout,
          }
          else if (
            betEntity.type_ === BET_TYPE_EXPRESS
          ) {
            let payoutSC: bigint | null = null

            if (version === VERSION_V2) {
              payoutSC = await calcPayoutV2(betEntity.core_id, betEntity.betId, chainId)
            }
            else if (version === VERSION_V3) {
              payoutSC = await calcPayoutV3(betEntity.core_id, betEntity.betId, chainId)
            }

            if (payoutSC !== null) {
              betEntity.rawPayout = payoutSC
              // payout: toDecimal(payoutSC, betEntity._tokenDecimals),
              betEntity.rawSettledOdds = ((payoutSC * 10n) ** BigInt(betEntity._oddsDecimals)) / betEntity.rawAmount
              // settledOdds: toDecimal(
              // betEntity.rawSettledOdds!,
              // betEntity._oddsDecimals,
              // ),
            }
            else {
              context.log.debug(`betEntity type = ${betEntity.type_} payoutSC is null`)
              betEntity.rawPayout = 0n
              // payout: 0n,
            }
          }

          wonBetsAmount = wonBetsAmount + betEntity.rawPayout!
        }

        // Only canceled subBets - express was canceled
        else {
          betEntity.status = BET_STATUS_CANCELED
          betEntity.isRedeemable = true
          betEntity.rawPayout = betEntity.rawAmount
          // payout: betEntity.amount,
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

  const gameEntity = deepCopy(await context.Game.get(conditionEntity.game_id))!
  const leagueEntity = deepCopy(await context.League.get(gameEntity.league_id))!
  const countryEntity = deepCopy(await context.Country.get(leagueEntity.country_id))!

    gameEntity._activeConditionsEntityIds = removeItem(
      gameEntity._activeConditionsEntityIds!,
      conditionEntity.id,
    )
    gameEntity._pausedConditionsEntityIds = removeItem(
      gameEntity._pausedConditionsEntityIds!,
      conditionEntity.id,
    )

  if (isCanceled) {
      gameEntity._canceledConditionsEntityIds = gameEntity._canceledConditionsEntityIds!.concat([conditionEntity.id])
  }
  else {
      gameEntity._resolvedConditionsEntityIds = gameEntity._resolvedConditionsEntityIds!.concat([conditionEntity.id])
  }


  if (gameEntity._activeConditionsEntityIds!.length === 0) {
    if (gameEntity.hasActiveConditions) {
        gameEntity.hasActiveConditions = false
    }

    if (
      gameEntity._resolvedConditionsEntityIds!.length === 0
      && gameEntity._pausedConditionsEntityIds!.length === 0
      && gameEntity._canceledConditionsEntityIds!.length > 0
    ) {
        gameEntity.status = GAME_STATUS_CANCELED
    }
    else if (
      gameEntity._resolvedConditionsEntityIds!.length > 0
      && gameEntity._pausedConditionsEntityIds!.length === 0
    ) {
        gameEntity.status = GAME_STATUS_RESOLVED
    }

      leagueEntity.activeGamesEntityIds = removeItem(
        leagueEntity.activeGamesEntityIds!,
        gameEntity.id,
      )

    if (
      leagueEntity.hasActiveGames
      && leagueEntity.activeGamesEntityIds!.length === 0
    ) {
      leagueEntity.hasActiveGames = false

      countryEntity.activeLeaguesEntityIds = removeItem(
        countryEntity.activeLeaguesEntityIds!,
        leagueEntity.id,
      )

      if (
        countryEntity.hasActiveLeagues
        && countryEntity.activeLeaguesEntityIds!.length === 0
      ) {
        countryEntity.hasActiveLeagues = false
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

  await countConditionResolved(
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
  _conditionEntity: ConditionEntity,
  flag: boolean,
  blockTimestamp: bigint,
  context: CoreContract_ConditionStoppedEvent_handlerContext,
): ConditionEntity | null {
  const conditionEntity = deepCopy(_conditionEntity)

  if (flag) {
    conditionEntity.status = CONDITION_STATUS_PAUSED
  }
  else {
    conditionEntity.status = CONDITION_STATUS_CREATED
  }

  context.Condition.set({
    ...conditionEntity,
    _updatedAt: blockTimestamp,
  })

  const _gameEntity: GameEntity = context.Game.get(conditionEntity.game_id)!

  if (!_gameEntity) {
    throw new Error(`pauseUnpauseCondition gameEntity not found with id = ${conditionEntity.game_id}`)
  }

  const gameEntity = deepCopy(_gameEntity)

  if (flag) {
    gameEntity._activeConditionsEntityIds = removeItem(
      gameEntity._activeConditionsEntityIds!,
      conditionEntity.id,
    )
    gameEntity._pausedConditionsEntityIds = gameEntity._pausedConditionsEntityIds!.concat([conditionEntity.id])

    if (
      gameEntity.status === GAME_STATUS_CREATED
      && gameEntity._activeConditionsEntityIds!.length === 0
    ) {
      gameEntity.hasActiveConditions = false
      gameEntity.status = GAME_STATUS_PAUSED
    }
  }
  else {
    gameEntity._activeConditionsEntityIds = gameEntity._activeConditionsEntityIds!.concat([conditionEntity.id])
    gameEntity._pausedConditionsEntityIds = removeItem(
      gameEntity._pausedConditionsEntityIds!,
      conditionEntity.id,
    )


    if (gameEntity.status === GAME_STATUS_PAUSED) {
      gameEntity.hasActiveConditions = true
      gameEntity.status = GAME_STATUS_CREATED
    }
  }

  context.Game.set({
    ...gameEntity,
    _updatedAt: blockTimestamp,
  })

  return conditionEntity
}


export async function resolveLiveCondition(
  liveConditionEntityId: string,
  winningOutcomes: bigint[],
  transactionHash: string,
  blockNumber: bigint,
  blockTimestamp: bigint,
  context: LiveCorev1Contract_ConditionResolvedEvent_handlerContextAsync,
): Promise<LiveConditionEntity | null> {
  const _liveConditionEntity = (await context.LiveCondition.get(liveConditionEntityId))!
  const liveConditionEntity = deepCopy(_liveConditionEntity)

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
      const liveOutcomeEntity = (await context.LiveOutcome.get(liveOutcomeEntityId))!.id

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
    throw new Error('resolveCondition outcomesIds is empty.')
  }

  for (let i = 0; i < liveConditionEntity.outcomesIds!.length; i++) {
    const liveOutcomeEntityId = getEntityId(
      liveConditionEntity.id,
      liveConditionEntity.outcomesIds![i].toString(),
    )
    const liveOutcomeEntity = (await context.LiveOutcome.get(liveOutcomeEntityId))!

    if (liveOutcomeEntity._betsEntityIds!.length === 0) {
      continue
    }

    for (let j = 0; j < liveOutcomeEntity._betsEntityIds!.length; j++) {
      const livebetEntityId = liveOutcomeEntity._betsEntityIds![j]
      const _liveBetEntity = (await context.LiveBet.get(livebetEntityId))!
      const liveBetEntity = deepCopy(_liveBetEntity)

      betsAmount = betsAmount + liveBetEntity.rawAmount

      const liveSelectionEntityId = getEntityId(
        livebetEntityId,
        liveConditionEntity.conditionId.toString(),
      )
      const _liveSelectionEntity = (await context.LiveSelection.get(liveSelectionEntityId))!
      const liveSelectionEntity = deepCopy(_liveSelectionEntity)

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
  context: LiveCorev1Contract_ConditionCreatedEvent_handlerContextAsync,
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