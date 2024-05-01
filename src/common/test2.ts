import { log } from "console";
import { Log } from "ethers";

function differentiateHex(hexStr: string): string {
  // Remove the "0x" prefix if present
  if (hexStr.startsWith("0x")) {
    hexStr = hexStr.slice(2);
  }

  // Length check for typical identifiers or hashes
  if (hexStr.length == 64) {
    return "Identifier or hash";
  }

  // Convert to a plain string for further checks
  let plainStr = "";
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexByte = hexStr.substring(i, i + 2);
    plainStr += String.fromCharCode(parseInt(hexByte, 16));
  }

  // Quick check for JSON-like structures
  if (plainStr.startsWith("{") || plainStr.includes(":")) {
    try {
      return JSON.parse(plainStr);
    } catch {
      return "Invalid JSON";
    }
  }

  // If it doesn't match known structures
  return "Uncertain";
}

// Testing the function
const testHex1 = "0x7b2273706f72744964223a33332c22636f756e747279223a7b226e616d65223a22496e7465726e6174696f6e616c20546f75726e616d656e7473227d2c226c6561677565223a7b226e616d65223a2255454641202d204368616d70696f6e73204c6561677565227d2c227061727469636970616e7473223a5b7b226e616d65223a2247616c6174617361726179227d2c7b226e616d65223a224d6f6c646520464b227d5d2c226578747261223a7b2270726f7669646572223a327d7d";
const testHex2 = "0x472e6bcdaf2d8acb2bc7d5d003facb62ea865d4268b99879ffee44f3f622c931";

console.log(testHex2.length)

console.log(typeof differentiateHex(testHex1));  // Expected: JSON Data
console.log(differentiateHex(testHex2));  // Expected: Identifier or hash
console.log("HELLO", JSON.parse(testHex1));  // Expected: JSON Data