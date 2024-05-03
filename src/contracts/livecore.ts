import { ContractAbi, Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { LiveCondition, LiveConditionResponse } from "../utils/types";

import { CHAIN_CONSTANTS } from "../constants";

const contractABI = require("../../abis/LiveCoreV1.json");

//
export async function getLiveConditionFromId(
  contractAddress: string,
  chainId: number,
  _conditionId: bigint
): Promise<{
  readonly condition: LiveConditionResponse;
}> {
  console.log("livecore", contractAddress);

  const conditionId = _conditionId.toString();
  const cache = await Cache.init(CacheCategory.LiveCondition, chainId);
  const _condition = await cache.read(conditionId);

  if (_condition) {
    return _condition;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const liveCoreContract = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const _result = (await Promise.resolve(
      liveCoreContract.methods.getCondition(conditionId).call()
    )) as unknown;
    const result = _result as LiveCondition;

    const condition: LiveConditionResponse = {
      gameId: result.gameId.toString().toLowerCase(),
      funds: [
        result.funds[0].toString().toLowerCase(),
        result.funds[1].toString().toLowerCase(),
      ],
      virtualFunds: [
        result.virtualFunds[0].toString().toLowerCase(),
        result.virtualFunds[1].toString().toLowerCase(),
      ],
      reinforcement: result.reinforcement.toString().toLowerCase(),
      affiliatesReward: result.affiliatesReward.toString().toLowerCase(),
      outcomes: [
        result.outcomes[0].toString().toLowerCase(),
        result.outcomes[1].toString().toLowerCase(),
      ],
      outcomeWin: result.outcomeWin.toString().toLowerCase(),
      margin: result.margin.toString().toLowerCase(),
      oracle: result.oracle.toString().toLowerCase(),
      endsAt: result.endsAt.toString().toLowerCase(),
      state: result.state.toString().toLowerCase(),
      leaf: result.leaf.toString().toLowerCase(),
    };

    const entry = {
      condition: condition,
    } as const;

    cache.add({ [conditionId]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err;
  }
}

export function deserialiseLiveConditionResult(
  response: LiveConditionResponse
): LiveCondition {
  const condition: LiveCondition = {
    gameId: BigInt(response.gameId),
    funds: [BigInt(response.funds[0]), BigInt(response.funds[1])],
    virtualFunds: [
      BigInt(response.virtualFunds[0]),
      BigInt(response.virtualFunds[1]),
    ],
    reinforcement: BigInt(response.reinforcement),
    affiliatesReward: BigInt(response.affiliatesReward),
    outcomes: [BigInt(response.outcomes[0]), BigInt(response.outcomes[1])],
    outcomeWin: BigInt(response.outcomeWin),
    margin: BigInt(response.margin),
    oracle: response.oracle,
    endsAt: BigInt(response.endsAt),
    state: BigInt(response.state),
    leaf: BigInt(response.leaf),
  };
  return condition;
}
