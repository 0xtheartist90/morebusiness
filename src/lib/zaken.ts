// Reads the sheet ("Overzicht" tab) into typed rows. First choice: live from Google Sheets, downloaded as .xlsx (an
// xlsx keeps the ad links, which are HYPERLINK formulas; a CSV export drops them). The sheet must be shared as
// "anyone with the link can view". If it can't be reached, a local data/zaken.xlsx (or .csv) is used instead.
// Columns are found by their header, so moved columns still work.
import { readFirstSheet } from '@/lib/xlsx';
import type { Aanname, Bron, InkoopDeel, Kosten, Zaak, ZakenData } from '@/lib/zaak-types';

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

/** The Google Sheet's id (from its URL); override with SHEET_ID. */
const SHEET_ID = process.env.SHEET_ID || '1vlvLUjGLyEdGp5vdUZQapy-_hSeP3qqoCAuacQypP8k';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
/** How often the sheet is fetched again, in seconds (the page uses the same interval). */
export const VERVERS_SECONDEN = 300;
/** Cache tag of the sheet fetch, so the refresh button can drop it. */
export const SHEET_TAG = 'sheet';

const XLSX_PATH = path.join(process.cwd(), 'data', 'zaken.xlsx');
const CSV_PATH = path.join(process.cwd(), 'data', 'zaken.csv');

type Grid = { rows: string[][]; links: Map<string, string>; live: boolean };

async function readLive(): Promise<Grid> {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`, {
        next: { revalidate: VERVERS_SECONDEN, tags: [SHEET_TAG] },
        signal: AbortSignal.timeout(10_000)
    });
    // A sheet that isn't shared answers with a sign-in page (HTML), not a spreadsheet.
    if (!res.ok || !res.headers.get('content-type')?.includes('spreadsheetml'))
        throw new Error(`Google Sheet not readable (${res.status})`);

    return { ...readFirstSheet(Buffer.from(await res.arrayBuffer())), live: true };
}

async function readLocal(): Promise<Grid> {
    try {
        await access(XLSX_PATH);
    } catch {
        return { rows: parseCsv(await readFile(CSV_PATH, 'utf8')), links: new Map(), live: false };
    }

    return { ...readFirstSheet(await readFile(XLSX_PATH)), live: false };
}

async function readGrid(): Promise<Grid> {
    try {
        return await readLive();
    } catch (err) {
        console.warn(`[zaken] live sheet failed, using the local file: ${(err as Error).message}`);

        return readLocal();
    }
}

/** RFC 4180-style CSV: quoted fields, doubled quotes inside them, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (ch === '"') quoted = false;
            else field += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else field += ch;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

const clean = (v: string | undefined) => (v ?? '').trim();
const isUnknown = (v: string) => !v || v.toLowerCase() === 'onbekend';

/** "59,000" → 59000, "2.8" → 2.8, "3 klanten" → 3; null for "onbekend" or anything without a number. */
function num(v: string | undefined): number | null {
    const s = clean(v);
    if (isUnknown(s)) return null;
    const m = s.match(/-?[\d,]+(\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0].replace(/,/g, ''));

    return Number.isFinite(n) ? n : null;
}

function kosten(v: string | undefined): Kosten {
    const s = clean(v).toLowerCase();
    if (s === 'in overname') return 'in-overname';

    return num(v);
}

function text(v: string | undefined): string | null {
    const s = clean(v);

    return isUnknown(s) ? null : s;
}

function url(v: string | undefined): string | null {
    const s = clean(v);

    return /^https?:\/\//i.test(s) ? s : null;
}

/**
 * A Google Drive share link ("drive.google.com/file/d/<id>/view" or "…open?id=<id>") points at a page, not an image;
 * this turns it into the image itself. Only works for files shared as "anyone with the link".
 */
function fotoUrl(u: string | null): string | null {
    if (!u || !/drive\.google\.com/i.test(u)) return u;
    const id = u.match(/\/file\/d\/([\w-]+)/)?.[1] ?? u.match(/[?&]id=([\w-]+)/)?.[1];

    return id ? `https://lh3.googleusercontent.com/d/${id}=w1200` : u;
}

/** "bonen ~12%, melk ~10%, bekers/deksels ~5%" → [{ label: 'bonen', pct: 12 }, …]; parts without a % are skipped. */
function inkoopDelen(v: string | undefined): InkoopDeel[] {
    return clean(v)
        .split(/[,;]/)
        .map((deel) => deel.trim().match(/^(.*?)\s*~?\s*(\d+(?:[.,]\d+)?)\s*%/))
        .filter((m): m is RegExpMatchArray => !!m && !!m[1])
        .map((m) => ({ label: m[1].trim(), pct: Number(m[2].replace(',', '.')) }));
}

function bron(opmerking: string | null): Bron {
    if (!opmerking) return 'Overig';
    if (/^FB\b/i.test(opmerking)) return 'FB';
    if (/^SengBiz/i.test(opmerking)) return 'SengBiz';

    return 'Overig';
}

