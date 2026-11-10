export const LITERALS: string[];
export const IP100: RegExp;
export const HASHED: { len: number; sha256: string }[];
export function scanText(text: string, hashed?: { len: number; sha256: string }[]): string[];
