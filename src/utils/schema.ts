// Overload signatures
export function getEntityId(arg1: string, arg2: string): string;
export function getEntityId(arg1: string, arg2: string, arg3: string): string;

// Implementation
export function getEntityId(arg1: string, arg2: string, arg3?: string): string {
  if (arg3 !== undefined) {
    return `${arg1}_${arg2}_${arg3}`;
  } else {
    return `${arg1}_${arg2}`;
  }
}

export function isPlainObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !(obj instanceof Date);
}