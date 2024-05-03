import sqlite3 from "sqlite3";
import {
    ConditionV1Response,
    ConditionV2Response,
} from "../utils/types";

export const CacheCategory = {
    ConditionV1: "conditionv1",
} as const;

export type CacheCategory = (typeof CacheCategory)[keyof typeof CacheCategory];

type Address = string;
type ConditionId = string;

type Shape = Record<string, Record<string, string>>;
type ShapeRoot = Shape & Record<Address, { hash: string }>;

type ShapeConditionV1 = Shape &
    Record<ConditionId, { condition: ConditionV1Response }>;

export class Cache {
    static async init<C = CacheCategory>(
        category: C,
        chainId: number | string | bigint
    ) {
        if (!Object.values(CacheCategory).find((c) => c === category)) {
            throw new Error("Unsupported cache category");
        }

        type S = C extends "conditionv1" ? ShapeConditionV1 : ShapeRoot;
        const entry = new Entry<S>(`${category}${chainId.toString()}`);
        // await entry.createTableIfNotExists(); // Ensure the table is created before returning the entry
        return entry;
    }
}

// SQLite database initialization
const db = new sqlite3.Database(".cache/conditionv1.db");

export class Entry<T extends Shape> {
    public readonly key: string;

    constructor(key: string) {
        this.key = key;
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
