
type chainConstants = {
  readonly rpcURL: string;
};

const GOERLI_CHAIN_CONSTANTS: chainConstants = {
  rpcURL: "https://rpc.ankr.com/gnosis",
};

// Key is chain ID
export const CHAIN_CONSTANTS: Record<number, chainConstants> = {
  100: GOERLI_CHAIN_CONSTANTS,
};


export const VERSION_V1 = 'V1'
export const VERSION_V2 = 'V2'
export const VERSION_V3 = 'V3'

export const C1e9 = BigInt('1000000000')
export const C1e12 = BigInt('1000000000000')

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'