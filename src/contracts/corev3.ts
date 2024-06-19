import { ContractAbi, Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS, rpcsToRotate } from "../constants"; // todo: @AlexTheLion123 this needs to be improved for generalizing for different chains

import { ConditionV3, ConditionV3Response } from "../utils/types";

const contractABI = require("../../abis/CoreV3.json");

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let rpcIndex = 0;

// 0xC95C831c7bDb0650b8cD5F2a542b263872d8ed0e
export async function getConditionV3FromId(
  contractAddress: string,
  chainId: number,
  _conditionId: bigint
): Promise<{
  readonly condition: ConditionV3Response;
}> {
  const conditionId = _conditionId.toString();
  const cache = await Cache.init(CacheCategory.ConditionV3, chainId);
  const _condition = await cache.read(conditionId);

  if (_condition) {
    return _condition;
  }

  // a function to loop through rpcsToRotate
  const getRpcUrl = (rpcsToRotate: string[]) => {
    const rpc = rpcsToRotate[rpcIndex];
    rpcIndex = (rpcIndex + 1) % rpcsToRotate.length;
    console.log("rpc: ", rpc)
    return rpc;
  };

  // RPC URL
  // const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;
  const rpcURL = getRpcUrl(rpcsToRotate);

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const corev3Contract = new web3.eth.Contract(contractABI, contractAddress);

  console.log("getCondtionv3 from rpc conditionId: ", conditionId);

  try {
    const result = (await corev3Contract.methods
      .getCondition(conditionId)
      .call()) as unknown as ConditionV3;

    const condition: ConditionV3Response = {
      gameId: result.gameId.toString(),
      payouts: [result.payouts[0].toString(), result.payouts[1].toString()],
      virtualFunds: [
        result.virtualFunds[0].toString(),
        result.virtualFunds[1].toString(),
      ],
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

export function deserialiseConditionV3Result(
  response: ConditionV3Response
): ConditionV3 {
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

  const condition: ConditionV3 = {
    gameId: BigInt(response.gameId),
    payouts: [BigInt(response.payouts[0]), BigInt(response.payouts[1])],
    virtualFunds: [
      BigInt(response.virtualFunds[0]),
      BigInt(response.virtualFunds[1]),
    ],
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
