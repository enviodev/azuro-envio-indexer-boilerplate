import { zeroPadBytes } from "ethers"
import { ZERO_ADDRESS, BET_TYPE_ORDINAR, MULTIPLIERS_VERSIONS, BASES_VERSIONS, BET_STATUS_ACCEPTED, CORE_TYPE_LIVE, BET_TYPE_EXPRESS } from "../constants"
import { Azurobetv2Contract_TransferEvent_handlerContextAsync, BetEntity, Corev2Contract_NewBetEvent_handlerContext, Expressv2Contract_TransferEvent_handlerContext, FreeBetContract_FreeBetRedeemedEvent_handlerContext, GameEntity, LPContract_NewBetEvent_handlerContext, LPContract_NewBetEvent_handlerContextAsync, LPv2Contract_BettorWinEvent_handlerContext, LiveBetEntity, LiveConditionEntity, LiveCorev1Contract_NewLiveBetEvent_handlerContext, LiveOutcomeEntity, SelectionEntity, XYZFreeBetContract_FreeBetRedeemedEvent_handlerContextAsync } from "../src/Types.gen"
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen"
import { getOdds, toDecimal, safeDiv } from "../utils/math"
import { getEntityId } from "../utils/schema"
import { Mutable, Version } from "../utils/types"
import { deepCopy } from "../utils/mapping"


export async function transferBet(
  coreAddress: string | null,
  azuroBetAddress: string | null,
  tokenId: bigint,
  from: string,
  to: string,
  block: number,
  context: Azurobetv2Contract_TransferEvent_handlerContextAsync,
): Promise<BetEntity | null> {
  // create nft
  if (from === ZERO_ADDRESS) {
    return null
  }

  // burn nft
  if (to === ZERO_ADDRESS) {
    context.log.debug(`trasfer bet burning`)
    return null
  }

  let finalCoreAddress = ''

  if (coreAddress !== null) {
    finalCoreAddress = coreAddress
  }
  else if (azuroBetAddress !== null) {
    const azuroBetContractEntity = await context.AzuroBetContract.get(azuroBetAddress)

    // TODO remove later
    if (!azuroBetContractEntity) {
      throw new Error(`transferBet azuroBetContractEntity not found. azuroBetAddress = ${azuroBetAddress}`)
    }

    finalCoreAddress = azuroBetContractEntity.core_id
  }

  const betEntityId = getEntityId(finalCoreAddress, tokenId.toString())
  const betEntity = await context.Bet.get(betEntityId)

  if (!betEntity) {
    throw new Error(`transferBet betEntity not found. betEntity = ${betEntityId}`)
  }

  let actor = betEntity.actor
  if (!betEntity._isFreebet) {
    actor = to
  }

  context.Bet.set({
    ...betEntity,
    actor: actor,
    owner: to,
    _updatedAt: BigInt(block),
  })

  return betEntity
}


export async function linkBetWithFreeBet(
  coreAddress: string,
  tokenId: bigint,
  freebetEntityId: string,
  freebetOwner: string,
  blockTimestamp: number,
  context: XYZFreeBetContract_FreeBetRedeemedEvent_handlerContextAsync,
): Promise<BetEntity> {

  const betEntityId = getEntityId(coreAddress, tokenId.toString())
  const betEntity = await context.Bet.get(betEntityId)

  if (!betEntity) {
    throw new Error(`linkBetWithFreeBet betEntity not found. betEntity = ${betEntityId}`)
  }

  context.Bet.set({
    ...betEntity,
    freebet_id: freebetEntityId,
    _isFreebet: true,
    bettor: freebetOwner,
    actor: freebetOwner,
    _updatedAt: BigInt(blockTimestamp),
  })

  return betEntity
}

