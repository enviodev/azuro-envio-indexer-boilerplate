import { ContractAbi, Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

import { ConditionV1 } from "../utils/types";

type OriginalConditionResult = {
    fundBank: [string, string]; // or [BN, BN] if using BN objects
    payouts: [string, string];
    totalNetBets: [string, string];
    reinforcement: string; // or BN
    margin: string; // or BN
    ipfsHash: string;
    outcomes: [string, string];
    scopeId: string; // or BN
    outcomeWin: string; // or BN
    timestamp: string; // or BN
    state: string; // Solidity enums are returned as strings representing numbers
    leaf: string; // or BN
};

// LPv1 Contract ABI
const contractABI = require("../../abis/CoreV3.json");

// Function to get ERC20 token address from the liquidity pool contract
export async function getConditionV3FromId(
    contractAddress: string,
    chainId: number,
    _conditionId: bigint,
): Promise<{
    readonly condition: ConditionV1;
}> {
    console.log("getConditionV3FromId", contractAddress)

    const conditionId = _conditionId.toString();
    const cache = Cache.init(CacheCategory.ConditionV1, chainId);
    const condition = cache.read(conditionId);

    if (condition) {
        return condition;
    }

    // RPC URL
    const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

    // Create Web3 instance
    const web3 = new Web3(rpcURL);

    // Create LPv1 contract instance
    const corev3Contract = new web3.eth.Contract(contractABI, contractAddress);

    try {
        const _result = await corev3Contract.methods.getCondition(conditionId).call() as unknown;
        const result = _result as OriginalConditionResult;

        const condition: ConditionV1 = {
            fundBank: [BigInt(result.fundBank[0]), BigInt(result.fundBank[1])],
            payouts: [BigInt(result.payouts[0]), BigInt(result.payouts[1])],
            totalNetBets: [BigInt(result.totalNetBets[0]), BigInt(result.totalNetBets[1])],
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