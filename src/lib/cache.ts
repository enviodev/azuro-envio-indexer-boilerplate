import * as fs from "fs";
import { type } from "os";
import * as path from "path";
import sqlite3 from "sqlite3";
import {
  ConditionV1Response,
  ConditionV2Response,
  ConditionV3Response,
  IPFSMatchDetails,
  LiveCondition,
  LiveConditionResponse,
} from "../utils/types";

export const CacheCategory = {
  Token: "token",
  LPv1: "lpv1",
  LPv1Bet: "lpv1bet",
  FreebetV1Contract: "freebetv1",
  ConditionV1: "conditionv1",
  ConditionV2: "conditionv2",
  ConditionV3: "conditionv3",
  LiveCondition: "livecondition",
  LPv1NodeWithdrawView: "lpv1nodewithdrawview",
  IPFSMatchDetails: "ipfsmatchdetails",
  ExpressPrematchAddress: "expressprematchaddress",
  ExpressCalcPayout: "expresscalcpayout",
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

type ShapeConditionV1 = Shape &
  Record<ConditionId, { condition: ConditionV1Response }>;

type ShapeConditionV2 = Shape &
  Record<ConditionId, { condition: ConditionV2Response }>;

type ShapeConditionV3 = Shape &
  Record<ConditionId, { condition: ConditionV3Response }>;

type ShapeLiveCondition = Shape &
  Record<ConditionId, { condition: LiveConditionResponse }>;

type ShapeLpv1NodeWithdrawView = Shape &
  Record<Address, { withdrawAmount: string }>;

type ShapeIPFSMatchDetails = Shape &
  Record<string, { matchDetails: IPFSMatchDetails }>;

type ShapeExpressPreMatchAddress = Shape &
  Record<Address, { preMatchAddress: string }>;

type ShapeExpressCalcPayout = Shape & Record<Address, { payout: string }>;

export class Cache {
  static async init<C = CacheCategory>(
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
      : C extends "lpv1nodewithdrawview"
      ? ShapeLpv1NodeWithdrawView
      : C extends "conditionv1"
      ? ShapeConditionV1
      : C extends "conditionv2"
      ? ShapeConditionV2
      : C extends "conditionv3"
      ? ShapeConditionV3
      : C extends "livecondition"
      ? ShapeLiveCondition
      : C extends "freebetv1"
      ? ShapeFreebetV1
      : C extends "ipfsmatchdetails"
      ? ShapeIPFSMatchDetails
      : C extends "expressprematchaddress"
      ? ShapeExpressPreMatchAddress
      : C extends "expresscalcpayout"
      ? ShapeExpressCalcPayout
      : ShapeRoot;
    const entry = new Entry<S>(`${category}${chainId.toString()}`);
    await entry.createTableIfNotExists(); // Ensure the table is created before returning the entry
    return entry;
  }
}

// SQLite database initialization
const db = new sqlite3.Database(".cache/cache.db");

export class Entry<T extends Shape> {
  public readonly key: string;

  constructor(key: string) {
    this.key = key;
  }

  async createTableIfNotExists() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.key} (
        id TEXT PRIMARY KEY,
        data TEXT
      )
    `;
    // console.log("Executing query:", query);
    await db.run(query, (err) => {
      if (err) {
        console.error("Error creating table:", err);
      } else {
        // console.log("Table created successfully:", this.key);
      }
    });
  }

  public read(key: string): Promise<T[typeof key]> {
    // todo : does this need to await?
    // todo : make this
    return new Promise((resolve, reject) => {
      // console.log("Reading key:", key, "from table:", this.key);
      const query = `SELECT data FROM ${this.key} WHERE id = ?`;
      // console.log("Executing query:", query, "with key:", key);
      db.get(query, [key], (err, row: any) => {
        if (err) {
          console.error("Error executing query:", err);
          reject(err);
        } else {
          // console.log("Query result:", row);
          resolve(row ? JSON.parse(row.data) : null);
        }
      });
    });
  }

  public async add<N extends T>(fields: N) {
    const keys = Object.keys(fields);
    if (keys.length !== 1) {
      throw new Error("Only one key should be provided for insertion");
    }
    const id = keys[0];
    // todo: this could be smarter and actually store the data in columns and not just a id data field
    const query = `INSERT INTO ${this.key} (id, data) VALUES (?, ?)`;
    const data = JSON.stringify(fields[id]);
    // // console.log("Executing query:", query, "with id:", id, "and data:", data);
    return new Promise<void>((resolve, reject) => {
      db.run(query, [id, data], (err) => {
        if (err) {
          console.error("Error executing query:", err);
          reject(err);
        } else {
          // // console.log("Data added successfully");
          resolve();
        }
      });
    });
  }
}
