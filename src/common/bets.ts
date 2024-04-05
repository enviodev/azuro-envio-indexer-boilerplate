import { zeroPadBytes } from "ethers"
import { ZERO_ADDRESS, BET_TYPE_ORDINAR, MULTIPLIERS_VERSIONS, BASES_VERSIONS, BET_STATUS_ACCEPTED, CORE_TYPE_LIVE } from "../constants"
import { BetEntity, Corev2Contract_NewBetEvent_handlerContext, Expressv2Contract_TransferEvent_handlerContext, GameEntity, LPContract_NewBetEvent_handlerContext, LiveBetEntity } from "../src/Types.gen"
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen"
import { getOdds, toDecimal } from "../utils/math"


export function transferBet(
  coreAddress: string | null,
  azuroBetAddress: string | null,
  tokenId: BigInt,
  from: string,
  to: string,
  block: number,
  context: Expressv2Contract_TransferEvent_handlerContext,
): BetEntity | null {
  // create nft
  if (from === ZERO_ADDRESS) {
    return null
  }

  // burn nft
  if (to === ZERO_ADDRESS) {
    return null
  }

  let finalCoreAddress = ''

  if (coreAddress !== null) {
    finalCoreAddress = coreAddress
  }
  else if (azuroBetAddress !== null) {
    // id?
    const azuroBetContractEntity = context.AzuroBetContract.get(azuroBetAddress)

    // TODO remove later
    if (!azuroBetContractEntity) {
      context.log.error(`transferBet azuroBetContractEntity not found. azuroBetAddress = ${azuroBetAddress}`)
      return null
    }

    finalCoreAddress = azuroBetContractEntity.core_id
  }

  const betEntityId = finalCoreAddress + "_" + tokenId.toString()
  const betEntity = context.Bet.get(betEntityId)

  if (!betEntity) {
    context.log.error(`transferBet betEntity not found. betEntity = ${betEntityId}`)
    return null
  }

  if (!betEntity._isFreebet) {
    context.Bet.set({
      ...betEntity,
      owner: to,
      actor: to,
      _updatedAt: BigInt(block),
    })
  } else {
    context.Bet.set({
      ...betEntity,
      owner: to,
      _updatedAt: BigInt(block),
    })
  }

  return betEntity
}


export function linkBetWithFreeBet(
  coreAddress: string,
  tokenId: BigInt,
  freebetEntityId: string,
  freebetOwner: string,
  blockTimestamp: number,
  context: any,
): BetEntity | null {

  const betEntityId = coreAddress + "_" + tokenId.toString()
  const betEntity = context.Bet.get(betEntityId)

  if (!betEntity) {
    context.log.error(`linkBetWithFreeBet betEntity not found. betEntity = ${betEntityId}`)

    return null
  }

  context.Bet.set({
    ...betEntity,
    freebet: freebetEntityId,
    _isFreebet: true,
    bettor: freebetOwner,
    actor: freebetOwner,
    _updatedAt: blockTimestamp,
  })

  return betEntity
}

