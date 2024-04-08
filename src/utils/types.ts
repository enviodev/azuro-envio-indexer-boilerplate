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