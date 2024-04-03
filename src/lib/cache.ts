import * as fs from "fs";
import { type } from "os";
import * as path from "path";

export type Condition = {
  fundBank: [bigint, bigint];
  payouts: [bigint, bigint];
  totalNetBets: [BigInt, bigint];
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

export const CacheCategory = {
  Token: "token",
  LPv1: "lpv1",
  LPv1Bet: "lpv1bet",
  FreebetV1Contract: "freebetv1",
  ConditionV1: "conditionv1",
} as const;

export type CacheCategory = (typeof CacheCategory)[keyof typeof CacheCategory];

type Address = string;
type ConditionId = string;

type Shape = Record<string, Record<string, string>>;
type ShapeRoot = Shape & Record<Address, { hash: string }>;

type ShapeToken = Shape &
  Record<Address, { decimals: number; name: string; symbol: string }>;

type ShapeLPv1 = Shape & Record<Address, { token: string }>;

type ShapeLPv1Bet = Shape & Record<Address, { azuroBetAddress: string }>;

type ShapeFreebetV1 = Shape & Record<Address, { name: string; lp: string }>;

type ShapeConditionV1 = Shape & Record<ConditionId, { condition: Condition }>;

export class Cache {
  static init<C = CacheCategory>(
    category: C,
    chainId: number | string | bigint
  ) {
    if (!Object.values(CacheCategory).find((c) => c === category)) {
      throw new Error("Unsupported cache category");
    }

    type S = C extends "token"
      ? ShapeToken
      : C extends "lpv1"
      ? ShapeLPv1
      : C extends "lpv1bet"
      ? ShapeLPv1Bet
      : C extends "conditionv1"
      ? ShapeConditionV1
      : C extends "freebetv1"
      ? ShapeFreebetV1
      : ShapeRoot;
    const entry = new Entry<S>(`${category}-${chainId.toString()}`);
    return entry;
  }
}

export class Entry<T extends Shape> {
  private memory: Shape = {};

  static encoding = "utf8" as const;
  static folder = "./.cache" as const;

  public readonly key: string;
  public readonly file: string;

  constructor(key: string) {
    this.key = key;
    this.file = Entry.resolve(key);

    this.preflight();
    this.load();
  }

  public read(key: string) {
    const memory = this.memory || {};
    return memory[key] as T[typeof key];
  }

  public load() {
    try {
      const data = fs.readFileSync(this.file, Entry.encoding);
      this.memory = JSON.parse(data) as T;
    } catch (error) {
      console.error(error);
      this.memory = {};
    }
  }

  public add<N extends T>(fields: N) {
    if (!this.memory || Object.values(this.memory).length === 0) {
      this.memory = fields;
    } else {
      Object.keys(fields).forEach((key) => {
        if (!this.memory[key]) {
          this.memory[key] = {};
        }
        Object.keys(fields[key]).forEach((nested) => {
          this.memory[key][nested] = fields[key][nested];
        });
      });
    }

    this.publish();
  }

  private preflight() {
    /** Ensure cache folder exists */
    if (!fs.existsSync(Entry.folder)) {
      fs.mkdirSync(Entry.folder);
    }
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify({}));
    }
  }

  private publish() {
    const prepared = JSON.stringify(this.memory);
    try {
      fs.writeFileSync(this.file, prepared);
    } catch (error) {
      console.error(error);
    }
  }

  static resolve(key: string) {
    return path.join(Entry.folder, key.toLowerCase().concat(".json"));
  }
}