export function createBet(
  version: string,
  betType: string,
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
  createdBlockTimestamp: number,
  createdBlockNumber: number,
  funds: bigint[] | null,
  context: LPContract_NewBetEvent_handlerContext | Corev2Contract_NewBetEvent_handlerContext,
): BetEntity | null {
  let conditionIds: bigint[] = []
  let conditionEntitiesIds: string[] = []
  let gameEntitiesIds: string[] = []

  let approxSettledAt = 0n

  for (let i = 0; i < conditionEntities.length; i++) {
    conditionIds[i] = conditionEntities[i].conditionId
    conditionEntitiesIds[i] = conditionEntities[i].id
    gameEntitiesIds[i] = conditionEntities[i].game_id

    const gameEntity: GameEntity = context.Game.get(gameEntitiesIds[i])!

    if (gameEntity.startsAt > approxSettledAt) {
      approxSettledAt = gameEntity.startsAt + BigInt("7200")
    }
  }

  // update outcomes, condition and game turnover for ordinar bets
  if (betType === BET_TYPE_ORDINAR) {
    const conditionEntity: ConditionEntity = context.Condition.get(conditionEntitiesIds[0])!
    context.Condition.set({
      ...conditionEntity,
      turnover: conditionEntity.turnover + amount,
      _updatedAt: BigInt(createdBlockTimestamp),
    })

    const gameEntity: GameEntity = context.Game.get(conditionEntities[0].game_id)!
    context.Game.set({
      ...gameEntity,
      turnover: gameEntity.turnover + amount,
      _updatedAt: BigInt(createdBlockTimestamp),
    })

    const leagueEntity = context.League.get(gameEntity.league_id)!
    context.League.set({
      ...leagueEntity,
      turnover: leagueEntity.turnover + amount,
    })

    const countryEntity = context.Country.get(leagueEntity.country)!
    context.Country.set({
      ...countryEntity,
      turnover: countryEntity.turnover + amount,
    })
  }

  const potentialPayout = amount * odds / (MULTIPLIERS_VERSIONS.get(version)!)

  const _betType = betType as "Ordinar" | "Express"

  for (let k = 0; k < conditionEntities.length; k++) {
    const conditionEntity = conditionEntities[k]
    const outcomeEntities: OutcomeEntity[] = []

    // double-check of sorting by sortOrder field
    for (let j = 0; j < conditionEntity.outcomesIds!.length; j++) {
      const outcomeId = conditionEntity.outcomesIds![j]

      const outcomeEntityId = conditionEntity.id + "_" + outcomeId.toString()
      const outcomeEntity: OutcomeEntity = context.Outcome.get(outcomeEntityId)!

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
      const outcomeEntity = outcomeEntities[i]

      if (outcomeEntity.outcomeId === betOutcomeEntities[k].outcomeId) {
        context.Outcome.set({
          ...outcomeEntity,
          _betsEntityIds: outcomeEntity._betsEntityIds!.concat([betEntityId,]),
        })
      }

      // odds the condition outcomes must be recalculated after the odrinar bet placed
      // express bet will fire ChangeOdds event
      if (
        betType === BET_TYPE_ORDINAR
        && funds !== null
      ) {

        if (newOdds !== null) {
          context.Outcome.set({
            ...outcomeEntity,
            rawCurrentOdds: newOdds[i],
          })
        }

        context.Outcome.set({
          ...outcomeEntity,
          fund: funds[i],
          // currentOdds: toDecimal(
          //   outcomeEntity.rawCurrentOdds,
          //   BASES_VERSIONS.mustGetEntry(version).value,
          // ),
        })

      }

      context.Outcome.set({
        ...outcomeEntity,
        _updatedAt: BigInt(createdBlockTimestamp),
      })
    }
  }

  const betEntityId = coreAddress + "_" + tokenId.toString()

  const betEntity = {
    id: betEntityId, 
    betType: _betType,
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

    const selectionEntityId = betEntityId + "_" + conditionEntities[i].conditionId.toString()

    context.Selection.set({
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
    })
  }

  return betEntity
}

export function bettorWin(
  coreAddress: string,
  tokenId: bigint,
  amount: bigint,
  txHash: string,
  block: number,
  blockTimestamp: number,
  context: any,
): void {
  const betEntityId = coreAddress + "_" + tokenId.toString()

  const coreContractEntity = context.CoreContract.get(coreAddress)

  if (!coreContractEntity) {
    context.log.error('coreContractEntity not found. coreContractEntityId = {}', [
      coreAddress,
    ])

    return
  }

  if (coreContractEntity.type === CORE_TYPE_LIVE) {
    const liveBetEntity: LiveBetEntity = context.LiveBet.get(betEntityId)

    if (!liveBetEntity) {
      context.log.error('v1 handleBettorWin betEntity not found. betEntity = {}', [
        betEntityId,
      ])

      return
    }

    context.LiveBet.set({
      ...liveBetEntity,
      isRedeemed: true,
      isRedeemable: false,
      rawPayout: amount,
      payout: toDecimal(amount, liveBetEntity._tokenDecimals),
      redeemedBlockNumber: block,
      redeemedBlockTimestamp: blockTimestamp,
      redeemedTxHash: txHash,
      _updatedAt: blockTimestamp,
    })
  } else {
    const betEntity: BetEntity = context.Bet.get(betEntityId)

    if (!betEntity) {
      context.log.error(`v1 handleBettorWin betEntity not found. betEntity = ${betEntityId}`)
      return
    }

    context.Bet.set({
      ...betEntity,
      isRedeemed: true,
      isRedeemable: false,
      rawPayout: amount,
      payout: toDecimal(amount, betEntity._tokenDecimals),
      redeemedBlockNumber: block,
      redeemedBlockTimestamp: blockTimestamp,
      redeemedTxHash: txHash,
      _updatedAt: blockTimestamp,
    })
  }
}
