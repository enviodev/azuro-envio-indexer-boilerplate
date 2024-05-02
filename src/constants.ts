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

export const LPV3_CREATION_BLOCK=30176898

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

CORE_TYPES.set(
  '0x56ff202de9ba417fbc2912bebe53dea80efb0df607262a180f0517649590c806',
  CORE_TYPE_PRE_MATCH,
)
CORE_TYPES.set(
  '0xa370412a877636f0419e753f8c70c2a0836cf09798778fd9a2285aaae2c168e7',
  CORE_TYPE_PRE_MATCH_V2,
)
CORE_TYPES.set(
  '0x36216ab39e2e6e2f7615df148032d88ba1863a2cb6295d3f972e47d1ac7a4a85',
  CORE_TYPE_EXPRESS,
)
CORE_TYPES.set(
  '0x0120c420fa0b8dacbc611f3b9d2b64da4e1e8984482ec9dff5b8371455ae24b0',
  CORE_TYPE_EXPRESS_V2,
)
CORE_TYPES.set(
  '0x889375b77befea7650d686ae2bb3a2d812c58007d3fc942cd8eb7cf4fc8d4e93',
  CORE_TYPE_LIVE,
)

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
