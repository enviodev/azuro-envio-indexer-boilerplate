import { calcPayout } from "../contracts/express"

export async function calcPayoutV2(address: string, tokenId: bigint, chainId: number): Promise<bigint> {
  const {payout} = await calcPayout(address, tokenId, chainId)
  return BigInt(payout)
}

export async function calcPayoutV3(address: string, tokenId: bigint, chainId: number): Promise<bigint> {
  const {payout} = await calcPayout(address, tokenId, chainId)
  return BigInt(payout)
}