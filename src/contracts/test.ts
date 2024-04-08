import { Web3 } from 'web3';
import { OriginalConditionResultV1 } from './corev1';
const contractABI = require("../../abis/CoreV1.json");

const rpcUrl = 'https://rpc.ankr.com/gnosis'

const web3 = new Web3(rpcUrl);

const corev1Contract = new web3.eth.Contract(contractABI, '0x4fE6A9e47db94a9b2a4FfeDE8db1602FD1fdd37d');

async function getCondition() {
    console.log("hi")
    const _result = await corev1Contract.methods.getCondition("1").call() as unknown;
    const result = _result as OriginalConditionResultV1;
    console.log(result)
    console.log("bye")
}

getCondition()