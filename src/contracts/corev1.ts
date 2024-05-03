import { Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";
import { ConditionV1, ConditionV1Response } from "../utils/types";

// LPv1 Contract ABI
const contractABI = require("../../abis/CoreV1.json");

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 0x4fE6A9e47db94a9b2a4FfeDE8db1602FD1fdd37d
// https://rpc.ankr.com/gnosis
export async function getConditionV1FromId(
  contractAddress: string,
  chainId: number,
  _conditionId: bigint,
  context: any
): Promise<{
  readonly condition: ConditionV1Response;
}> {
  const conditionId = _conditionId.toString();
  const cache = await Cache.init(CacheCategory.ConditionV1, chainId);
  const _condition = await cache.read(conditionId);

  if (_condition) {
    return _condition;
  }
  // to avoid rate limiting
  // await sleep(200);

  context.log.debug(`getting new condition with id ${conditionId}`);

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const corev1Contract = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const _result = (await corev1Contract.methods
      .getCondition(conditionId)
      .call()) as unknown;
    const result = _result as ConditionV1Response;

    const condition: ConditionV1Response = {
      fundBank: [
        result.fundBank[0].toString().toLowerCase(),
        result.fundBank[1].toString().toLowerCase(),
      ],
      payouts: [
        result.payouts[0].toString().toLowerCase(),
        result.payouts[1].toString().toLowerCase(),
      ],
      totalNetBets: [
        result.totalNetBets[0].toString().toLowerCase(),
        result.totalNetBets[1].toString().toLowerCase(),
      ],
      reinforcement: result.reinforcement.toString().toLowerCase(),
      margin: result.margin.toString().toLowerCase(),
      ipfsHash: result.ipfsHash.toString().toLowerCase(),
      outcomes: [
        result.outcomes[0].toString().toLowerCase(),
        result.outcomes[1].toString().toLowerCase(),
      ],
      scopeId: result.scopeId.toString().toLowerCase(),
      outcomeWin: result.outcomeWin.toString().toLowerCase(),
      timestamp: result.timestamp.toString().toLowerCase(),
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
    throw err; // or handle the error as needed
  }
}

export function deserialiseConditionV1Result(
  result: ConditionV1Response
): ConditionV1 {
  const condition: ConditionV1 = {
    fundBank: [BigInt(result.fundBank[0]), BigInt(result.fundBank[1])],
    payouts: [BigInt(result.payouts[0]), BigInt(result.payouts[1])],
    totalNetBets: [
      BigInt(result.totalNetBets[0]),
      BigInt(result.totalNetBets[1]),
    ],
    reinforcement: BigInt(result.reinforcement),
    margin: BigInt(result.margin),
    ipfsHash: result.ipfsHash,
    outcomes: [BigInt(result.outcomes[0]), BigInt(result.outcomes[1])],
    scopeId: BigInt(result.scopeId),
    outcomeWin: BigInt(result.outcomeWin),
    timestamp: BigInt(result.timestamp),
    state: Number(result.state),
    leaf: BigInt(result.leaf),
  };
  return condition;
}
