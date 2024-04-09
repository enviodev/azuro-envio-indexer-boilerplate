import { Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

// LPv1 Contract ABI
const contractABI = require("../../abis/LPV1.json");

// Function to get ERC20 token address from the liquidity pool contract
export async function getTokenForPool(
  contractAddress: string,
  chainId: number
): Promise<{
  readonly token: string;
}> {
  console.log("getTokenForPool", contractAddress)

  const cache = Cache.init(CacheCategory.LPv1, chainId);
  const lpv1 = cache.read(contractAddress.toLowerCase());

  if (lpv1) {
    return lpv1;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const lpv1token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const address = await lpv1token.methods.token().call();

    const entry = {
      token: address?.toString().toLowerCase() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}


export async function getAzuroBetAddress(
  contractAddress: string,
  chainId: number
): Promise<{
  readonly azuroBetAddress: string;
}> {
  // console.log("getAzuroBetAddress", contractAddress)

  const cache = Cache.init(CacheCategory.LPv1Bet, chainId);
  const lpv1 = cache.read(contractAddress.toLowerCase());

  if (lpv1) {
    return lpv1;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const _lpv1 = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const azuroBetAddress = await _lpv1.methods.azuroBet().call();

    const entry = {
      azuroBetAddress: azuroBetAddress?.toString().toLowerCase() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err
  }
}

// 0x204e7371Ade792c5C006fb52711c50a7efC843ed
export async function getNodeWithdrawAmount(
  contractAddress: string,
  chainId: number,
  leaf: bigint,
): Promise<{
  readonly withdrawAmount: string;
}> {
  const cache = Cache.init(CacheCategory.LPv1NodeWithdrawView, chainId);
  const lpv1 = cache.read(contractAddress.toLowerCase());

  if (lpv1) {
    return lpv1;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const _lpv1 = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const _withdrawAmount = await _lpv1.methods.nodeWithdrawView(leaf.toString()).call() as unknown;
    const withdrawAmount = _withdrawAmount as bigint;
    
    const entry = {
      withdrawAmount: withdrawAmount.toString(),
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err
  }
}
