// Exchange rates from THB, read on the server: ECB reference rates via frankfurter.dev (free, no key), refreshed
// twice a day. If the service can't be reached, recent fixed rates are used and the page says so.
import type { Koersen } from '@/lib/valuta';

/** Rates of 18 Nov 2026 (ECB), used only when the live rates can't be read. */
const RESERVE: Koersen = { EUR: 0.026836, USD: 0.029433, datum: '2026-11-18', live: false };

export async function loadKoersen(): Promise<Koersen> {
    try {
        const res = await fetch('https://api.frankfurter.dev/v1/latest?base=THB&symbols=EUR,USD', {
            next: { revalidate: 12 * 60 * 60 },
            signal: AbortSignal.timeout(8_000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { date?: string; rates?: { EUR?: number; USD?: number } };
        const { EUR, USD } = data.rates ?? {};
        if (!EUR || !USD) throw new Error('rates missing');

        return { EUR, USD, datum: data.date ?? null, live: true };
    } catch (err) {
        console.warn(`[koersen] live rates failed, using fixed rates: ${(err as Error).message}`);

        return RESERVE;
    }
}
