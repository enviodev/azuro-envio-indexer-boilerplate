import { LiquidityPoolContractEntity } from "../../generated/src/Types.gen";

import { getErc20TokenDetails } from "../contracts/erc20";

export async function createPoolEntity(
  version: string,
  coreAddress: string,
  liquidityPoolAddress: string,
  tokenAddress: string,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number
): Promise<LiquidityPoolContractEntity> {
  let { decimals, symbol } = await getErc20TokenDetails(tokenAddress, chainId);

  const liquidityPoolContractEntity = {
    id: liquidityPoolAddress,
    address: liquidityPoolAddress,
    coreAddresses: [coreAddress],
    token: tokenAddress,
    version: version,
    chainId: chainId,
    tokenDecimals: decimals,
    asset: symbol,
    // rawApr: 0n,
    apr: 0n,
    betsAmount: 0n,
    betsCount: 0n,
    wonBetsAmount: 0n,
    wonBetsCount: 0n,
    // rawTvl: todo,
    // tvl: todo,
    firstCalculatedBlockNumber: BigInt(blockNumber),
    // firstCalculatedBlockTimestamp: BigInt(blockTimestamp),
    lastCalculatedBlockNumber: BigInt(blockNumber),
    lastCalculatedBlockTimestamp: BigInt(blockTimestamp),
    daysSinceDeployment: 0n,
    depositedAmount: 0n,
    withdrawnAmount: 0n,
    withdrawTimeout: 0n,
    depositedWithStakingAmount: 0n,
    withdrawnWithStakingAmount: 0n,
  };

  console.log("liquidityPoolContractEntity");
  console.log(liquidityPoolContractEntity);

  return liquidityPoolContractEntity;
}
