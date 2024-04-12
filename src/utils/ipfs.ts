import { CoreContract_ConditionCreatedEvent_handlerContextAsync } from "../src/Types.gen";
import { IPFSMatchDetails } from "./types";

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

export async function tryFetchIpfsFile(contentHash: string, context: CoreContract_ConditionCreatedEvent_handlerContextAsync): Promise<IPFSMatchDetails | null> {
  // https://gateway.ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1
  try {
    const response = await fetch(`https://gateway.ipfs.io/ipfs/${contentHash}`);
    if (response.ok) {
      const resp = await response.json();
      return resp as IPFSMatchDetails;
    }
  } catch (e) {
    context.log.error("Unable to fetch from IPFS Gateway");
  }

  try {
    const response = await fetch(
      `https://cloudflare-ipfs.com/ipfs/${contentHash}`
    );
    console.log("response");
    if (response.ok) {
      const resp = await response.json();
      return resp as IPFSMatchDetails;
    }
  } catch (e) {
    context.log.error("Unable to fetch from Cloudflare");
  }

  try {
    const response = await fetch(`https://ipfs.io/ipfs/${contentHash}`);
    if (response.ok) {
      const resp = await response.json();
      return resp as IPFSMatchDetails;
    }
  } catch (e) {
    context.log.error("Unable to fetch from IPFS");
  }

  return null;
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