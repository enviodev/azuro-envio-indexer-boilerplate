import { Web3 } from 'web3';
import { OriginalConditionResultV2 } from './corev2';
const contractABI = require("../../abis/CoreV2.json");

const rpcUrl = 'https://rpc.ankr.com/gnosis'

const web3 = new Web3(rpcUrl);

const corev1Contract = new web3.eth.Contract(contractABI, '0xC95C831c7bDb0650b8cD5F2a542b263872d8ed0e');

async function getCondition() {
    console.log("hi")
    const _result = await corev1Contract.methods.getCondition("1").call();
    // const result = _result as OriginalConditionResultV2;
    console.log(_result)
    console.log("bye")
}

getCondition()