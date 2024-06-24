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

  console.log("condition id: ", conditionId);

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

    console.log('awe')
    const result = _result as LiveCondition;

    console.log('awe')
    console.log(JSON.stringify(result, null, 2))

    throw new Error('not implemented')

    const condition: LiveConditionResponse = {
      gameId: result.gameId.toString(),
      payouts: result.payouts.map(payout => payout.toString().toLowerCase()),
      virtualFunds: result.virtualFunds.map(virtualFund => virtualFund.toString().toLowerCase()),
      totalNetBets: result.totalNetBets.toString(),
      reinforcement: result.reinforcement.toString(),
      fund: result.fund.toString(),
      margin: result.margin.toString(),
      endsAt: result.endsAt.toString(),
      lastDepositId: result.lastDepositId.toString(),
      winningOutcomesCount: result.winningOutcomesCount.toString(),
      state: result.state.toString(),
      oracle: result.oracle.toString(),
      isExpressForbidden: result.isExpressForbidden.toString(),
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

  if (response.payouts.length !== 2) {
    throw new Error(
      `v3 ConditionCreated payouts length is incorrect. payouts = ${response.payouts}`
    );
  }

  if (response.virtualFunds.length !== 2) {
    throw new Error(
      `v3 ConditionCreated virtualFunds length is incorrect. virtualFunds = ${response.virtualFunds}`
    );
  }

  const condition: LiveCondition = {
    gameId: BigInt(response.gameId),
    payouts: response.payouts.map(payout => BigInt(payout)),
    virtualFunds: response.virtualFunds.map(virtualFund => BigInt(virtualFund)),
    totalNetBets: BigInt(response.totalNetBets),
    reinforcement: BigInt(response.reinforcement),
    fund: BigInt(response.fund),
    margin: BigInt(response.margin),
    endsAt: BigInt(response.endsAt),
    lastDepositId: BigInt(response.lastDepositId),
    winningOutcomesCount: BigInt(response.winningOutcomesCount),
    state: BigInt(response.state),
    oracle: response.oracle,
    isExpressForbidden: isExpressForbidden,
  };
  return condition;
}
