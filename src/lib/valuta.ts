'use client';

// The currency the dashboard shows amounts in. The sheet is in THB; EUR and USD are converted with the day's rate.
// Components format money with useGeld() instead of a fixed THB formatter, so one switch changes every amount.
import { createContext, createElement, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { useT } from '@/lib/i18n';
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

/**
 * A money formatter for one currency in one language: 59000 THB → "฿ 59,000" (en), "฿ 59.000" (nl), "€ 1,583",
 * or "€ 1.07" for small amounts.
 */
export function maakGeld(valuta: Valuta, koersen: Koersen, locale = 'en-US', onbekend = 'unknown') {
    const factor = valuta === 'THB' ? 1 : koersen[valuta];
    const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const n2 = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (n: number | null): string => {
        if (n === null) return onbekend;
        const v = n * factor;
        // Small amounts in EUR/USD (spend per customer) keep their cents; everything else is whole.
        const tekst = valuta !== 'THB' && Math.abs(v) < 100 ? n2.format(v) : n0.format(Math.round(v));

        return `${SYMBOOL[valuta]} ${tekst}`;
    };
}

type GeldContext = {
    valuta: Valuta;
    geld: (n: number | null) => string;
    /** Like geld, for costs that may be "in overname". */
    kosten: (k: Kosten) => string;
};

const standaard = maakGeld('THB', { EUR: 0, USD: 0, datum: null, live: false });
const Ctx = createContext<GeldContext>({
    valuta: 'THB',
    geld: standaard,
    kosten: (k) => (k === 'in-overname' ? 'incl. in takeover price' : standaard(k))
});

/** Must sit inside TaalProvider: the number format and the word for "unknown" follow the language. */
export function GeldProvider({ valuta, koersen, children }: { valuta: Valuta; koersen: Koersen; children: ReactNode }) {
    const { locale, t } = useT();
    const waarde = useMemo<GeldContext>(() => {
        const geld = maakGeld(valuta, koersen, locale, t('onbekend'));

        return { valuta, geld, kosten: (k) => (k === 'in-overname' ? t('inOvername') : geld(k)) };
    }, [valuta, koersen, locale, t]);

    return createElement(Ctx.Provider, { value: waarde }, children);
}

export const useGeld = () => useContext(Ctx);
