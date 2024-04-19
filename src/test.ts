import { ContractAbi, Web3 } from "web3";
const contractABI = require("../abis/CoreV2.json");


const rpcURL = 'https://rpc.ankr.com/gnosis'

// Create Web3 instance
const web3 = new Web3(rpcURL);

// Create LPv1 contract instance
const corev2Contract = new web3.eth.Contract(contractABI, '0xC95C831c7bDb0650b8cD5F2a542b263872d8ed0e');


async function getResult(){
    const result = await corev2Contract.methods.getCondition('475234004475234005').call() as any
    console.log(result)

    const condition = {
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
    console.log(condition)
}

getResult()