# random-number-generator

Pick a range and a count, optionally with no-repeats and sorting, and get random
numbers from `crypto.getRandomValues`. 8 presets (dice, D20, coin, lotto,
Powerball, PIN, raffle). Recent-results list. Range + options in the URL.

**Live:** https://random-number-generator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/rng.ts`](src/rng.ts): `secureInt(min, max)` — unbiased integer via
rejection sampling on `crypto.getRandomValues` (discards the tail that would skew
the modulo). `generate(opts)` handles count, no-repeats (Set for sparse draws,
full-range shuffle when count > range/2), the "not enough unique values" case, and
sorting.

Verified in Node: 60k rolls of 1–6 land within ~2% of uniform; lotto 6/45 unique
& sorted; impossible unique request → error; full-range unique returns the whole
set; swapped range handled.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
