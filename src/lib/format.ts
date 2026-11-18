import type { Kosten } from '@/lib/zaak-types';

const NL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const NL1 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 59000 → "฿ 59.000"; "onbekend" when missing. */
export const thb = (n: number | null) => (n === null ? 'onbekend' : `฿ ${NL.format(n)}`);

/** 59000 → "฿ 59k", for tight spots. */
export const thbKort = (n: number | null) => {
    if (n === null) return 'onbekend';
    if (n >= 1000) return `฿ ${NL.format(Math.round(n / 1000))}k`;

    return `฿ ${NL.format(n)}`;
};

export const getal = (n: number | null) => (n === null ? 'onbekend' : NL.format(n));

export const maanden = (n: number | null) => (n === null ? 'onbekend' : `${NL1.format(n)} mnd`);

export const kosten = (k: Kosten) => (k === 'in-overname' ? 'in overname' : thb(k));

/** The first Thai phone number in a field, as a tel: link (+66, leading 0 dropped); null if there is none. */
export function telHref(telefoon: string | null): string | null {
    const m = telefoon?.match(/0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}/);
    if (!m) return null;

    return `tel:+66${m[0].replace(/\D/g, '').slice(1)}`;
}
