import { Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

// LPv1 Contract ABI
const contractABI = require("../../abis/BetExpressV2.json");


export async function getPrematchAddress(
  contractAddress: string,
  chainId: number,
): Promise<{
  readonly preMatchAddress: string;
}> {
  const cache = Cache.init(CacheCategory.ExpressPrematchAddress, chainId);
  const _addr = cache.read(contractAddress.toLowerCase());

  if (_addr) {
    return _addr;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const express = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const _address = await express.methods.core().call() as unknown;
    const preMatchAddress = _address as string;
    
    const entry = {
      preMatchAddress: preMatchAddress.toLowerCase(),
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err
  }
}


export async function calcPayout(
  contractAddress: string,
  tokenId: bigint,
  chainId: number,
): Promise<{
  readonly payout: bigint;
}> {
  const cache = Cache.init(CacheCategory.ExpressCalcPayout, chainId);
  const _addr = cache.read(contractAddress.toLowerCase());

  if (_addr) {
    return _addr;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const express = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const _payout = await express.methods.calcPayout(tokenId).call() as unknown;
    const payout = _payout as bigint;
    
    const entry = {
      payout: BigInt(payout),
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err
  }
}