export async function createBet(
  version: Version,
  betType: typeof BET_TYPE_ORDINAR | typeof BET_TYPE_EXPRESS,
  conditionEntities: ConditionEntity[],
  betOutcomeEntities: OutcomeEntity[],
  conditionOdds: bigint[],
  odds: bigint,
  coreAddress: string,
  bettor: string,
  affiliate: string | null,
  tokenId: bigint,
  tokenDecimals: number,
  amount: bigint,
  txHash: string,
  createdBlockTimestamp: bigint,
  createdBlockNumber: bigint,
  funds: bigint[] | null,
  context: Corev2Contract_NewBetEvent_handlerContext | LPContract_NewBetEvent_handlerContextAsync,
  err_msg: string | null = null,
): Promise<BetEntity | null> {
  let conditionIds: bigint[] = []
  let conditionEntitiesIds: string[] = []
  let gameEntitiesIds: string[] = []

  let approxSettledAt = 0n

  for (let i = 0; i < conditionEntities.length; i++) {
    conditionIds[i] = conditionEntities[i].conditionId
    conditionEntitiesIds[i] = conditionEntities[i].id
    gameEntitiesIds[i] = conditionEntities[i].game_id

    const gameEntity = await context.Condition.getGame(conditionEntities[i])

    if (!gameEntity) {
      throw new Error(`Game not found with id ${gameEntitiesIds[i]}`)
    }

    if (gameEntity.startsAt > approxSettledAt) {
      approxSettledAt = gameEntity.startsAt + 7200n
    }
  }

  // update outcomes, condition and game turnover for ordinar bets
  if (betType === BET_TYPE_ORDINAR) {
    const conditionEntity = await context.Condition.get(conditionEntitiesIds[0])

    if (!conditionEntity) {
      throw new Error(`Condition not found (in createBet) with id ${conditionEntitiesIds[0]}`)
    }

    context.Condition.set({
      ...conditionEntity,
      turnover: conditionEntity.turnover + amount,
      _updatedAt: createdBlockTimestamp,
    })

    const gameEntity = await context.Game.get(conditionEntities[0].game_id)

    if (!gameEntity) {
      throw new Error(`Game not found (in createBet) with id ${conditionEntities[0].game_id}`)
    }

    context.Game.set({
      ...gameEntity,
      turnover: gameEntity.turnover + amount,
      _updatedAt: createdBlockTimestamp,
    })

    const leagueEntity = await context.Game.getLeague(gameEntity)

    if (!leagueEntity) {
      throw new Error(`League not found (in createBet) with id ${gameEntity.league_id}`)
    }

    context.League.set({
      ...leagueEntity,
      turnover: leagueEntity.turnover + amount,
    })

    const countryEntity = await context.League.getCountry(leagueEntity)

    if (!countryEntity) {
      throw new Error(`Country not found (in createBet) with id ${leagueEntity.country_id}`)
    }

    context.Country.set({
      ...countryEntity,
      turnover: countryEntity.turnover + amount,
    })
  }

  const potentialPayout = safeDiv(amount * odds, (MULTIPLIERS_VERSIONS.get(version)!))
  
  const betEntityId = getEntityId(coreAddress, tokenId.toString())

  for (let k = 0; k < conditionEntities.length; k++) {
    const conditionEntity = conditionEntities[k]
    const outcomeEntities: OutcomeEntity[] = []

    // double-check of sorting by sortOrder field
    for (let j = 0; j < conditionEntity.outcomesIds!.length; j++) {
      const outcomeId = conditionEntity.outcomesIds![j]

      const outcomeEntityId = getEntityId(conditionEntity.id, outcomeId.toString())
      const outcomeEntity = await context.Outcome.get(outcomeEntityId)

      if (!outcomeEntity) {
        throw new Error(`Outcome not found (in createBet) with id ${outcomeEntityId}. Loaded outcomeEntityId is ${err_msg}`)
      }

      outcomeEntities[outcomeEntity.sortOrder] = outcomeEntity
    }

    let newOdds: bigint[] | null = null

    if (funds !== null) {
      newOdds = getOdds(
        version,
        funds,
        conditionEntity.margin,
        conditionEntity._winningOutcomesCount,
      )
    }

    for (let i = 0; i < outcomeEntities.length; i++) {
      const outcomeEntity = deepCopy(outcomeEntities[i])

      if (outcomeEntity.outcomeId === betOutcomeEntities[k].outcomeId) {
        outcomeEntity._betsEntityIds = outcomeEntity._betsEntityIds!.concat([
          betEntityId,
        ])
      }

      // odds the condition outcomes must be recalculated after the odrinar bet placed
      // express bet will fire ChangeOdds event
      if (
        betType === BET_TYPE_ORDINAR
        && funds !== null
      ) {

        outcomeEntity.fund = funds[i]

        if (newOdds !== null) {
          outcomeEntity.rawCurrentOdds = newOdds[i]
        }

        // outcomeEntity.currentOdds = toDecimal(
        //   outcomeEntity.rawCurrentOdds,
        //   BASES_VERSIONS.mustGetEntry(version).value,
        // )
      }
      outcomeEntity._updatedAt = createdBlockTimestamp
      context.Outcome.set(outcomeEntity)
    }
  }

  const betEntity: BetEntity = {
    id: betEntityId,
    type_: betType,
    _subBetsCount: betOutcomeEntities.length,
    _wonSubBetsCount: 0,
    _lostSubBetsCount: 0,
    _canceledSubBetsCount: 0,
    rawOdds: odds,
    // odds: toDecimal(
    //   betEntity.rawOdds,
    //   BASES_VERSIONS.mustGetEntry(version).value,
    // ),
    _oddsDecimals: BASES_VERSIONS.mustGetEntry(version).value,
    // _conditions: conditionEntitiesIds,
    // _games: gameEntitiesIds,
    approxSettledAt: approxSettledAt,  // TODO: fix game shifted
    betId: tokenId,
    core_id: coreAddress,
    bettor: bettor,
    owner: bettor,
    actor: bettor,
    affiliate: affiliate ? affiliate : undefined,
    rawAmount: amount,
    // amount: toDecimal(amount, tokenDecimals),
    _tokenDecimals: tokenDecimals,
    _conditionIds: conditionIds,
    rawPotentialPayout: potentialPayout,
    // potentialPayout: toDecimal(
    // potentialPayout,
    // tokenDecimals,
    // ),
    createdTxHash: txHash,
    createdBlockNumber: BigInt(createdBlockNumber),
    createdBlockTimestamp: BigInt(createdBlockTimestamp),
    status: BET_STATUS_ACCEPTED.toString() as "Accepted",
    isRedeemed: false,
    isRedeemable: false,
    _isFreebet: false,
    _updatedAt: BigInt(createdBlockTimestamp),
    redeemedBlockTimestamp: undefined,
    resolvedBlockTimestamp: undefined,
    redeemedBlockNumber: undefined,
    redeemedTxHash: undefined,
    resolvedBlockNumber: undefined,
    result: undefined,
    freebet_id: undefined,
    rawPayout: undefined,
    rawSettledOdds: undefined,
    resolvedTxHash: undefined
  }

  context.Bet.set(betEntity)

  for (let i = 0; i < betOutcomeEntities.length; i++) {
    const betOutcomeEntity: OutcomeEntity = betOutcomeEntities[i]

    const selectionEntityId = getEntityId(betEntityId, conditionEntities[i].conditionId.toString())
    const selectionEntity: SelectionEntity = {
      id: selectionEntityId,
      rawOdds: conditionOdds[i],
      // odds: toDecimal(
      // selectionEntity.rawOdds,
      // betEntity._oddsDecimals,
      // ),
      _oddsDecimals: betEntity._oddsDecimals,
      outcome_id: betOutcomeEntity.id,
      _outcomeId: betOutcomeEntity.outcomeId,
      bet_id: betEntityId,
      result: undefined,
    }
    context.Selection.set(selectionEntity)
  }

  return betEntity
}

