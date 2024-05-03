import { Web3 } from "web3";

import { Cache, CacheCategory } from "../lib/cache";

import { CHAIN_CONSTANTS } from "../constants";

// LPv1 Contract ABI
const contractABI = require("../../abis/BetExpressV2.json");

export async function getPrematchAddress(
  contractAddress: string,
  chainId: number
): Promise<{
  readonly preMatchAddress: string;
}> {
  const cache = await Cache.init(CacheCategory.ExpressPrematchAddress, chainId);
  const _addr = await cache.read(contractAddress);

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
    const _address = (await express.methods.core().call()) as unknown;
    const preMatchAddress = _address as string;

    const entry = {
      preMatchAddress: preMatchAddress,
    } as const;

    cache.add({ [contractAddress]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err;
  }
}

export async function calcPayout(
  contractAddress: string,
  tokenId: bigint,
  chainId: number
): Promise<{
  readonly payout: string;
}> {
  const cache = await Cache.init(CacheCategory.ExpressCalcPayout, chainId);
  const _payout = await cache.read(contractAddress.toLowerCase());

  if (_payout) {
    return _payout;
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create LPv1 contract instance
  const express = new web3.eth.Contract(contractABI, contractAddress);

  try {
    const payout = (await express.methods
      .calcPayout(tokenId)
      .call()) as unknown as bigint;

    if (!payout) {
      throw new Error("payout is not a valid number");
    }

    const entry = {
      payout: payout.toString(),
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    return entry;
  } catch (err) {
    console.error("An error occurred", err);
    throw err;
  }
}
