import { useEffect, useState } from 'react';
import { PRESETS, generate } from './rng';

function readUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    const num = (k: string, d: number) => {
      const v = p.get(k);
      return v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d;
    };
    return {
      min: num('min', 1),
      max: num('max', 100),
      count: num('count', 1),
      unique: p.get('u') === '1',
      sort: (['none', 'asc', 'desc'].includes(p.get('sort') || '') ? p.get('sort') : 'none') as
        | 'none'
        | 'asc'
        | 'desc',
    };
  } catch {
    return { min: 1, max: 100, count: 1, unique: false, sort: 'none' as const };
  }
}

export default function App() {
  const init = readUrl();
  const [min, setMin] = useState(String(init.min));
  const [max, setMax] = useState(String(init.max));
  const [count, setCount] = useState(String(init.count));
  const [unique, setUnique] = useState(init.unique);
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>(init.sort);
  const [result, setResult] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const opts = {
    min: Number(min),
    max: Number(max),
    count: Math.floor(Number(count)) || 1,
    unique,
    sort,
  };

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('min', min);
      u.searchParams.set('max', max);
      u.searchParams.set('count', count);
      u.searchParams.set('u', unique ? '1' : '0');
      u.searchParams.set('sort', sort);
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
  }, [min, max, count, unique, sort]);

  const roll = () => {
    const r = generate(opts);
    if (!r.ok) {
      setError(r.error || 'Could not generate.');
      setResult([]);
      return;
    }
    setError('');
    setResult(r.numbers);
    const text = r.numbers.join(opts.count > 20 ? ', ' : '  ');
    setHistory((h) => [text.length > 90 ? `${text.slice(0, 90)}…` : text, ...h].slice(0, 8));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setMin(String(p.min));
    setMax(String(p.max));
    setCount(String(p.count));
    setUnique(p.unique);
    setSort('none');
    setResult([]);
    setError('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.join(opts.count > 20 ? ', ' : '\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const single = result.length === 1;

  return (
    <div className="app">
      <header>
        <h1>Random Number Generator</h1>
        <p className="tag">
          Pick a range and how many numbers you want. Uses your browser's cryptographic random
          source, so the results are as unbiased as software gets — and nothing is sent anywhere.
        </p>
      </header>

      <div className="presets">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="controls">
        <label className="f">
          <span>From</span>
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/[^0-9-]/g, ''))} inputMode="numeric" />
        </label>
        <label className="f">
          <span>To</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9-]/g, ''))} inputMode="numeric" />
        </label>
        <label className="f">
          <span>How many</span>
          <input value={count} onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </label>
      </div>

      <div className="opts">
        <label className="cb">
          <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          <span>No repeats</span>
        </label>
        <label className="cb">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="none">as drawn</option>
            <option value="asc">low → high</option>
            <option value="desc">high → low</option>
          </select>
        </label>
      </div>

      <button className="go" onClick={roll}>
        {result.length ? 'Generate again' : 'Generate'}
      </button>

      {error && <p className="error">{error}</p>}

      {result.length > 0 && (
        <div className={`out${single ? ' one' : ''}`}>
          {single ? (
            <strong>{result[0].toLocaleString()}</strong>
          ) : (
            <div className="nums">
              {result.map((n, i) => (
                <span key={i}>{n.toLocaleString()}</span>
              ))}
            </div>
          )}
          <button className="copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {history.length > 1 && (
        <div className="history">
          <h2>Recent</h2>
          <ol>
            {history.slice(1).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}

      <section className="explainer">
        <h2>How the numbers are generated</h2>
        <p>
          Each number comes from <code>crypto.getRandomValues</code>, the browser's
          cryptographically secure random number generator. To turn a raw 32-bit value into a number
          in your range without bias, the generator throws away the small tail of values that would
          make some outcomes very slightly more likely than others and draws again — a technique
          called rejection sampling. In practice you will never notice the retries.
        </p>
        <h3>"No repeats"</h3>
        <p>
          With this on, every number in the result is different — useful for a raffle draw, picking
          lottery numbers, or assigning an order. If you ask for more unique numbers than the range
          contains, the generator tells you rather than looping forever. For draws that use most of
          the range it shuffles the whole set of possible numbers and takes what you need, which is
          faster and still unbiased.
        </p>
        <h3>Is this "true" random?</h3>
        <p>
          The browser's generator is seeded from hardware entropy the operating system collects, so
          for everyday purposes — games, draws, decisions, test data, sampling — it is
          indistinguishable from true randomness and far better than the older <code>Math.random</code>.
          It is not certified for regulated gambling or cryptographic key generation; those have their
          own requirements.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>
          No. Every number is generated on your device. Your range and options are stored in the page
          link so you can bookmark a specific setup, but the results themselves are never saved or
          transmitted.
        </p>
        <footer>Random Number Generator · crypto-secure · no sign-up · runs in your browser</footer>
      </section>
    </div>
  );
}
