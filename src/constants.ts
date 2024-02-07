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
