'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { VernieuwKnop } from '@/components/dashboard/vernieuw-knop';
import { ZaakCard, typeIcon } from '@/components/dashboard/zaak-card';
import { ZaakModal } from '@/components/dashboard/zaak-modal';
import { thb } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Zaak, ZakenData } from '@/lib/zaak-types';

import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Heart, LayoutGrid, Search } from 'lucide-react';

// ---- Sorting and the few filters there are ---------------------------------------------------

type SortKey = 'terug' | 'start' | 'winst' | 'klanten' | 'nr';

/** Each sort with its natural direction (best first); the arrow button flips it. */
const SORTS: { key: SortKey; label: string; asc: boolean; get: (z: Zaak) => number | null }[] = [
    { key: 'terug', label: 'Terugverdientijd', asc: true, get: (z) => z.terugverdientijd },
    { key: 'start', label: 'Startkapitaal', asc: true, get: (z) => z.startkapitaal },
    { key: 'winst', label: 'Winst / mnd', asc: false, get: (z) => z.winstPerMaand },
    { key: 'klanten', label: 'Klanten / dag nodig', asc: true, get: (z) => z.klantenNodig },
    { key: 'nr', label: 'Volgorde sheet', asc: true, get: (z) => z.nr }
];

type Filters = { type: string | null; favorieten: boolean; sort: SortKey; asc: boolean };

const START: Filters = { type: null, favorieten: false, sort: 'terug', asc: true };

const FAV_KEY = 'overname-cm:favorieten';
const FILTER_KEY = 'overname-cm:filters-v2';

/** Favourites live in this browser only (localStorage); the page works without it. */
function useFavorieten() {
    const [ids, setIds] = useState<string[]>([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(FAV_KEY);
            if (raw) setIds(JSON.parse(raw));
        } catch {
            /* no storage: start empty */
        }
    }, []);
    const toggle = useCallback((id: string) => {
        setIds((cur) => {
            const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
            try {
                localStorage.setItem(FAV_KEY, JSON.stringify(next));
            } catch {
                /* ignore */
            }

            return next;
        });
    }, []);

    return { ids, toggle };
}

/** The view (type, favourites, sort) is remembered per browser, so a refresh keeps it. */
function useFilters() {
    const [f, setF] = useState<Filters>(START);
    const [geladen, setGeladen] = useState(false);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(FILTER_KEY);
            if (raw) setF({ ...START, ...JSON.parse(raw) });
        } catch {
            /* ignore */
        }
        setGeladen(true);
    }, []);
    useEffect(() => {
        if (!geladen) return;
        try {
            localStorage.setItem(FILTER_KEY, JSON.stringify(f));
        } catch {
            /* ignore */
        }
    }, [f, geladen]);
    const set = useCallback((patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch })), []);

    return { f, set };
}

function filterZaken(zaken: Zaak[], f: Filters, favs: string[]) {
    const sort = SORTS.find((s) => s.key === f.sort) ?? SORTS[0];

    return zaken
        .filter((z) => {
            if (f.type && z.type !== f.type) return false;
            if (f.favorieten && !favs.includes(z.id)) return false;

            return true;
        })
        .sort((a, b) => {
            const va = sort.get(a);
            const vb = sort.get(b);
            // Unknown values always at the end, whichever way the list runs.
            if (va === null && vb === null) return a.nr - b.nr;
            if (va === null) return 1;
            if (vb === null) return -1;

            return (f.asc ? va - vb : vb - va) || a.nr - b.nr;
        });
}

// ---- Building blocks -------------------------------------------------------------------------

function Monogram({ small }: { small?: boolean }) {
    return (
        <span
            className={cn(
                'grid place-items-center rounded-xl bg-[linear-gradient(180deg,#ff9142,#e0620a)] font-bold tracking-tight text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_14px_-6px_rgb(var(--brand-rgb)/0.8)]',
                small ? 'size-8 rounded-lg text-[11px]' : 'size-9 text-[13px]'
            )}>
            CM
        </span>
    );
}

function NavRow({
    active,
    onClick,
    icon,
    children,
    count
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    children: ReactNode;
    count: number;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium transition-colors',
                active
                    ? 'bg-[var(--accent)] text-[var(--brand-ink)]'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            )}>
            {icon}
            <span className='min-w-0 flex-1 truncate'>{children}</span>
            <span className='readout text-xs opacity-70'>{count}</span>
        </button>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type='button'
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                active
                    ? 'border-[#f3b98a] bg-[var(--accent)] text-[var(--brand-ink)]'
                    : 'border-transparent bg-white text-stone-600 shadow-[0_0_0_1px_var(--border)] hover:text-stone-900'
            )}>
            {children}
        </button>
    );
}

// ---- The page --------------------------------------------------------------------------------

