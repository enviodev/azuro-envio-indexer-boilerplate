import { VERSION_V1, VERSION_V2, VERSION_V3 } from "../constants";

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Version = typeof VERSION_V1 | typeof VERSION_V2 | typeof VERSION_V3

export type IPFSMatchDetails = {
  titleLeague: string | null;
  titleCountry: string | null;
  entity1Name: string | null;
  entity2Name: string | null;
  entity1Image: string | null;
  entity2Image: string | null;
  sportTypeId: number | null;
  scopeId: number | null;
  gameId: number | null;
  leagueId: number | null;
  countryId: number | null;
  //v2
  sportId?: number | null;
  country?: {
    name: string | null;
  }
  league?: {
    name: string | null;
  }
  extra?: {
    provider: number | null;
  }
  participants: Array<{ name: string | null, image: string | null }> | null
  // string access forparticipantNameKey, participantImageKey
  [key: string]: string | number | null | { name: string | null } | { provider: number | null } | Array<{ name: string | null, image: string | null }> | undefined;
}


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


export type ConditionV3 = {
  gameId: bigint;
  payouts: bigint[];
  virtualFunds: bigint[];
  totalNetBets: bigint;
  reinforcement: bigint;
  fund: bigint;
  margin: bigint;
  endsAt: bigint;
  lastDepositId: bigint;
  winningOutcomesCount: bigint;
  state: bigint;
  oracle: string;
  isExpressForbidden: boolean;
};

export type ConditionV3Response = {
  gameId: string;
  payouts: string[];
  virtualFunds: string[];
  totalNetBets: string;
  reinforcement: string;
  fund: string;
  margin: string;
  endsAt: string;
  lastDepositId: string;
  winningOutcomesCount: string;
  state: string;
  oracle: string;
  isExpressForbidden: string;
};

export type LiveCondition = {
  maxReserved: bigint;
  payouts: bigint[];
  totalNetBets: bigint;
  settledAt: bigint;
  lastDepositId: number;
  winningOutcomesCount: number;
  state: number;
  oracle: string;
  isExpressForbidden: boolean;
};

export type LiveConditionResponse = {
  maxReserved: string;
  payouts: string[];
  totalNetBets: string;
  settledAt: string;
  lastDepositId: string;
  winningOutcomesCount: string;
  state: string;
  oracle: string;
  isExpressForbidden: string;
}