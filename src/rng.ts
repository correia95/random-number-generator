// Random number generation using the crypto API for unbiased results.

// Unbiased integer in [min, max] inclusive, via rejection sampling on crypto.
export function secureInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max < min) [min, max] = [max, min];
  const range = max - min + 1;
  if (range <= 0) return min;
  if (range === 1) return min;

  const maxUint = 0xffffffff;
  const limit = maxUint - ((maxUint + 1) % range); // largest multiple of range - 1
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x > limit);
  return min + (x % range);
}

export interface GenOptions {
  min: number;
  max: number;
  count: number;
  unique: boolean;
  sort: 'none' | 'asc' | 'desc';
}

export interface GenResult {
  ok: boolean;
  error?: string;
  numbers: number[];
}

export function generate(o: GenOptions): GenResult {
  const min = Math.ceil(o.min);
  const max = Math.floor(o.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ok: false, error: 'Enter a valid range.', numbers: [] };
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const range = hi - lo + 1;
  const count = Math.max(1, Math.min(10000, Math.floor(o.count) || 1));

  if (o.unique && count > range) {
    return { ok: false, error: `Only ${range.toLocaleString()} unique numbers exist in that range.`, numbers: [] };
  }

  let nums: number[] = [];
  if (o.unique) {
    if (count > range / 2) {
      // shuffle the whole range, take count
      const pool = Array.from({ length: range }, (_, i) => lo + i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = secureInt(0, i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      nums = pool.slice(0, count);
    } else {
      const seen = new Set<number>();
      while (seen.size < count) seen.add(secureInt(lo, hi));
      nums = [...seen];
    }
  } else {
    nums = Array.from({ length: count }, () => secureInt(lo, hi));
  }

  if (o.sort === 'asc') nums = nums.slice().sort((a, b) => a - b);
  else if (o.sort === 'desc') nums = nums.slice().sort((a, b) => b - a);

  return { ok: true, numbers: nums };
}

export const PRESETS: { label: string; min: number; max: number; count: number; unique: boolean }[] = [
  { label: 'Dice (1–6)', min: 1, max: 6, count: 1, unique: false },
  { label: 'D20', min: 1, max: 20, count: 1, unique: false },
  { label: 'Coin (0/1)', min: 0, max: 1, count: 1, unique: false },
  { label: 'Percent (1–100)', min: 1, max: 100, count: 1, unique: false },
  { label: 'Lotto (6 of 45)', min: 1, max: 45, count: 6, unique: true },
  { label: 'Powerball (7 of 35)', min: 1, max: 35, count: 7, unique: true },
  { label: 'PIN (4 digits)', min: 0, max: 9, count: 4, unique: false },
  { label: 'Raffle 1–500', min: 1, max: 500, count: 1, unique: false },
];
