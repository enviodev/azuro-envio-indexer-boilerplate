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
    const result = (await Promise.resolve(
      liveCoreContract.methods.getCondition(conditionId).call()
    )) as unknown as LiveCondition;

    const condition: LiveConditionResponse = {
      maxReserved: result.maxReserved.toString(),
      payouts: result.payouts.map(payout => payout.toString().toLowerCase()),
      totalNetBets: result.totalNetBets.toString(),
      settledAt: result.settledAt.toString(),
      lastDepositId: result.lastDepositId.toString(),
      winningOutcomesCount: result.winningOutcomesCount.toString(),
      state: result.state.toString(),
      oracle: result.oracle.toString(),
      isExpressForbidden: result.isExpressForbidden.toString(),
    }

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

export function deserialiseLiveConditionResponse(
  response: LiveConditionResponse
): LiveCondition {
  let isExpressForbidden: boolean;
  if (response.isExpressForbidden === "true") {
    isExpressForbidden = true;
  } else if (response.isExpressForbidden === "false") {
    isExpressForbidden = false;
  } else {
    throw new Error(
      `v3 ConditionCreated isExpressForbidden incorrect format. isExpressForbidden = ${response.isExpressForbidden}`
    );
  }

  const condition: LiveCondition = {
    maxReserved: BigInt(response.maxReserved),
    payouts: response.payouts.map(payout => BigInt(payout)),
    totalNetBets: BigInt(response.totalNetBets),
    settledAt: BigInt(response.settledAt),
    lastDepositId: Number(response.lastDepositId),
    winningOutcomesCount: Number(response.winningOutcomesCount),
    state: Number(response.state),
    oracle: response.oracle,
    isExpressForbidden: isExpressForbidden,
  };

  return condition;
}
