import { zeroPadBytes } from "ethers"
import { ZERO_ADDRESS } from "../constants"
import { BetEntity } from "../src/Types.gen"


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
  if (from  === ZERO_ADDRESS) {
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