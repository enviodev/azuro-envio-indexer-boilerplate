/**
 * TypedMap entry.
 */
export class TypedMapEntry<K, V> {
    key: K;
    value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

/** Typed map */
export class TypedMap<K, V> {
    entries: Array<TypedMapEntry<K, V>>;

    constructor() {
        this.entries = new Array<TypedMapEntry<K, V>>(0);
        // this.entries = []
    }

    set(key: K, value: V): void {
        let entry = this.getEntry(key);
        if (entry !== null) {
            entry.value = value;
        } else {
            let entry = new TypedMapEntry<K, V>(key, value);
            this.entries.push(entry);
        }
    }

    getEntry(key: K): TypedMapEntry<K, V> | null {
        for (let i: number = 0; i < this.entries.length; i++) {
            if (this.entries[i].key == key) {
                return this.entries[i];
            }
        }
        return null;
    }

    mustGetEntry(key: K): TypedMapEntry<K, V> {
        const entry = this.getEntry(key);
        if (entry === null) {
            throw new Error(`Entry for key ${key} does not exist in TypedMap`);
        }
        return entry!;
    }

    get(key: K): V | null {
        for (let i: number = 0; i < this.entries.length; i++) {
            if (this.entries[i].key == key) {
                return this.entries[i].value;
            }
        }
        return null;
    }

    mustGet(key: K): V {
        const value = this.get(key);
        if (value === null) {
            throw new Error(`Entry for key ${key} does not exist in TypedMap`);
        }
        return value!;
    }

    isSet(key: K): boolean {
        for (let i: number = 0; i < this.entries.length; i++) {
            if (this.entries[i].key == key) {
                return true;
            }
        }
        return false;
    }
}


export enum JSONValueKind {
    NULL = 0,
    BOOL = 1,
    NUMBER = 2,
    STRING = 3,
    ARRAY = 4,
    OBJECT = 5,
}

export class JSONValue {
    kind: JSONValueKind;
    data: string;

    constructor(kind: JSONValueKind, data: any) {
        this.kind = kind;
        // Directly use JSON.stringify to convert any data into a string representation.
        this.data = JSON.stringify(data);
    }

    isNull(): boolean {
        return this.kind === JSONValueKind.NULL;
    }

    toBool(): boolean {
        this.ensureKind(JSONValueKind.BOOL);
        return JSON.parse(this.data);
    }

    toNumber(): number {
        this.ensureKind(JSONValueKind.NUMBER);
        return JSON.parse(this.data);
    }

    toBigInt(): bigint {
        this.ensureKind(JSONValueKind.NUMBER);
        return BigInt(JSON.parse(this.data));
    }

    toString(): string {
        this.ensureKind(JSONValueKind.STRING);
        return JSON.parse(this.data);
    }

    toArray(): any[] {
        this.ensureKind(JSONValueKind.ARRAY);
        return JSON.parse(this.data);
    }

    toObject(): object {
        this.ensureKind(JSONValueKind.OBJECT);
        return JSON.parse(this.data);
    }

    private ensureKind(expectedKind: JSONValueKind): void {
        if (this.kind !== expectedKind) {
            throw new Error(`JSON value is not of expected type: ${expectedKind}`);
        }
    }
}
