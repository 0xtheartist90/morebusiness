// A small reader for the first sheet of an .xlsx file (Google Sheets "Download → Microsoft Excel"), with no
// dependencies: unzip with zlib, then read the sheet XML. Returns the cell values as text, row by row (as a CSV would),
// plus each cell's link: from a HYPERLINK("url", "text") formula or from a hyperlink set on the cell.
import { inflateRawSync } from 'node:zlib';

export type SheetGrid = {
    /** Displayed values; numbers as plain numbers ("59000", "2.8333"), empty cells as "". */
    rows: string[][];
    /** The link behind a cell, by "row,col" (0-based). */
    links: Map<string, string>;
};

/** The files inside a zip archive, read from its central directory. */
function unzip(buf: Buffer): Map<string, Buffer> {
    const files = new Map<string, Buffer>();
    // End of central directory: signature 0x06054b50, searched from the end (a comment may follow it).
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) {
            eocd = i;
            break;
        }
    }
    if (eocd < 0) throw new Error('xlsx: not a zip file');
    const count = buf.readUInt16LE(eocd + 10);
    let p = buf.readUInt32LE(eocd + 16);
    for (let n = 0; n < count; n++) {
        if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('xlsx: broken central directory');
        const method = buf.readUInt16LE(p + 10);
        const size = buf.readUInt32LE(p + 20);
        const nameLen = buf.readUInt16LE(p + 28);
        const extraLen = buf.readUInt16LE(p + 30);
        const commentLen = buf.readUInt16LE(p + 32);
        const local = buf.readUInt32LE(p + 42);
        const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const raw = buf.subarray(start, start + size);
        files.set(name, method === 8 ? inflateRawSync(raw) : raw);
        p += 46 + nameLen + extraLen + commentLen;
    }

    return files;
}

const decode = (s: string) =>
    s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
        .replace(/&amp;/g, '&');

/** All text runs inside an element (a shared string may be split into rich-text runs). */
const textOf = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');

/** "T6" → [5, 19] (0-based row, col). */
function cellRef(ref: string): [number, number] {
    const m = ref.match(/^([A-Z]+)(\d+)$/);
    if (!m) throw new Error(`xlsx: bad cell reference ${ref}`);
    let col = 0;
    for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);

    return [Number(m[2]) - 1, col - 1];
}

/** Resolves a part path relative to the folder of the part that refers to it ("xl/" + "worksheets/sheet1.xml"). */
const resolve = (base: string, target: string) => (target.startsWith('/') ? target.slice(1) : base + target);

export function readFirstSheet(buf: Buffer): SheetGrid {
    const files = unzip(buf);
    const read = (name: string) => files.get(name)?.toString('utf8') ?? '';

    // The first sheet in the workbook, found through the workbook's relationships.
    const workbook = read('xl/workbook.xml');
    const firstId = workbook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
    const wbRels = read('xl/_rels/workbook.xml.rels');
    const target = [...wbRels.matchAll(/<Relationship\b[^>]*>/g)]
        .map((m) => m[0])
        .find((r) => r.includes(`Id="${firstId}"`))
        ?.match(/Target="([^"]+)"/)?.[1];
    const sheetPath = target ? resolve('xl/', target) : 'xl/worksheets/sheet1.xml';
    const sheet = read(sheetPath);
    if (!sheet) throw new Error('xlsx: first sheet not found');

    const shared = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));

    const rows: string[][] = [];
    const links = new Map<string, string>();

    for (const m of sheet.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = m[1];
        const body = m[2] ?? '';
        const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
        if (!ref) continue;
        const [r, c] = cellRef(ref);
        const type = attrs.match(/\bt="([^"]+)"/)?.[1];
        const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];

        let value = '';
        if (type === 's') value = v !== undefined ? (shared[Number(v)] ?? '') : '';
        else if (type === 'inlineStr') value = textOf(body);
        else if (type === 'e') value = '';
        else if (v !== undefined) value = decode(v);

        (rows[r] ??= [])[c] = value;

        // HYPERLINK("url", …) formulas keep their URL in the formula only.
        const formula = body.match(/<f\b[^>]*>([\s\S]*?)<\/f>/)?.[1];
        const url = formula && decode(formula).match(/^HYPERLINK\(\s*"([^"]+)"/i)?.[1];
        if (url) links.set(`${r},${c}`, url);
    }

    // Links set on a cell (Insert → Link), stored as relationships of the sheet.
    const sheetDir = sheetPath.slice(0, sheetPath.lastIndexOf('/') + 1);
    const sheetRels = read(`${sheetDir}_rels/${sheetPath.slice(sheetDir.length)}.rels`);
    const relTarget = new Map(
        [...sheetRels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
            m[0].match(/\bId="([^"]+)"/)?.[1] ?? '',
            decode(m[0].match(/\bTarget="([^"]+)"/)?.[1] ?? '')
        ])
    );
    for (const m of sheet.matchAll(/<hyperlink\b[^>]*>/g)) {
        const ref = m[0].match(/\bref="([A-Z]+\d+)/)?.[1];
        const id = m[0].match(/\br:id="([^"]+)"/)?.[1];
        const url = id && relTarget.get(id);
        if (!ref || !url) continue;
        const [r, c] = cellRef(ref);
        if (!links.has(`${r},${c}`)) links.set(`${r},${c}`, url);
    }

    // Dense rows: missing cells become "".
    for (let i = 0; i < rows.length; i++) rows[i] = Array.from(rows[i] ?? [], (x) => x ?? '');

    return { rows, links };
}
