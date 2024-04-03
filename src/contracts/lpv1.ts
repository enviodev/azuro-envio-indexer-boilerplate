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
    const address = await Promise.resolve(lpv1token.methods.token().call());

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
    const azuroBetAddress = await Promise.resolve(_lpv1.methods.azuroBet().call());

    const entry = {
      azuroBet: azuroBetAddress?.toString().toLowerCase() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err
  }
}
