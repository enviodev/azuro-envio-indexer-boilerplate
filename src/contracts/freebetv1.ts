import { Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

// ERC20 Contract ABI
const contractABI = require("../../abis/FreebetV1.json");

// Should work for both FreebetV1 and FreebetV2
// since they have the same functions for name and LP
export async function getLPAndNameOfFreebetV1Details(
  contractAddress: string,
  chainId: number
): Promise<{
  readonly name: string;
  readonly lp: string;
}> {
  console.log(contractAddress)

  const cache = Cache.init(CacheCategory.FreebetV1Contract, chainId);
  const details = cache.read(contractAddress.toLowerCase());

  if (details) {
    return {
      name: details.name,
      lp: details.symbol,
    };
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  const freebetV1SC = new web3.eth.Contract(contractABI, contractAddress);

  try {
    // Use Promise.all to execute all calls in parallel and wait for all of them to resolve
    // const [name, lp] = await Promise.all([
    const [name, LP] = await Promise.all([
      freebetV1SC.methods.name().call(),
      freebetV1SC.methods.LP().call(),
    ]);

    // Return an object containing the name, decimals, and symbol
    const entry = {
      name: name?.toString() || "",
      lp: LP?.toString() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    // throw 'test';
    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}
