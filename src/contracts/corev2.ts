import { ContractAbi, Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

import { ConditionV2, ConditionV2Response } from "../utils/types";


// LPv1 Contract ABI
const contractABI = require("../../abis/CoreV2.json");

// 0xC95C831c7bDb0650b8cD5F2a542b263872d8ed0e
export async function getConditionV2FromId(
    contractAddress: string,
    chainId: number,
    _conditionId: bigint,
): Promise<{
    readonly condition: ConditionV2Response;
}> {
    const conditionId = _conditionId.toString();
    const cache = Cache.init(CacheCategory.ConditionV2, chainId);
    const _condition = cache.read(conditionId);

    if (_condition) {
        return _condition;
    }

    // RPC URL
    const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

    // Create Web3 instance
    const web3 = new Web3(rpcURL);

    // Create LPv1 contract instance
    const corev2Contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log("contractAddress getCondtionv2", contractAddress)

    try {
        const _result = await corev2Contract.methods.getCondition(conditionId).call() as unknown;
        const result = _result as ConditionV2;

        const condition: ConditionV2Response = {
            gameId: result.gameId.toString().toLowerCase(),
            funds: [result.funds[0].toString().toLowerCase(), result.funds[1].toString().toLowerCase()],
            virtualFunds: [result.virtualFunds[0].toString().toLowerCase(), result.virtualFunds[1].toString().toLowerCase()],
            reinforcement: result.reinforcement.toString().toLowerCase(),
            affiliatesReward: result.affiliatesReward.toString().toLowerCase(),
            outcomes: [result.outcomes[0].toString().toLowerCase(), result.outcomes[1].toString().toLowerCase()],
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


export function deserialiseConditionV2Result(response: ConditionV2Response): ConditionV2 {
    const condition: ConditionV2 = {
        gameId: BigInt(response.gameId),
        funds: [BigInt(response.funds[0]), BigInt(response.funds[1])],
        virtualFunds: [BigInt(response.virtualFunds[0]), BigInt(response.virtualFunds[1])],
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