export function bettorWin(
  coreAddress: string,
  tokenId: bigint,
  amount: bigint,
  txHash: string,
  blockNumber: number,
  blockTimestamp: number,
  context: LPv2Contract_BettorWinEvent_handlerContext,
): void | null {
  const betEntityId = getEntityId(coreAddress, tokenId.toString())

  const coreContractEntity = context.CoreContract.get(coreAddress)

  if (!coreContractEntity) {
    throw new Error(`bettorWin coreContractEntity not found. coreContractEntityId = ${coreAddress}`)
  }

  if (coreContractEntity.type_.toLowerCase() === CORE_TYPE_LIVE) {
    const liveBetEntity = context.LiveBet.get(betEntityId)

    if (!liveBetEntity) {
      throw new Error(`handleBettorWin liveBetEntity not found in bettorWin. betEntity = ${betEntityId}`)
    }

    context.LiveBet.set({
      ...liveBetEntity,
      isRedeemed: true,
      isRedeemable: false,
      rawPayout: amount,
      // payout: toDecimal(amount, liveBetEntity._tokenDecimals),
      redeemedBlockNumber: BigInt(blockNumber),
      redeemedBlockTimestamp: BigInt(blockTimestamp),
      redeemedTxHash: txHash,
      _updatedAt: BigInt(blockTimestamp),
    })
  } else {
    const betEntity = context.Bet.get(betEntityId)

    if (!betEntity) {
      context.log.error(`handleBettorWin betEntity not found in bettorWin. betEntity = ${betEntityId}`)
      return null
      // throw new Error(`handleBettorWin betEntity not found in bettorWin. betEntity = ${betEntityId}. core type: ${coreContractEntity.type_}`)
    }

    context.Bet.set({
      ...betEntity,
      isRedeemed: true,
      isRedeemable: false,
      rawPayout: amount,
      // payout: toDecimal(amount, betEntity._tokenDecimals),
      redeemedBlockNumber: BigInt(blockNumber),
      redeemedBlockTimestamp: BigInt(blockTimestamp),
      redeemedTxHash: txHash,
      _updatedAt: BigInt(blockTimestamp),
    })
  }
}


