import { TypedMap } from "./utils/mapping";

type chainConstants = {
  readonly rpcURL: string;
};

const GOERLI_CHAIN_CONSTANTS: chainConstants = {
  rpcURL: "https://rpc.ankr.com/gnosis",
  // rpcURL: "https://gnosis-mainnet.public.blastapi.io",
  // rpcURL: "wss://gnosis-rpc.publicnode.com"
};

// Key is chain ID
export const CHAIN_CONSTANTS: Record<number, chainConstants> = {
  100: GOERLI_CHAIN_CONSTANTS,
};

export const VERSION_V1 = "V1";
export const VERSION_V2 = "V2";
export const VERSION_V3 = "V3";

export const C1e9 = BigInt("1000000000");
export const C1e12 = BigInt("1000000000000");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const BET_TYPE_ORDINAR = "Ordinar";
export const BET_TYPE_EXPRESS = "Express";

export const CONDITION_STATUS_CREATED = "Created";
export const CONDITION_STATUS_RESOLVED = "Resolved";
export const CONDITION_STATUS_CANCELED = "Canceled";
export const CONDITION_STATUS_PAUSED = "Paused";

export const BET_RESULT_WON = "Won";
export const BET_RESULT_LOST = "Lost";

export const BET_STATUS_ACCEPTED = "Accepted";
export const BET_STATUS_CANCELED = "Canceled";
export const BET_STATUS_RESOLVED = "Resolved";

export const SELECTION_RESULT_WON = "Won";
export const SELECTION_RESULT_LOST = "Lost";

export const LP_TRANSACTION_TYPE_DEPOSIT = "Deposit";
export const LP_TRANSACTION_TYPE_WITHDRAWAL = "Withdrawal";

export const GAME_STATUS_CREATED = "Created";
export const GAME_STATUS_PAUSED = "Paused";
export const GAME_STATUS_CANCELED = "Canceled";
export const GAME_STATUS_RESOLVED = "Resolved";

export const FREEBET_STATUS_CREATED = "Created";
export const FREEBET_STATUS_REISSUED = "Reissued";
export const FREEBET_STATUS_REDEEMED = "Redeemed";
export const FREEBET_STATUS_WITHDRAWN = "Withdrawn";

export const CORE_TYPE_PRE_MATCH = "pre-match";
export const CORE_TYPE_PRE_MATCH_V2 = "pre-match-v2";
export const CORE_TYPE_EXPRESS = "express";
export const CORE_TYPE_EXPRESS_V2 = "express-v2";
export const CORE_TYPE_LIVE = "live";
export const CORE_TYPES = new TypedMap<string, string>();

export const X_PROFIT = BigInt(75);
export const X_PROFIT_DIVIDER = BigInt(100);

export const MULTIPLIERS_VERSIONS = new TypedMap<string, bigint>();
MULTIPLIERS_VERSIONS.set(VERSION_V1, C1e9);
MULTIPLIERS_VERSIONS.set(VERSION_V2, C1e12);
MULTIPLIERS_VERSIONS.set(VERSION_V3, C1e12);

const V1_BASE = 9;
const V2_BASE = 12;
const V3_BASE = 12;

export const BASES_VERSIONS = new TypedMap<string, number>();
BASES_VERSIONS.set(VERSION_V1, V1_BASE);
BASES_VERSIONS.set(VERSION_V2, V2_BASE);
BASES_VERSIONS.set(VERSION_V3, V3_BASE);


export const DEFAULT_COUNTRY = 'International Tournaments'

export const CHAINS_IDS = new TypedMap<string, string>()
CHAINS_IDS.set('gnosis', '100')
CHAINS_IDS.set('matic', '137')
CHAINS_IDS.set('mumbai', '80001')
CHAINS_IDS.set('arbitrum-one', '42161')
CHAINS_IDS.set('arbitrum-goerli', '421613')

// tmp hack for linea
CHAINS_IDS.set('polygon-zkevm-testnet', '59140')
CHAINS_IDS.set('polygon-zkevm', '59144')

const AVATARS_PROVIDER_BASE_URL_DEV = 'https://dev-avatars.azuro.org/images/'
const AVATARS_PROVIDER_BASE_URL_PROD = 'https://avatars.azuro.org/images/'

// chainId -> avatars base url
export const AVATARS_PROVIDER_BASE_URLS = new TypedMap<string, string>()

AVATARS_PROVIDER_BASE_URLS.set('100', AVATARS_PROVIDER_BASE_URL_PROD)
AVATARS_PROVIDER_BASE_URLS.set('137', AVATARS_PROVIDER_BASE_URL_PROD)
AVATARS_PROVIDER_BASE_URLS.set('42161', AVATARS_PROVIDER_BASE_URL_PROD)
AVATARS_PROVIDER_BASE_URLS.set('59144', AVATARS_PROVIDER_BASE_URL_PROD)

AVATARS_PROVIDER_BASE_URLS.set('80001', AVATARS_PROVIDER_BASE_URL_DEV)
AVATARS_PROVIDER_BASE_URLS.set('421613', AVATARS_PROVIDER_BASE_URL_DEV)
AVATARS_PROVIDER_BASE_URLS.set('59144', AVATARS_PROVIDER_BASE_URL_DEV)
