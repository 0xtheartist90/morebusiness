'use client';

// The dashboard's languages: English (default), Thai and Dutch. UI text comes from the dictionaries below; the data
// from the sheet is Dutch, so known business types, units and stock parts are translated too, and anything unknown
// (names, locations, notes) is shown as it is in the sheet.
import { createContext, createElement, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

export type Taal = 'en' | 'th' | 'nl';

export const TALEN: { code: Taal; naam: string }[] = [
    { code: 'en', naam: 'English' },
    { code: 'th', naam: 'ไทย' },
    { code: 'nl', naam: 'Nederlands' }
];

export const LOCALE: Record<Taal, string> = { en: 'en-US', th: 'th-TH', nl: 'nl-NL' };

const en = {
    appNaam: 'takeovers',
    appSub: 'chiang mai',
    alleZaken: 'All businesses',
    favorieten: 'Favourites',
    alleTypes: 'All types',
    live: 'Live from Google Sheet',
    lokaal: 'Local copy (sheet unreachable)',
    bijgewerkt: 'Updated {datum} · amounts in {valuta}',
    openSheet: 'Open the sheet',
    sorterenOp: 'Sort by',
    sortTerug: 'Payback time',
    sortStart: 'Start investment',
    sortWinst: 'Profit / month',
    sortKlanten: 'Customers needed / day',
    sortNr: 'Sheet order',
    laagHoog: 'Low → high',
    hoogLaag: 'High → low',
    geenFavs: 'No favourites yet. Tap the heart on a card to save a business.',
    geenZaken: 'No businesses found.',
    toonAlle: 'Show all businesses',
    valuta: 'Currency',
    taal: 'Language',
    vasteKoers: 'fixed rate, live rate unavailable',
    vernieuwen: 'Refresh',
    bezig: 'Loading…',
    vernieuwTitel: 'Get the latest data from the Google Sheet',
    aannamesTitel: 'assumptions behind the numbers',
    aannamesTekst:
        'Each business is calculated with these costs per type and a wage of {loon} per month for 1 full-time employee. Unknown counts as 0.',
    kolType: 'Business type',
    kolNuts: 'Utilities / mo',
    kolOverig: 'Other / mo',
    kolInkoop: 'Stock',
    kolDagen: 'Open days',
    bron: 'Source',
    onbekend: 'unknown',
    inOvername: 'incl. in takeover price',
    locatieOnbekend: 'location unknown',
    nieuw: 'New',
    alleDetails: 'all details',
    favAan: 'Save as favourite',
    favUit: 'Remove from favourites',
    kaartStart: 'Start',
    kaartWinst: 'Profit / mo',
    kaartTerug: 'Payback',
    startinvestering: 'Start investment',
    terugverdiendIn: 'Paid back in',
    terugIn: 'paid back in {x}',
    perMaand: 'Per month',
    bij: 'at',
    omzet: 'Revenue',
    lasten: 'Costs',
    winst: 'Profit',
    bekijkAdvertentie: 'View listing',
    geenAdvertentie: 'No listing',
    bel: 'Call',
    zaakVan: 'Business {i} of {n}',
    vorige: 'Previous',
    volgende: 'Next',
    sluiten: 'Close',
    totaalNodig: 'Total needed',
    overname: 'Takeover price',
    borg: 'Deposit',
    huurVooruit: 'Rent in advance',
    eenmalig: 'One-off',
    buffer: 'Buffer',
    bufferHint: 'month 1 + week of stock',
    elkeMaand: 'Every month',
    formule: 'revenue − costs = profit',
    nogGeenOmzet: 'Revenue and profit not calculated yet.',
    omzetUitleg: '× {besteding} × {dagen} open days',
    inkoop: 'Stock',
    huur: 'Rent',
    loon: 'Wage · 1 staff',
    nuts: 'Utilities',
    overig: 'Other',
    huurLoonNuts: 'Rent, wage, utilities',
    marge: 'margin {x}%',
    klantenPerDag: 'Customers per day',
    nogNiet: 'Not calculated yet.',
    quitte: 'break-even',
    verwacht: 'expected',
    perEenheid: 'Per {e}',
    omzetQuitte: 'Break-even revenue',
    bovenQuitte: 'Above break-even',
    perDag: '{e}/day',
    maandKort: 'mo',
    beschrijving: 'Start investment, monthly figures and customers per day of {naam}.',
    titel: 'Business takeovers Chiang Mai'
};

type Teksten = typeof en;

const th: Teksten = {
    appNaam: 'เซ้งกิจการ',
    appSub: 'เชียงใหม่',
    alleZaken: 'กิจการทั้งหมด',
    favorieten: 'รายการโปรด',
    alleTypes: 'ทุกประเภท',
    live: 'ข้อมูลสดจาก Google Sheet',
    lokaal: 'สำเนาในเครื่อง (เข้าถึงชีตไม่ได้)',
    bijgewerkt: 'อัปเดต {datum} · จำนวนเงินเป็น {valuta}',
    openSheet: 'เปิดชีต',
    sorterenOp: 'เรียงตาม',
    sortTerug: 'ระยะเวลาคืนทุน',
    sortStart: 'เงินลงทุนเริ่มต้น',
    sortWinst: 'กำไร / เดือน',
    sortKlanten: 'ลูกค้าที่ต้องการ / วัน',
    sortNr: 'ลำดับในชีต',
    laagHoog: 'น้อย → มาก',
    hoogLaag: 'มาก → น้อย',
    geenFavs: 'ยังไม่มีรายการโปรด แตะรูปหัวใจบนการ์ดเพื่อบันทึกกิจการ',
    geenZaken: 'ไม่พบกิจการ',
    toonAlle: 'แสดงกิจการทั้งหมด',
    valuta: 'สกุลเงิน',
    taal: 'ภาษา',
    vasteKoers: 'อัตราคงที่ ดึงอัตราล่าสุดไม่ได้',
    vernieuwen: 'รีเฟรช',
    bezig: 'กำลังโหลด…',
    vernieuwTitel: 'ดึงข้อมูลล่าสุดจาก Google Sheet',
    aannamesTitel: 'สมมติฐานเบื้องหลังตัวเลข',
    aannamesTekst:
        'แต่ละกิจการคำนวณด้วยค่าใช้จ่ายตามประเภทเหล่านี้ และค่าแรง {loon} ต่อเดือนสำหรับพนักงานประจำ 1 คน ค่าที่ไม่ทราบนับเป็น 0',
    kolType: 'ประเภทกิจการ',
    kolNuts: 'ค่าน้ำไฟ / เดือน',
    kolOverig: 'อื่นๆ / เดือน',
    kolInkoop: 'ต้นทุนสินค้า',
    kolDagen: 'วันเปิดร้าน',
    bron: 'แหล่งที่มา',
    onbekend: 'ไม่ทราบ',
    inOvername: 'รวมในค่าเซ้ง',
    locatieOnbekend: 'ไม่ทราบที่ตั้ง',
    nieuw: 'ใหม่',
    alleDetails: 'รายละเอียดทั้งหมด',
    favAan: 'บันทึกเป็นรายการโปรด',
    favUit: 'นำออกจากรายการโปรด',
    kaartStart: 'เงินลงทุน',
    kaartWinst: 'กำไร / เดือน',
    kaartTerug: 'คืนทุน',
    startinvestering: 'เงินลงทุนเริ่มต้น',
    terugverdiendIn: 'คืนทุนใน',
    terugIn: 'คืนทุนใน {x}',
    perMaand: 'ต่อเดือน',
    bij: 'ที่',
    omzet: 'รายได้',
    lasten: 'ค่าใช้จ่าย',
    winst: 'กำไร',
    bekijkAdvertentie: 'ดูประกาศ',
    geenAdvertentie: 'ไม่มีประกาศ',
    bel: 'โทร',
    zaakVan: 'กิจการ {i} จาก {n}',
    vorige: 'ก่อนหน้า',
    volgende: 'ถัดไป',
    sluiten: 'ปิด',
    totaalNodig: 'รวมที่ต้องใช้',
    overname: 'ค่าเซ้ง',
    borg: 'เงินประกัน',
    huurVooruit: 'ค่าเช่าล่วงหน้า',
    eenmalig: 'จ่ายครั้งเดียว',
    buffer: 'เงินสำรอง',
    bufferHint: 'เดือนแรก + สต็อก 1 สัปดาห์',
    elkeMaand: 'ทุกเดือน',
    formule: 'รายได้ − ค่าใช้จ่าย = กำไร',
    nogGeenOmzet: 'ยังไม่ได้คำนวณรายได้และกำไร',
    omzetUitleg: '× {besteding} × เปิด {dagen} วัน',
    inkoop: 'ต้นทุนสินค้า',
    huur: 'ค่าเช่า',
    loon: 'ค่าแรง · 1 คน',
    nuts: 'ค่าน้ำค่าไฟ',
    overig: 'อื่นๆ',
    huurLoonNuts: 'ค่าเช่า ค่าแรง ค่าน้ำไฟ',
    marge: 'อัตรากำไร {x}%',
    klantenPerDag: 'ลูกค้าต่อวัน',
    nogNiet: 'ยังไม่ได้คำนวณ',
    quitte: 'จุดคุ้มทุน',
    verwacht: 'คาดการณ์',
    perEenheid: 'ต่อ{e}',
    omzetQuitte: 'รายได้จุดคุ้มทุน',
    bovenQuitte: 'เหนือจุดคุ้มทุน',
    perDag: '{e}/วัน',
    maandKort: 'เดือน',
    beschrijving: 'เงินลงทุนเริ่มต้น ตัวเลขรายเดือน และลูกค้าต่อวันของ {naam}',
    titel: 'เซ้งกิจการ เชียงใหม่'
};

const nl: Teksten = {
    appNaam: 'overname',
    appSub: 'chiang mai',
    alleZaken: 'Alle zaken',
    favorieten: 'Favorieten',
    alleTypes: 'Alle types',
    live: 'Live uit Google Sheet',
    lokaal: 'Lokale kopie (sheet niet bereikbaar)',
    bijgewerkt: 'Bijgewerkt {datum} · bedragen in {valuta}',
    openSheet: 'Open de sheet',
    sorterenOp: 'Sorteren op',
    sortTerug: 'Terugverdientijd',
    sortStart: 'Startinvestering',
    sortWinst: 'Winst / mnd',
    sortKlanten: 'Klanten / dag nodig',
    sortNr: 'Volgorde sheet',
    laagHoog: 'Laag → hoog',
    hoogLaag: 'Hoog → laag',
    geenFavs: 'Nog geen favorieten. Tik op het hartje op een kaart om een zaak te bewaren.',
    geenZaken: 'Geen zaken gevonden.',
    toonAlle: 'Toon alle zaken',
    valuta: 'Valuta',
    taal: 'Taal',
    vasteKoers: 'vaste koers, live koers niet bereikbaar',
    vernieuwen: 'Vernieuwen',
    bezig: 'Bezig…',
    vernieuwTitel: 'Haal de nieuwste gegevens uit de Google Sheet',
    aannamesTitel: 'aannames achter de cijfers',
    aannamesTekst:
        'Per zaak gerekend met deze kosten per type en {loon} loon per maand voor 1 fulltime werknemer. Onbekend telt als 0.',
    kolType: 'Type zaak',
    kolNuts: 'Nuts / mnd',
    kolOverig: 'Overig / mnd',
    kolInkoop: 'Inkoop',
    kolDagen: 'Open dagen',
    bron: 'Bron',
    onbekend: 'onbekend',
    inOvername: 'in overname',
    locatieOnbekend: 'locatie onbekend',
    nieuw: 'Nieuw',
    alleDetails: 'alle details',
    favAan: 'Markeer als favoriet',
    favUit: 'Uit favorieten',
    kaartStart: 'Start',
    kaartWinst: 'Winst / mnd',
    kaartTerug: 'Terug in',
    startinvestering: 'Startinvestering',
    terugverdiendIn: 'Terugverdiend in',
    terugIn: 'terug in {x}',
    perMaand: 'Per maand',
    bij: 'bij',
    omzet: 'Omzet',
    lasten: 'Lasten',
    winst: 'Winst',
    bekijkAdvertentie: 'Bekijk advertentie',
    geenAdvertentie: 'Geen advertentie',
    bel: 'Bel',
    zaakVan: 'Zaak {i} van {n}',
    vorige: 'Vorige',
    volgende: 'Volgende',
    sluiten: 'Sluiten',
    totaalNodig: 'Totaal nodig',
    overname: 'Overname',
    borg: 'Borg',
    huurVooruit: 'Huur vooruit',
    eenmalig: 'Eenmalig',
    buffer: 'Buffer',
    bufferHint: 'maand 1 + week inkoop',
    elkeMaand: 'Elke maand',
    formule: 'omzet − lasten = winst',
    nogGeenOmzet: 'Omzet en winst nog niet berekend.',
    omzetUitleg: '× {besteding} × {dagen} open dagen',
    inkoop: 'Inkoop',
    huur: 'Huur',
    loon: 'Loon · 1 pers.',
    nuts: 'Nuts (water, stroom)',
    overig: 'Overig',
    huurLoonNuts: 'Huur, loon, nuts',
    marge: 'marge {x}%',
    klantenPerDag: 'Klanten per dag',
    nogNiet: 'Nog niet berekend.',
    quitte: 'quitte',
    verwacht: 'verwacht',
    perEenheid: 'Per {e}',
    omzetQuitte: 'Omzet quitte',
    bovenQuitte: 'Boven quitte',
    perDag: '{e}/dag',
    maandKort: 'mnd',
    beschrijving: 'Startinvestering, maandcijfers en klanten per dag van {naam}.',
    titel: 'Overname zaken Chiang Mai'
};

const TEKSTEN: Record<Taal, Teksten> = { en, th, nl };
export type Sleutel = keyof Teksten;

/** The sheet's Dutch words that have a fixed meaning, in English and Thai (Dutch shows the sheet's own word). */
const WOORDEN: Record<string, { en: string; th: string }> = {
    // Business types
    koffie: { en: 'Coffee', th: 'กาแฟ' },
    kapper: { en: 'Barber', th: 'ร้านตัดผม' },
    schoonheid: { en: 'Beauty', th: 'ความงาม' },
    'drank & bakery': { en: 'Drinks & bakery', th: 'เครื่องดื่มและเบเกอรี่' },
    'smoothie/sap': { en: 'Smoothie/juice', th: 'สมูทตี้/น้ำผลไม้' },
    'drank markt (3 d/wk)': { en: 'Drinks market (3 d/wk)', th: 'เครื่องดื่มตลาดนัด (3 วัน/สัปดาห์)' },
    'winkel/kruidenier': { en: 'Shop/grocery', th: 'ร้านค้า/ของชำ' },
    carwash: { en: 'Car wash', th: 'คาร์แคร์' },
    wasserette: { en: 'Laundromat', th: 'ร้านซักผ้า' },
    'overig/onbekend': { en: 'Other/unknown', th: 'อื่นๆ/ไม่ทราบ' },
    // Units (plural, then singular)
    klanten: { en: 'customers', th: 'ลูกค้า' },
    klant: { en: 'customer', th: 'ลูกค้า' },
    kopjes: { en: 'cups', th: 'แก้ว' },
    kopje: { en: 'cup', th: 'แก้ว' },
    "auto's": { en: 'cars', th: 'คัน' },
    auto: { en: 'car', th: 'คัน' },
    wasbeurten: { en: 'washes', th: 'ครั้ง' },
    wasbeurt: { en: 'wash', th: 'ครั้ง' },
    // Stock parts
    bonen: { en: 'beans', th: 'เมล็ดกาแฟ' },
    melk: { en: 'milk', th: 'นม' },
    'bekers/deksels': { en: 'cups/lids', th: 'แก้ว/ฝา' },
    'siroop/suiker': { en: 'syrup/sugar', th: 'ไซรัป/น้ำตาล' },
    'shampoo/styling': { en: 'shampoo/styling', th: 'แชมพู/จัดแต่งทรง' },
    'kleur/chemicaliën': { en: 'colour/chemicals', th: 'สีย้อม/เคมีภัณฑ์' },
    wegwerp: { en: 'disposables', th: 'ของใช้แล้วทิ้ง' },
    'nagel-/huidproducten': { en: 'nail/skin products', th: 'ผลิตภัณฑ์เล็บ/ผิว' },
    'massageolie/lotion': { en: 'massage oil/lotion', th: 'น้ำมันนวด/โลชั่น' },
    disposables: { en: 'disposables', th: 'ของใช้แล้วทิ้ง' },
    'inkoop handelswaar': { en: 'goods for resale', th: 'สินค้าเพื่อขาย' },
    'krimp/verlies': { en: 'shrinkage/loss', th: 'สูญหาย/เสียหาย' },
    bakkerijingrediënten: { en: 'bakery ingredients', th: 'วัตถุดิบเบเกอรี่' },
    drankingrediënten: { en: 'drink ingredients', th: 'วัตถุดิบเครื่องดื่ม' },
    verpakking: { en: 'packaging', th: 'บรรจุภัณฑ์' },
    fruit: { en: 'fruit', th: 'ผลไม้' },
    'bekers/rietjes/deksels': { en: 'cups/straws/lids', th: 'แก้ว/หลอด/ฝา' },
    'suiker/siroop/ijs': { en: 'sugar/syrup/ice', th: 'น้ำตาล/ไซรัป/น้ำแข็ง' },
    'thee/siroop/parels': { en: 'tea/syrup/pearls', th: 'ชา/ไซรัป/ไข่มุก' },
    'bekers/rietjes': { en: 'cups/straws', th: 'แก้ว/หลอด' },
    'ijs/toppings': { en: 'ice/toppings', th: 'น้ำแข็ง/ท็อปปิ้ง' },
    'shampoo/wax/chemicaliën': { en: 'shampoo/wax/chemicals', th: 'แชมพู/แว็กซ์/เคมีภัณฑ์' },
    'microvezel/verbruik': { en: 'microfibre/consumables', th: 'ผ้าไมโครไฟเบอร์/วัสดุสิ้นเปลือง' },
    'wasmiddel/verzachter': { en: 'detergent/softener', th: 'ผงซักฟอก/น้ำยาปรับผ้านุ่ม' },
    'zakjes/verbruik': { en: 'bags/consumables', th: 'ถุง/วัสดุสิ้นเปลือง' }
};

/** "kopjes" → "kopje", for "per cup". */
const ENKELVOUD: Record<string, string> = {
    klanten: 'klant',
    kopjes: 'kopje',
    "auto's": 'auto',
    wasbeurten: 'wasbeurt'
};

type TaalContext = {
    taal: Taal;
    locale: string;
    t: (sleutel: Sleutel, vars?: Record<string, string | number>) => string;
    /** A Dutch word from the sheet (type, unit, stock part) in the current language; unknown words stay as they are. */
    woord: (nl: string) => string;
    /** A unit in the singular, translated ("kopjes" → "cup"). */
    enkel: (eenheid: string) => string;
    getal: (n: number | null) => string;
    maanden: (n: number | null) => string;
};

function maak(taal: Taal): TaalContext {
    const teksten = TEKSTEN[taal];
    const locale = LOCALE[taal];
    const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const n1 = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const t: TaalContext['t'] = (sleutel, vars) =>
        teksten[sleutel].replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`));
    const woord = (w: string) => (taal === 'nl' ? w : (WOORDEN[w.trim().toLowerCase()]?.[taal] ?? w));

    return {
        taal,
        locale,
        t,
        woord,
        enkel: (e) => woord(ENKELVOUD[e] ?? e),
        getal: (n) => (n === null ? teksten.onbekend : n0.format(n)),
        maanden: (n) => (n === null ? teksten.onbekend : `${n1.format(n)} ${teksten.maandKort}`)
    };
}

const Ctx = createContext<TaalContext>(maak('en'));

export function TaalProvider({ taal, children }: { taal: Taal; children: ReactNode }) {
    const waarde = useMemo(() => maak(taal), [taal]);

    return createElement(Ctx.Provider, { value: waarde }, children);
}

export const useT = () => useContext(Ctx);