const slug = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export async function loadZaken(): Promise<ZakenData> {
    const { rows, links, live } = await readGrid();

    // The header row is the one that starts with "#"; the columns are found by their (start of) name.
    const headerAt = rows.findIndex((r) => clean(r[0]) === '#');
    if (headerAt < 0) throw new Error('data/zaken.csv: no header row starting with "#" found');
    const header = rows[headerAt].map((h) => clean(h).toLowerCase());
    const col = (start: string) => {
        const i = header.findIndex((h) => h.startsWith(start.toLowerCase()));
        if (i < 0) throw new Error(`data/zaken.csv: column "${start}" not found`);

        return i;
    };
    const C = {
        nr: col('#'),
        type: col('type'),
        naam: col('zaak'),
        locatie: col('locatie'),
        start: col('start-kapitaal'),
        // Newer exports: start + first month of running, and the expected monthly turnover.
        eersteMaand: header.findIndex((h) => h.startsWith('kosten 1e maand')),
        omzet: header.findIndex((h) => h.startsWith('verwachte omzet')),
        breakEven: col('break-even'),
        besteding: col('besteding'),
        nodig: col('klanten / dag nodig'),
        verwacht: col('verwacht klanten'),
        winst: col('winst'),
        terug: col('terug-verdientijd'),
        overname: col('overname'),
        huur: col('huur / mnd'),
        borg: col('borg'),
        vooruit: col('huur vooruit'),
        vast: col('vaste kosten'),
        tel: col('telefoon'),
        link: col('link'),
        opm: col('opmerking'),
        foto: col('foto')
    };

    // Assumptions (used for a business's unit when its own row has none).
    const aannames: Aanname[] = [];
    let loon: number | null = null;
    let loonToelichting: string | null = null;
    const loonRow = rows.find((r) => clean(r[1]).toLowerCase().startsWith('loon werknemer'));
    if (loonRow) {
        loon = num(loonRow[2]);
        loonToelichting = text(loonRow[3]);
    }
    const aannameHead = rows.findIndex((r) => clean(r[1]).toLowerCase() === 'type zaak');
    if (aannameHead >= 0) {
        for (const r of rows.slice(aannameHead + 1)) {
            const type = clean(r[1]);
            if (!type) break;
            aannames.push({
                type,
                nuts: num(r[2]),
                overig: num(r[3]),
                // "35%" in a CSV, 0.35 in an xlsx.
                inkoopPct: ((n) => (n !== null && n <= 1 ? Math.round(n * 1000) / 10 : n))(num(r[4])),
                eenheid: clean(r[5]) || 'klanten',
                openDagen: num(r[6]),
                inkoopDelen: inkoopDelen(r[7])
            });
        }
    }
    const unitFor = (type: string) => aannames.find((a) => a.type === type)?.eenheid ?? 'klanten';

    const zaken: Zaak[] = [];
    for (let i = headerAt + 1; i < rows.length; i++) {
        const r = rows[i] ?? [];
        const first = clean(r[0]);
        // A cell's URL: written out in the cell, or behind it as a link (xlsx only).
        const urlAt = (c: number) => url(r[c]) ?? url(links.get(`${i},${c}`));
        // Section rows ("BINNEN BUDGET …") are skipped; the list ends at the first empty row.
        if (!/^\d+(\.0+)?$/.test(first)) {
            // The business list ends at the first empty row.
            if (!r.some((c) => clean(c))) break;
            continue;
        }

        const type = clean(r[C.type]) || 'Overig/onbekend';
        const naam = clean(r[C.naam]);
        const nodigRaw = isUnknown(clean(r[C.nodig])) ? '' : clean(r[C.nodig]);
        const opmRaw = text(r[C.opm]);
        const nieuw = !!opmRaw && /^nieuw\b/i.test(opmRaw);
        const opmerking = nieuw ? opmRaw!.replace(/^nieuw\s*·?\s*/i, '') || null : opmRaw;
        const eenmalig = num(r[C.start]);
        zaken.push({
            id: slug(`${type}-${naam}`),
            nr: Number(first),
            type,
            naam,
            locatie: text(r[C.locatie]),
            // Without the first-month column (older exports) the one-off costs are the best there is.
            startkapitaal: C.eersteMaand >= 0 ? num(r[C.eersteMaand]) : eenmalig,
            eenmalig,
            omzetPerMaand: C.omzet >= 0 ? num(r[C.omzet]) : null,
            nieuw,
            breakEvenOmzetDag: num(r[C.breakEven]),
            bestedingPerKlant: num(r[C.besteding]),
            klantenNodig: num(nodigRaw),
            eenheid: nodigRaw.replace(/^[\d,.\s]+/, '').trim() || unitFor(type),
            openDagen: aannames.find((a) => a.type === type)?.openDagen ?? null,
            // The fixed monthly costs as the sheet adds them up: rent + wage + utilities + other (per type).
            loon,
            nuts: aannames.find((a) => a.type === type)?.nuts ?? null,
            overigKosten: aannames.find((a) => a.type === type)?.overig ?? null,
            inkoopPct: aannames.find((a) => a.type === type)?.inkoopPct ?? null,
            inkoopDelen: aannames.find((a) => a.type === type)?.inkoopDelen ?? [],
            verwachtKlanten: num(r[C.verwacht]),
            winstPerMaand: num(r[C.winst]),
            terugverdientijd: num(r[C.terug]),
            overname: num(r[C.overname]),
            huur: num(r[C.huur]),
            borg: kosten(r[C.borg]),
            huurVooruit: kosten(r[C.vooruit]),
            vasteKosten: num(r[C.vast]),
            telefoon: text(r[C.tel]),
            link: urlAt(C.link),
            opmerking,
            foto: fotoUrl(urlAt(C.foto)),
            bron: bron(opmerking)
        });
    }

    const bijgewerkt = rows
        .slice(0, headerAt)
        .map((r) => clean(r[0]))
        .find((s) => /^bijgewerkt/i.test(s));
    const bronRow = rows.find((r) => clean(r[2]).toLowerCase() === 'bron:');

    return {
        zaken,
        aannames,
        loon,
        loonToelichting,
        bijgewerkt: bijgewerkt
            ? bijgewerkt
                  .replace(/^bijgewerkt\s*/i, '')
                  .split('·')[0]
                  .trim()
            : null,
        bronTekst: bronRow ? text(bronRow[3]) : null,
        live,
        sheetUrl: SHEET_URL
    };
}
