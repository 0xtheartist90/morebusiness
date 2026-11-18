'use client';

// The currency the dashboard shows amounts in. The sheet is in THB; EUR and USD are converted with the day's rate.
// Components format money with useGeld() instead of a fixed THB formatter, so one switch changes every amount.
import { createContext, createElement, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Kosten } from '@/lib/zaak-types';

export type Valuta = 'THB' | 'EUR' | 'USD';

export type Koersen = {
    /** 1 THB in EUR / USD. */
    EUR: number;
    USD: number;
    datum: string | null;
    /** false when the fixed fallback rates are used. */
    live: boolean;
};

export const VALUTA: Valuta[] = ['THB', 'EUR', 'USD'];
const SYMBOOL: Record<Valuta, string> = { THB: '฿', EUR: '€', USD: '$' };

const NL0 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const NL2 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** A money formatter for one currency: 59000 THB → "฿ 59.000", "€ 1.583", or "€ 1,07" for small amounts. */
export function maakGeld(valuta: Valuta, koersen: Koersen) {
    const factor = valuta === 'THB' ? 1 : koersen[valuta];

    return (n: number | null): string => {
        if (n === null) return 'onbekend';
        const v = n * factor;
        // Small amounts in EUR/USD (spend per customer) keep their cents; everything else is whole.
        const tekst = valuta !== 'THB' && Math.abs(v) < 100 ? NL2.format(v) : NL0.format(Math.round(v));

        return `${SYMBOOL[valuta]} ${tekst}`;
    };
}

type GeldContext = {
    valuta: Valuta;
    geld: (n: number | null) => string;
    /** Like geld, for costs that may be "in overname". */
    kosten: (k: Kosten) => string;
};

const Ctx = createContext<GeldContext>({
    valuta: 'THB',
    geld: maakGeld('THB', { EUR: 0, USD: 0, datum: null, live: false }),
    kosten: (k) => (k === 'in-overname' ? 'in overname' : k === null ? 'onbekend' : `฿ ${NL0.format(k)}`)
});

export function GeldProvider({ valuta, koersen, children }: { valuta: Valuta; koersen: Koersen; children: ReactNode }) {
    const waarde = useMemo<GeldContext>(() => {
        const geld = maakGeld(valuta, koersen);

        return { valuta, geld, kosten: (k) => (k === 'in-overname' ? 'in overname' : geld(k)) };
    }, [valuta, koersen]);

    return createElement(Ctx.Provider, { value: waarde }, children);
}

export const useGeld = () => useContext(Ctx);
