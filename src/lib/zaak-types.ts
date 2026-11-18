// The shape of one business for sale, as the dashboard uses it. Kept apart from the CSV reader (which uses fs), so
// client components can import these types and helpers.

/** A cost that the sheet may leave out ("onbekend") or say is already part of the takeover price ("in overname"). */
export type Kosten = number | 'in-overname' | null;

export type Bron = 'FB' | 'SengBiz' | 'Overig';

export type Zaak = {
    /** Stable key for favourites: type + name (the row number changes when the sheet is re-sorted). */
    id: string;
    nr: number;
    type: string;
    naam: string;
    locatie: string | null;
    /** Everything needed to start: the one-off costs plus the first month of running (wage, rent, utilities). */
    startkapitaal: number | null;
    /** The one-off costs only: takeover price + deposit + rent in advance (the sheet's "Start-kapitaal"). */
    eenmalig: number | null;
    omzetPerMaand: number | null;
    /** Marked "NIEUW" in the sheet's note. */
    nieuw: boolean;
    breakEvenOmzetDag: number | null;
    bestedingPerKlant: number | null;
    klantenNodig: number | null;
    /** What a "klant" is for this business: klanten, kopjes, auto's, wasbeurten. */
    eenheid: string;
    /** Days open a month for this type (from the assumptions table); turnover = customers × spend × days. */
    openDagen: number | null;
    /** Monthly wage of one employee, utilities and other costs for this type, and stock as % of turnover. */
    loon: number | null;
    /** What the stock is made of, as shares of turnover (from the sheet's "Inkoop breakdown"). */
    inkoopDelen: InkoopDeel[];
    nuts: number | null;
    overigKosten: number | null;
    inkoopPct: number | null;
    verwachtKlanten: number | null;
    winstPerMaand: number | null;
    terugverdientijd: number | null;
    overname: number | null;
    huur: number | null;
    borg: Kosten;
    huurVooruit: Kosten;
    vasteKosten: number | null;
    telefoon: string | null;
    /** The ad's URL; null when the sheet only has the link text (a CSV export drops the hyperlink). */
    link: string | null;
    opmerking: string | null;
    foto: string | null;
    bron: Bron;
};

/** One part of the stock bought, e.g. { label: 'bonen', pct: 12 } (% of turnover). */
export type InkoopDeel = { label: string; pct: number };

export type Aanname = {
    type: string;
    nuts: number | null;
    overig: number | null;
    inkoopPct: number | null;
    eenheid: string;
    openDagen: number | null;
    inkoopDelen: InkoopDeel[];
};

export type ZakenData = {
    zaken: Zaak[];
    aannames: Aanname[];
    loon: number | null;
    loonToelichting: string | null;
    bijgewerkt: string | null;
    bronTekst: string | null;
    /** Read live from Google Sheets (false: from the local backup file). */
    live: boolean;
    sheetUrl: string;
};

/** Payback in three bands, the same as the sheet's colour legend. */
export type Band = 'snel' | 'middel' | 'traag' | 'onbekend';

export function band(maanden: number | null): Band {
    if (maanden === null) return 'onbekend';
    if (maanden <= 6) return 'snel';
    if (maanden <= 12) return 'middel';

    return 'traag';
}

export const BAND_LABEL: Record<Band, string> = {
    snel: '≤ 6 mnd',
    middel: '6–12 mnd',
    traag: '> 12 mnd',
    onbekend: 'onbekend'
};

/** "kopjes" → "kopje", for "besteding / kopje". */
export function enkelvoud(eenheid: string): string {
    const map: Record<string, string> = {
        klanten: 'klant',
        kopjes: 'kopje',
        "auto's": 'auto',
        wasbeurten: 'wasbeurt'
    };

    return map[eenheid] ?? eenheid;
}
