// Server-side USD→GHS conversion. This is the *authoritative* rate used to
// decide how much to actually charge via Paystack — it deliberately does not
// trust any rate the browser might send, so a shopper can't tamper with the
// exchange rate the same way they used to be able to tamper with the order
// total (see routes/orders.js).
//
// Mirrors the frontend's CurrencyContext fallback rate so the two stay
// roughly in the same ballpark even if this fetch ever fails.
const FALLBACK_USD_TO_GHS = 15.5;

let cachedRate = null;
let cachedAt = 0;
const CACHE_MS = 60 * 60 * 1000; // 1 hour — exchange rates don't move fast enough to need more

export async function getUsdToGhsRate() {
  if (cachedRate && Date.now() - cachedAt < CACHE_MS) return cachedRate;

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    const rate = data?.rates?.GHS;
    if (typeof rate === 'number' && rate > 0) {
      cachedRate = rate;
      cachedAt = Date.now();
      return rate;
    }
  } catch (err) {
    console.error('⚠️  Could not fetch live USD→GHS rate, using fallback:', err.message);
  }

  // Fall back to the last good cached rate if we have one, else the static default
  return cachedRate || FALLBACK_USD_TO_GHS;
}