export function Dashboard({ data }: { data: ZakenData }) {
    const { zaken } = data;
    const { ids: favs, toggle } = useFavorieten();
    const { f, set } = useFilters();

    const lijst = useMemo(() => filterZaken(zaken, f, favs), [zaken, f, favs]);
    // The business open in the pop-up; previous/next walk the current (filtered, sorted) list.
    const [openId, setOpenId] = useState<string | null>(null);
    const openAt = openId ? lijst.findIndex((z) => z.id === openId) : -1;
    const open = openAt >= 0 ? lijst[openAt] : null;
    const nFav = favs.filter((id) => zaken.some((z) => z.id === id)).length;

    const types = useMemo(() => {
        const m = new Map<string, number>();
        for (const z of zaken) m.set(z.type, (m.get(z.type) ?? 0) + 1);

        // Most common first; "Overig/onbekend" always last, as it is the leftover group.
        const laatst = (t: string) => (/^overig/i.test(t) ? 1 : 0);

        return [...m.entries()].sort((a, b) => laatst(a[0]) - laatst(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0]));
    }, [zaken]);

    const sort = SORTS.find((s) => s.key === f.sort) ?? SORTS[0];

    return (
        <div className='min-h-dvh lg:pl-60'>
            {/* Sidebar, as on the SRE dashboard but white, with just the two views. */}
            <aside className='fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-white px-3 py-5 lg:flex'>
                <div className='flex items-center gap-2.5 px-2.5'>
                    <Monogram />
                    <span className='leading-tight'>
                        <span className='block text-[15px] font-semibold'>overname</span>
                        <span className='text-muted-foreground block text-[11px] tracking-[0.18em]'>chiang mai</span>
                    </span>
                </div>

                <nav className='mt-8 flex flex-col gap-0.5'>
                    <NavRow
                        active={!f.favorieten}
                        onClick={() => set({ favorieten: false })}
                        icon={<LayoutGrid className='size-4' strokeWidth={1.75} />}
                        count={zaken.length}>
                        Alle zaken
                    </NavRow>
                    <NavRow
                        active={f.favorieten}
                        onClick={() => set({ favorieten: true })}
                        icon={
                            <Heart
                                className={cn('size-4', f.favorieten && 'fill-[var(--brand)] text-[var(--brand)]')}
                                strokeWidth={1.75}
                            />
                        }
                        count={nFav}>
                        Favorieten
                    </NavRow>
                </nav>

                <div className='text-muted-foreground mt-auto px-2.5 text-xs leading-relaxed'>
                    <p className='flex items-center gap-2'>
                        <span className={cn('led', !data.live && 'bg-stone-400 shadow-none')} />
                        {data.live ? 'Live uit Google Sheet' : 'Lokale kopie (sheet niet bereikbaar)'}
                    </p>
                    <p className='mt-1'>Bijgewerkt {data.bijgewerkt ?? 'onbekend'} · bedragen in THB</p>
                    <a
                        href={data.sheetUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-1 inline-block font-medium text-[var(--brand-ink)] hover:underline'>
                        Open de sheet
                    </a>
                </div>
            </aside>

            <main className='px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8'>
                {/* One toolbar: type on the left, sort on the right. */}
                <div className='mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div className='no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 md:mx-0 md:flex-wrap md:px-0'>
                        {/* No sidebar on phones: favourites sit with the types. */}
                        <span className='contents lg:hidden'>
                            <Chip active={f.favorieten} onClick={() => set({ favorieten: !f.favorieten })}>
                                <Heart
                                    className={cn(
                                        'size-3.5',
                                        f.favorieten && 'fill-[var(--brand)] text-[var(--brand)]'
                                    )}
                                />
                                Favorieten
                                <span className='readout text-xs opacity-50'>{nFav}</span>
                            </Chip>
                        </span>
                        <Chip active={!f.type} onClick={() => set({ type: null })}>
                            Alle types
                        </Chip>
                        {types.map(([t, n]) => {
                            const Icon = typeIcon(t);

                            return (
                                <Chip
                                    key={t}
                                    active={f.type === t}
                                    onClick={() => set({ type: f.type === t ? null : t })}>
                                    <Icon className='size-3.5' />
                                    {t}
                                    <span className='readout text-xs opacity-50'>{n}</span>
                                </Chip>
                            );
                        })}
                    </div>

                    <div className='flex flex-wrap items-center gap-1.5 md:shrink-0 md:flex-nowrap'>
                        <VernieuwKnop className='mr-1' />
                        <label className='relative'>
                            <span className='sr-only'>Sorteren op</span>
                            <select
                                value={f.sort}
                                onChange={(e) => {
                                    const s = SORTS.find((x) => x.key === e.target.value) ?? SORTS[0];
                                    set({ sort: s.key, asc: s.asc });
                                }}
                                className='btn-key h-9 cursor-pointer appearance-none rounded-xl pr-8 pl-3 text-[13px] font-medium'>
                                {SORTS.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className='text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2' />
                        </label>
                        <button
                            type='button'
                            onClick={() => set({ asc: !f.asc })}
                            aria-label={f.asc ? 'Oplopend, klik voor aflopend' : 'Aflopend, klik voor oplopend'}
                            title={f.asc ? 'Laag → hoog' : 'Hoog → laag'}
                            className='btn-key grid size-9 shrink-0 place-items-center rounded-xl'>
                            {f.asc ? (
                                <ArrowUpNarrowWide className='size-4 text-[var(--brand-ink)]' />
                            ) : (
                                <ArrowDownWideNarrow className='size-4 text-[var(--brand-ink)]' />
                            )}
                        </button>
                    </div>
                </div>

                {lijst.length ? (
                    <div className='3xl:grid-cols-5 mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
                        {lijst.map((z) => (
                            <ZaakCard
                                key={z.id}
                                zaak={z}
                                favoriet={favs.includes(z.id)}
                                onFavoriet={() => toggle(z.id)}
                                onOpen={() => setOpenId(z.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='panel text-muted-foreground mt-4 flex flex-col items-center gap-3 px-6 py-14 text-center text-sm'>
                        {f.favorieten && !nFav ? (
                            <>
                                <Heart className='size-7 text-[var(--brand)]' strokeWidth={1.5} />
                                <p>Nog geen favorieten. Tik op het hartje op een kaart om een zaak te bewaren.</p>
                            </>
                        ) : (
                            <>
                                <Search className='size-7 text-[var(--brand)]' strokeWidth={1.5} />
                                <p>Geen zaken gevonden.</p>
                            </>
                        )}
                        <button
                            type='button'
                            onClick={() => set({ type: null, favorieten: false })}
                            className='btn-key h-9 rounded-xl px-4 text-sm font-medium'>
                            Toon alle zaken
                        </button>
                    </div>
                )}

                <Aannames data={data} />

                <ZaakModal
                    zaak={open}
                    onClose={() => setOpenId(null)}
                    favoriet={!!open && favs.includes(open.id)}
                    onFavoriet={() => open && toggle(open.id)}
                    onVorige={openAt > 0 ? () => setOpenId(lijst[openAt - 1].id) : undefined}
                    onVolgende={
                        openAt >= 0 && openAt < lijst.length - 1 ? () => setOpenId(lijst[openAt + 1].id) : undefined
                    }
                />
            </main>
        </div>
    );
}

function Aannames({ data }: { data: ZakenData }) {
    if (!data.aannames.length) return null;

    return (
        <details className='group panel mt-8 overflow-hidden'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 select-none sm:px-5 [&::-webkit-details-marker]:hidden'>
                <span className='label-hud'>aannames achter de cijfers</span>
                <ChevronDown className='text-muted-foreground size-4 transition-transform group-open:rotate-180' />
            </summary>
            <div className='border-t'>
                <p className='text-muted-foreground max-w-3xl px-4 py-3 text-[13px] leading-relaxed sm:px-5'>
                    Per zaak gerekend met deze kosten per type
                    {data.loon !== null && <> en {thb(data.loon)} loon per maand voor 1 fulltime werknemer</>}. Onbekend
                    telt als 0.
                </p>
                <div className='overflow-x-auto'>
                    <table className='readout w-full min-w-[34rem] text-[13px]'>
                        <thead>
                            <tr className='text-muted-foreground border-y text-left'>
                                {['Type zaak', 'Nuts / mnd', 'Overig / mnd', 'Inkoop', 'Open dagen'].map((h, i) => (
                                    <th
                                        key={h}
                                        className={cn(
                                            'px-4 py-2.5 text-xs font-medium sm:px-5',
                                            i > 0 && 'text-right'
                                        )}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.aannames.map((a) => (
                                <tr key={a.type} className='border-b last:border-0'>
                                    <td className='px-4 py-2.5 font-medium sm:px-5'>{a.type}</td>
                                    <td className='px-4 py-2.5 text-right sm:px-5'>{thb(a.nuts)}</td>
                                    <td className='px-4 py-2.5 text-right sm:px-5'>{thb(a.overig)}</td>
                                    <td className='px-4 py-2.5 text-right sm:px-5'>
                                        {a.inkoopPct === null ? '–' : `${a.inkoopPct}%`}
                                    </td>
                                    <td className='px-4 py-2.5 text-right sm:px-5'>{a.openDagen ?? '–'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.bronTekst && (
                    <p className='text-muted-foreground border-t px-4 py-3 text-xs leading-relaxed sm:px-5'>
                        Bron: {data.bronTekst}
                    </p>
                )}
            </div>
        </details>
    );
}
