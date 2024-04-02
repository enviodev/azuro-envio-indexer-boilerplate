
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

export const BET_TYPE_ORDINAR = 'Ordinar'
export const BET_TYPE_EXPRESS = 'Express'

export const CONDITION_STATUS_CREATED = 'Created'
export const CONDITION_STATUS_RESOLVED = 'Resolved'
export const CONDITION_STATUS_CANCELED = 'Canceled'
export const CONDITION_STATUS_PAUSED = 'Paused'

export const BET_RESULT_WON = 'Won'
export const BET_RESULT_LOST = 'Lost'

export const BET_STATUS_ACCEPTED = 'Accepted'
export const BET_STATUS_CANCELED = 'Canceled'
export const BET_STATUS_RESOLVED = 'Resolved'

export const SELECTION_RESULT_WON = 'Won'
export const SELECTION_RESULT_LOST = 'Lost'

export const LP_TRANSACTION_TYPE_DEPOSIT = 'Deposit'
export const LP_TRANSACTION_TYPE_WITHDRAWAL = 'Withdrawal'

export const GAME_STATUS_CREATED = 'Created'
export const GAME_STATUS_PAUSED = 'Paused'
export const GAME_STATUS_CANCELED = 'Canceled'
export const GAME_STATUS_RESOLVED = 'Resolved'

export const X_PROFIT = BigInt(75)
export const X_PROFIT_DIVIDER = BigInt(100)



/**
 * TypedMap entry.
 */
export class TypedMapEntry<K, V> {
  key: K
  value: V

  constructor(key: K, value: V) {
    this.key = key
    this.value = value
  }
}


/** Typed map */
export class TypedMap<K, V> {
  entries: Array<TypedMapEntry<K, V>>

  constructor() {
    this.entries = new Array<TypedMapEntry<K, V>>(0)
    // this.entries = []
  }

  set(key: K, value: V): void {
    let entry = this.getEntry(key)
    if (entry !== null) {
      entry.value = value
    } else {
      let entry = new TypedMapEntry<K, V>(key, value)
      this.entries.push(entry)
    }
  }

  getEntry(key: K): TypedMapEntry<K, V> | null {
    for (let i: number = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return this.entries[i]
      }
    }
    return null
  }

  mustGetEntry(key: K): TypedMapEntry<K, V> {
    const entry = this.getEntry(key)
    if (entry === null) {
      throw new Error(`Entry for key ${key} does not exist in TypedMap`);
    }
    return entry!
  }

  get(key: K): V | null {
    for (let i: number = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return this.entries[i].value
      }
    }
    return null
  }

  mustGet(key: K): V {
    const value = this.get(key)
    if (value === null) {
      throw new Error(`Entry for key ${key} does not exist in TypedMap`);
    }
    return value!
  }

  isSet(key: K): boolean {
    for (let i: number = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return true
      }
    }
    return false
  }
}

export const MULTIPLIERS_VERSIONS = new TypedMap<string, bigint>()

MULTIPLIERS_VERSIONS.set(VERSION_V1, C1e9)
MULTIPLIERS_VERSIONS.set(VERSION_V2, C1e12)
MULTIPLIERS_VERSIONS.set(VERSION_V3, C1e12)

const V1_BASE = 9
const V2_BASE = 12
const V3_BASE = 12

export const BASES_VERSIONS = new TypedMap<string, number>()

BASES_VERSIONS.set(VERSION_V1, V1_BASE)
BASES_VERSIONS.set(VERSION_V2, V2_BASE)
BASES_VERSIONS.set(VERSION_V3, V3_BASE)
