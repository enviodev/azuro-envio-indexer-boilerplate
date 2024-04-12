import { CoreContract_ConditionCreatedEvent_handlerContextAsync, LPv2Contract_NewGameEvent_handlerContext } from "../src/Types.gen";
import { IPFSMatchDetails } from "./types";
import { Cache, CacheCategory } from "../lib/cache";
import { match } from "assert";


function encodeBase58(hexStr: string): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + hexStr);
  let encoded = '';

  while (num > 0) {
    const remainder = num % BigInt(58);
    num = num / BigInt(58);
    encoded = alphabet[Number(remainder)] + encoded;
  }

  return encoded;
}


export function byte32ToIPFSCIDv0(hexStr: string): string {
  // Convert the hex string to a Buffer
  const binaryStr = Buffer.from(hexStr, 'hex');
  // Prepend the multihash identifier and length (0x12 for sha2-256, 0x20 for 32 bytes)
  const completedBinaryStr = Buffer.concat([Buffer.from([0x12, 0x20]), binaryStr]);
  // Encode the complete binary string to Base58
  return encodeBase58(completedBinaryStr.toString('hex'));
}


export async function tryFetchIpfsFile(
  contentHash: string,
  chainId: number,
  context: CoreContract_ConditionCreatedEvent_handlerContextAsync | LPv2Contract_NewGameEvent_handlerContext,
): Promise<IPFSMatchDetails | null> {
  // https://gateway.ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1

  const cache = Cache.init(CacheCategory.IPFSMatchDetails, chainId);
  const matchDetails = cache.read(contentHash);

  if (matchDetails) {
    return matchDetails.matchDetails;
  }
  
  let resp: IPFSMatchDetails | undefined = undefined;
  
  try {
    resp = await fetchIpfsFile(contentHash, "gateway.ipfs.io", context);
  } catch (e) {
    try {
      resp = await fetchIpfsFile(contentHash, "cloudflare-ipfs.com", context);
    } catch (e) {
      try {
        resp = await fetchIpfsFile(contentHash, "ipfs.io", context);
      } catch (e) {
        context.log.error("Unable to fetch from any IPFS gateway");
      }
    }
  }

  if (resp) {
    const entry = {
      matchDetails: resp,
    } as const;

    cache.add({ [contentHash]: entry as any });
    return resp;
  }

  return null
}

async function fetchIpfsFile(contentHash: string, baseUrl: string, context: CoreContract_ConditionCreatedEvent_handlerContextAsync | LPv2Contract_NewGameEvent_handlerContext): Promise<IPFSMatchDetails | undefined> {
  try {
    const response = await fetch(`https://${baseUrl}/ipfs/${contentHash}`);
    if (response.ok) {
      const resp = await response.json() as IPFSMatchDetails;
      return resp
    }
  } catch (e) {
    context.log.error(`Unable to fetch IPFS data from ${baseUrl}`);
    throw e
  }
}


// (async () => {
//   //   await TryFetchIpfsFile("QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1");
//   await TryFetchIpfsFile("QmWn4izrAkESersK7xvVFprYb9CYrZV4VLr6t1XDJbHVf2");
// })();

// const multihashes = require("multihashes");
// const bs58 = require("bs58");

// let bytes32Hash =
//   "0x7d602b7ee30ca048334485fb7ae5ccd87d83a185b50182a617b1084a21d806cd";

// function bytes32ToIpfsHash(bytes32: any) {
//   // Convert bytes32 to hexadecimal string
//   const hexString = bytes32.replace(/^0x/i, "");

//   // Convert hexadecimal string to buffer
//   const buffer = Buffer.from(hexString, "hex");

//   // Add multihash prefix for SHA-256
//   const multihashBuffer = multihashes.encode(buffer, "sha2-256");

//   // Base58 encode the multihash
//   return bs58.encode(multihashBuffer);
// }

// let ipfsHash = bytes32ToIpfsHash(bytes32Hash);

// console.log(ipfsHash);