export function createLiveBet(
  version: string,
  betType: typeof BET_TYPE_ORDINAR | typeof BET_TYPE_EXPRESS,
  liveConditionEntities: Mutable<LiveConditionEntity>[],
  liveOutcomeEntities: LiveOutcomeEntity[],
  conditionOdds: bigint[],
  odds: bigint,
  coreAddress: string,
  bettor: string,
  affiliate: string | undefined,
  tokenId: bigint,
  tokenDecimals: number,
  amount: bigint,
  payoutLimit: bigint,
  txHash: string,
  createdBlockNumber: bigint,
  createdBlockTimestamp: bigint,
  context: LiveCorev1Contract_NewLiveBetEvent_handlerContext,
): LiveBetEntity | null {
  let conditionIds: bigint[] = []
  let conditionEntitiesIds: string[] = []
  let gameIds: string[] = []

  for (let i = 0; i < liveConditionEntities.length; i++) {
    conditionIds[i] = liveConditionEntities[i].conditionId
    conditionEntitiesIds[i] = liveConditionEntities[i].id
    gameIds[i] = liveConditionEntities[i].gameId.toString()
  }

  // update outcomes, condition and game turnover for ordinar bets
  if (betType === BET_TYPE_ORDINAR) {
    liveConditionEntities[0].turnover = liveConditionEntities[0].turnover + amount
    liveConditionEntities[0]._updatedAt = createdBlockTimestamp
    context.LiveCondition.set(liveConditionEntities[0])
  }

  const potentialPayout = amount * odds / MULTIPLIERS_VERSIONS.get(version)!
  const liveBetEntityId = getEntityId(coreAddress, tokenId.toString())

  for (let k = 0; k < liveConditionEntities.length; k++) {
    const liveConditionEntity = liveConditionEntities[k]
    const outcomeEntities: Mutable<LiveOutcomeEntity>[] = []

    // double-check of sorting by sortOrder field
    for (let j = 0; j < liveConditionEntity.outcomesIds!.length; j++) {
      const outcomeId = liveConditionEntity.outcomesIds![j]

      const outcomeEntityId = getEntityId(
        liveConditionEntity.id,
        outcomeId.toString(),
      )
      const _liveOutcomeEntity = context.LiveOutcome.get(outcomeEntityId)!
      const liveOutcomeEntity = deepCopy(_liveOutcomeEntity)

      outcomeEntities[liveOutcomeEntity.sortOrder] = liveOutcomeEntity
    }

    for (let i = 0; i < outcomeEntities.length; i++) {
      const liveOutcomeEntity = outcomeEntities[i]

      if (liveOutcomeEntity.outcomeId === outcomeEntities[k].outcomeId) {
        liveOutcomeEntity._betsEntityIds = liveOutcomeEntity._betsEntityIds!.concat([liveBetEntityId])
      }

      liveOutcomeEntity._updatedAt = createdBlockTimestamp
      context.LiveOutcome.set(liveOutcomeEntity)
    }
  }

  const liveBetEntity: LiveBetEntity = {
    id: liveBetEntityId,
    _subBetsCount: liveOutcomeEntities.length,
    _wonSubBetsCount: 0,
    _lostSubBetsCount: 0,
    _canceledSubBetsCount: 0,
    rawOdds: odds,
    // odds: toDecimal(odds, 12),
    _oddsDecimals: BASES_VERSIONS.mustGetEntry(version).value,
    // _conditions: conditionEntitiesIds,
    _gamesIds: gameIds,
    // TODO: fix game shifted
    betId: tokenId,
    core_id: coreAddress,
    bettor: bettor,
    owner: bettor,
    actor: bettor,
    affiliate: affiliate,
    rawAmount: amount,
    // amount: toDecimal(liveBetEntity.rawAmount, tokenDecimals),
    _tokenDecimals: tokenDecimals,
    _conditionIds: conditionIds,
    rawPotentialPayout: potentialPayout,
    // potentialPayout: toDecimal(potentialPayout, 12),
    rawPayoutLimit: payoutLimit,
    // payoutLimit: toDecimal(payoutLimit, 12),
    createdTxHash: txHash,
    createdBlockNumber: createdBlockNumber,
    createdBlockTimestamp: createdBlockTimestamp,
    status: BET_STATUS_ACCEPTED,
    isRedeemed: false,
    isRedeemable: false,
    _updatedAt: createdBlockTimestamp,
    redeemedBlockTimestamp: undefined,
    resolvedBlockNumber: undefined,
    resolvedBlockTimestamp: undefined,
    redeemedBlockNumber: undefined,
    resolvedTxHash: undefined,
    redeemedTxHash: undefined,
    result: undefined,
    rawPayout: undefined,
    rawSettledOdds: undefined
  }

  context.LiveBet.set(liveBetEntity)

  for (let i = 0; i < liveOutcomeEntities.length; i++) {
    const liveOutcomeEntity = liveOutcomeEntities[i]

    const liveSelectionEntityId = getEntityId(
      liveBetEntityId,
      liveConditionEntities[i].conditionId.toString(),
    )
    const liveSelectionEntity = {
      id: liveSelectionEntityId,
      rawOdds: conditionOdds[i],
      // odds: toDecimal(liveSelectionEntity.rawOdds, liveBetEntity._oddsDecimals),
      _oddsDecimals: liveBetEntity._oddsDecimals,
      outcome_id: liveOutcomeEntity.id,
      _outcomeId: liveOutcomeEntity.outcomeId,
      bet_id: liveBetEntityId,
      result: undefined,
    }
    context.LiveSelection.set(liveSelectionEntity)
  }
  return liveBetEntity
}
