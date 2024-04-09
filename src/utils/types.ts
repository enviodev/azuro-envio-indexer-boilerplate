export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};


export type ConditionV1 = {
  fundBank: [bigint, bigint];
  payouts: [bigint, bigint];
  totalNetBets: [bigint, bigint];
  reinforcement: bigint;
  margin: bigint;
  ipfsHash: string; // Bytes32 values can be represented as hex strings
  outcomes: [bigint, bigint]; // Assuming these are meant to be large numbers
  scopeId: bigint;
  outcomeWin: bigint;
  timestamp: bigint; // Using BigInt for timestamps to avoid JavaScript number limitations
  state: number; // Assuming 'ConditionState' is an enum represented by a number
  leaf: bigint;
};

export type ConditionV1Response = {
  fundBank: [string, string]; // or [BN, BN] if using BN objects
  payouts: [string, string];
  totalNetBets: [string, string];
  reinforcement: string; // or BN
  margin: string; // or BN
  ipfsHash: string;
  outcomes: [string, string];
  scopeId: string; // or BN
  outcomeWin: string; // or BN
  timestamp: string; // or BN
  state: string; // Solidity enums are returned as strings representing numbers
  leaf: string; // or BN
};



export type ConditionV2 = {
  gameId: bigint;
  funds: [bigint, bigint];
  virtualFunds: [bigint, bigint];
  reinforcement: bigint;
  affiliatesReward: bigint;
  outcomes: [bigint, bigint];
  outcomeWin: bigint;
  margin: bigint;
  oracle: string;
  endsAt: bigint;
  state: bigint;
  leaf: bigint;
};


export type ConditionV2Response = {
  gameId: string;
  funds: [string, string];
  virtualFunds: [string, string];
  reinforcement: string;
  affiliatesReward: string;
  outcomes: [string, string];
  outcomeWin: string;
  margin: string;
  oracle: string;
  endsAt: string;
  state: string;
  leaf: string;
}


// TODO
export type ConditionV3 = {
  gameId: bigint;
  funds: [bigint, bigint];
  virtualFunds: [bigint, bigint];
  reinforcement: bigint;
  affiliatesReward: bigint;
  outcomes: [bigint, bigint];
  outcomeWin: bigint;
  margin: bigint;
  oracle: string;
  endsAt: bigint;
  state: bigint;
  leaf: bigint;
};

export type ConditionV3Response = {
  gameId: string;
  funds: [string, string];
  virtualFunds: [string, string];
  reinforcement: string;
  affiliatesReward: string;
  outcomes: [string, string];
  outcomeWin: string;
  margin: string;
  oracle: string;
  endsAt: string;
  state: string;
  leaf: string;
}