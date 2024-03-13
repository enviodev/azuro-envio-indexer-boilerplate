export async function TryFetchIpfsFile(contentHash: string) {
  // https://gateway.ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1
  try {
    const response = await fetch(`https://gateway.ipfs.io/ipfs/${contentHash}`);
    console.log("response");
    if (response.ok) {
      console.log("response ok");
      console.log(await response.json());
      //   return await response.json();
    }
  } catch (e) {
    console.error("Unable to fetch from Cloudflare");
  }

  try {
    const response = await fetch(
      `https://cloudflare-ipfs.com/ipfs/${contentHash}`
    );
    console.log("response");
    if (response.ok) {
      console.log(await response.json());
      //   return await response.json();
    }
  } catch (e) {
    console.error("Unable to fetch from Cloudflare");
  }

  try {
    const response = await fetch(`https://ipfs.io/ipfs/${contentHash}`);
    console.log("response");
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("Unable to fetch from IPFS");
  }

  return null;
}

(async () => {
  //   await TryFetchIpfsFile("QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1");
  await TryFetchIpfsFile("QmWn4izrAkESersK7xvVFprYb9CYrZV4VLr6t1XDJbHVf2");
})();

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
