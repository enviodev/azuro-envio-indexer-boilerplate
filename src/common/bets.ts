import { zeroPadBytes } from "ethers"
import { ZERO_ADDRESS, BET_TYPE_ORDINAR, MULTIPLIERS_VERSIONS, BASES_VERSIONS } from "../constants"
import { BetEntity, GameEntity, LiveBetEntity } from "../src/Types.gen"
import { ConditionEntity, OutcomeEntity } from "../src/Types.gen"
import { getOdds, toDecimal } from "../utils/math"


export function transferBet(
  coreAddress: string | null,
  azuroBetAddress: string | null,
  tokenId: BigInt,
  from: string,
  to: string,
  block: number,
  context: any,
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
      _updatedAt: block,
    })
  } else {
    context.Bet.set({
      ...betEntity,
      owner: to,
      _updatedAt: block,
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
  context: any,
): BetEntity | null {
  let conditionIds: bigint[] = []
  let conditionEntitiesIds: string[] = []
  let gameEntitiesIds: string[] = []

  let approxSettledAt = BigInt('0')

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
    const conditionEntity: ConditionEntity = context.condition.get(conditionEntitiesIds[0])!
    context.ConditionEntity.set({
      ...conditionEntity,
      turnover: conditionEntity.turnover + amount,
      _updatedAt: createdBlockTimestamp,
    })

    const gameEntity: GameEntity = context.Game.get(conditionEntities[0].game_id)!
    context.Game.set({
      ...gameEntity,
      turnover: gameEntity.turnover + amount,
      _updatedAt: createdBlockTimestamp,
    })

    const leagueEntity = context.League.get(gameEntity.league_id)!
    leagueEntity.turnover = leagueEntity.turnover.plus(amount)

    const countryEntity = context.Country.get(leagueEntity.country)!
    countryEntity.turnover = countryEntity.turnover + amount
  }

  const potentialPayout = amount * odds / (MULTIPLIERS_VERSIONS.get(version)!)

  const betEntityId = coreAddress + "_" + tokenId.toString()
  const betEntity: BetEntity = context.Bet.get(betEntityId)

  context.Bet.set({
    ...betEntity,
    type: betType,
    _subBetsCount: betOutcomeEntities.length,
    _wonSubBetsCount: 0,
    _lostSubBetsCount: 0,
    _canceledSubBetsCount: 0,
    rawOdds: odds,
    odds: toDecimal(
      betEntity.rawOdds,
      BASES_VERSIONS.mustGetEntry(version).value,
    ),
    _oddsDecimals: BASES_VERSIONS.mustGetEntry(version).value
  })

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
          currentOdds: toDecimal(
            outcomeEntity.rawCurrentOdds,
            BASES_VERSIONS.mustGetEntry(version).value,
          ),
        })

      }

      context.Outcome.set({
        ...outcomeEntity,
        _updatedAt: createdBlockTimestamp,
      })
    }
  }

  context.Bet.set({
    _conditions: conditionEntitiesIds,
    _games: gameEntitiesIds,
    approxSettledAt: approxSettledAt,  // TODO: fix game shifted
    betId: tokenId,
    core: coreAddress,
    bettor: bettor,
    owner: bettor,
    actor: bettor,
    affiliate: affiliate ? affiliate : null,
    rawAmount: amount,
    amount: toDecimal(betEntity.rawAmount, tokenDecimals),
    _tokenDecimals: tokenDecimals,
    _conditionIds: conditionIds,
    rawPotentialPayout: potentialPayout,
    potentialPayout: toDecimal(
      betEntity.rawPotentialPayout,
      tokenDecimals,
    ),
    createdTxHash: txHash,
    createdBlockNumber: createdBlockNumber,
    createdBlockTimestamp: createdBlockTimestamp,
    status: BET_STATUS_ACCEPTED.toString(),
    isRedeemed: false,
    isRedeemable: false,
    _isFreebet: false,
    _updatedAt: createdBlockTimestamp,
  })

  for (let i = 0; i < betOutcomeEntities.length; i++) {
    const betOutcomeEntity: OutcomeEntity = betOutcomeEntities[i]

    const selectionEntityId = betEntityId + "_" + conditionEntities[i].conditionId.toString()
    const selectionEntity = context.Selection.load(selectionEntityId)

    context.Selection.set({
      ...selectionEntity,
      rawOdds: conditionOdds[i],
      odds: toDecimal(
        selectionEntity.rawOdds,
        betEntity._oddsDecimals,
      ),
      _oddsDecimals: betEntity._oddsDecimals,
      outcome: betOutcomeEntity.id,
      _outcomeId: betOutcomeEntity.outcomeId,
      bet: betEntity.id,
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
