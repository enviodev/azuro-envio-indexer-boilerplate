
// import { ExpressV2 } from '../../generated/templates/ExpressV2/ExpressV2'
// import { ExpressV3 } from '../../generated/templates/ExpressV3/ExpressV3'


export function calcPayoutV2(address: string, tokenId: bigint): bigint {
  // const expressSC = ExpressV2.bind(Address.fromString(address))

  // const payout = expressSC.try_calcPayout(tokenId)

  // if (!payout.reverted) {
  //   return payout.value
  // }

  return 0n
}

export function calcPayoutV3(address: string, tokenId: bigint): bigint {
  // const expressSC = ExpressV3.bind(Address.fromString(address))

  // const payout = expressSC.try_calcPayout(tokenId)

  // if (!payout.reverted) {
  //   return payout.value
  // }

  return 0n
}