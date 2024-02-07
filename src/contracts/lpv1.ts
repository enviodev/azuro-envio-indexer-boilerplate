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

    // Return an object containing the name, decimals, and symbol
    const entry = {
      token: address?.toString() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}
