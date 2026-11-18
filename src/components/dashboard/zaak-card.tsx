'use client';

import { useState } from 'react';

import { getal, kosten, maanden, telHref, thb } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Band, type Zaak, band, enkelvoud } from '@/lib/zaak-types';

import {
    Car,
    ChevronDown,
    Coffee,
    CupSoda,
    ExternalLink,
    Heart,
    MapPin,
    Phone,
    Scissors,
    ShoppingBasket,
    Sparkles,
    Store,
    Users,
    WashingMachine
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TYPE_ICON: Record<string, LucideIcon> = {
    Koffie: Coffee,
    Kapper: Scissors,
    Schoonheid: Sparkles,
    'Drank & bakery': CupSoda,
    'Drank markt (3 d/wk)': CupSoda,
    'Winkel/kruidenier': ShoppingBasket,
    Carwash: Car,
    Wasserette: WashingMachine
};

export const typeIcon = (type: string) => TYPE_ICON[type] ?? Store;

/** Payback, in the sheet's colours: green ≤ 6 months, amber 6–12, rose above. */
const BAND_PILL: Record<Band, string> = {
    snel: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    middel: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    traag: 'bg-rose-50 text-rose-700 ring-rose-200/70',
    onbekend: 'bg-stone-50 text-stone-500 ring-stone-200'
};
const BAND_DOT: Record<Band, string> = {
    snel: 'bg-emerald-500',
    middel: 'bg-amber-500',
    traag: 'bg-rose-500',
    onbekend: 'bg-stone-300'
};

function Foto({ zaak }: { zaak: Zaak }) {
    const [kapot, setKapot] = useState(false);
    const Icon = typeIcon(zaak.type);

    if (!zaak.foto || kapot)
        return (
            <div className='flex h-full w-full items-center justify-center bg-[radial-gradient(26rem_12rem_at_50%_130%,rgb(var(--brand-rgb)/0.14),transparent_70%),linear-gradient(180deg,#fffaf6,#fff4ec)]'>
                <Icon className='size-9 text-[var(--brand)] opacity-60' strokeWidth={1.25} />
            </div>
        );

    return (
        // Photos come from the ad sites, so a plain img (no Next image domains to keep up to date).
        <img
            src={zaak.foto}
            alt={zaak.naam}
            loading='lazy'
            referrerPolicy='no-referrer'
            onError={() => setKapot(true)}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
        />
    );
}

/** One line of the monthly sum: label left, amount right. */
function Regel({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={cn('flex items-baseline justify-between gap-3', className)}>
            <dt>{label}</dt>
            <dd className='readout'>{value}</dd>
        </div>
    );
}

export function ZaakCard({ zaak, favoriet, onFavoriet }: { zaak: Zaak; favoriet: boolean; onFavoriet: () => void }) {
    const b = band(zaak.terugverdientijd);
    const tel = telHref(zaak.telefoon);

    // Every month, as the sheet counts it: fixed costs (rent, wage, utilities, other) plus stock bought (a share of
    // turnover). The one-off costs (takeover, deposit, rent in advance) are only in the start investment.
    const omzet = zaak.omzetPerMaand;
    const winst = zaak.winstPerMaand;
    const kostenMnd = omzet !== null && winst !== null ? omzet - winst : zaak.vasteKosten;
    const inkoop = kostenMnd !== null && zaak.vasteKosten !== null ? kostenMnd - zaak.vasteKosten : null;
    const marge = omzet && winst !== null ? Math.max(0, Math.min(1, winst / omzet)) : null;
    const eersteMaand =
        zaak.startkapitaal !== null && zaak.eenmalig !== null ? zaak.startkapitaal - zaak.eenmalig : null;

    return (
        <article
            className={cn(
                'group panel flex flex-col overflow-hidden transition-shadow hover:shadow-[0_1px_2px_rgb(40_24_10/0.04),0_18px_40px_-20px_rgb(40_24_10/0.25)]',
                favoriet && 'border-[#f6c39a]'
            )}>
            <div className='relative aspect-[2/1] overflow-hidden'>
                <Foto zaak={zaak} />
                <div className='absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3'>
                    <div className='flex items-center gap-1.5'>
                        <span className='readout rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur'>
                            #{zaak.nr}
                        </span>
                        {zaak.nieuw && (
                            <span className='rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-white shadow-sm'>
                                Nieuw
                            </span>
                        )}
                    </div>
                    <button
                        type='button'
                        onClick={onFavoriet}
                        aria-pressed={favoriet}
                        aria-label={
                            favoriet ? `${zaak.naam} uit favorieten halen` : `${zaak.naam} als favoriet markeren`
                        }
                        title={favoriet ? 'Uit favorieten' : 'Markeer als favoriet'}
                        className='grid size-9 shrink-0 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-95'>
                        <Heart
                            className={cn(
                                'size-4',
                                favoriet ? 'fill-[var(--brand)] text-[var(--brand)]' : 'text-stone-500'
                            )}
                        />
                    </button>
                </div>
            </div>

            <div className='flex flex-1 flex-col p-4 sm:p-5'>
                <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-[12.5px]'>
                    <span className='shrink-0 font-medium text-[var(--brand-ink)]'>{zaak.type}</span>
                    <span aria-hidden>·</span>
                    <MapPin className='size-3 shrink-0' />
                    <span className='truncate'>{zaak.locatie ?? 'locatie onbekend'}</span>
                </p>
                <h3 className='mt-1 line-clamp-1 text-base leading-snug font-semibold' title={zaak.naam}>
                    {zaak.naam}
                </h3>

                {/* 1. What it takes to start, and how fast it comes back. */}
                <div className='mt-4'>
                    <div className='flex items-center justify-between gap-2'>
                        <p className='text-muted-foreground text-xs'>Startinvestering</p>
                        <span
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                                BAND_PILL[b]
                            )}>
                            <span className={cn('size-1.5 rounded-full', BAND_DOT[b])} aria-hidden />
                            {zaak.terugverdientijd === null
                                ? 'terugverdientijd ?'
                                : `terug in ${maanden(zaak.terugverdientijd)}`}
                        </span>
                    </div>
                    <p
                        className={cn(
                            'readout mt-1.5 text-[1.85rem] leading-none',
                            zaak.startkapitaal === null ? 'text-muted-foreground/60 text-xl' : 'text-glow'
                        )}>
                        {zaak.startkapitaal === null ? 'onbekend' : thb(zaak.startkapitaal)}
                    </p>
                    {eersteMaand !== null && (
                        <p className='text-muted-foreground mt-1.5 text-[11.5px]'>
                            {thb(zaak.eenmalig)} eenmalig + {thb(eersteMaand)} buffer 1e maand
                        </p>
                    )}
                </div>

                {/* 2. Every month: in, out, left over. */}
                <div className='mt-4 rounded-xl bg-[var(--muted)]/70 px-3.5 py-3'>
                    <p className='text-muted-foreground text-xs'>Elke maand</p>
                    {omzet === null && winst === null ? (
                        <p className='text-muted-foreground mt-1.5 text-[13px]'>Omzet en winst nog niet berekend.</p>
                    ) : (
                        <>
                            <dl className='mt-1.5 space-y-1 text-[13.5px]'>
                                <Regel label='Omzet' value={thb(omzet)} className='text-stone-700' />
                                {inkoop !== null ? (
                                    <>
                                        <Regel label='Inkoop' value={`− ${thb(inkoop)}`} className='text-stone-500' />
                                        <Regel
                                            label='Huur, loon, nuts'
                                            value={`− ${thb(zaak.vasteKosten)}`}
                                            className='text-stone-500'
                                        />
                                    </>
                                ) : (
                                    <Regel
                                        label='Kosten'
                                        value={kostenMnd === null ? 'onbekend' : `− ${thb(kostenMnd)}`}
                                        className='text-stone-500'
                                    />
                                )}
                                <Regel
                                    label='Winst'
                                    value={thb(winst)}
                                    className='border-t border-stone-200 pt-1.5 text-[15px] font-semibold text-stone-900'
                                />
                            </dl>
                            {marge !== null && (
                                <div className='mt-2.5 flex items-center gap-2'>
                                    <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200'>
                                        <div
                                            className='h-full rounded-full bg-[var(--brand)]'
                                            style={{ width: `${marge * 100}%` }}
                                        />
                                    </div>
                                    <span className='readout text-muted-foreground shrink-0 text-[11.5px]'>
                                        {Math.round(marge * 100)}% blijft over
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 3. Customers a day: the break-even point (monthly costs covered, profit 0) and the number the
                    profit above is based on. */}
                {zaak.klantenNodig !== null && (
                    <p
                        className='text-muted-foreground mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug'
                        title='Quitte = genoeg omzet voor de maandkosten (huur, loon, nuts, inkoop), winst 0. De winst hierboven is gerekend met het verwachte aantal.'>
                        <Users className='mt-px size-3.5 shrink-0' />
                        <span>
                            Quitte bij{' '}
                            <span className='text-foreground font-medium'>
                                {getal(zaak.klantenNodig)} {zaak.eenheid}/dag
                            </span>
                            {zaak.verwachtKlanten !== null && (
                                <>
                                    {' · '}winst bij{' '}
                                    <span className='text-foreground font-medium'>
                                        {getal(zaak.verwachtKlanten)}/dag
                                    </span>
                                </>
                            )}
                            {zaak.bestedingPerKlant !== null &&
                                ` · ${thb(zaak.bestedingPerKlant)} per ${enkelvoud(zaak.eenheid)}`}
                        </span>
                    </p>
                )}

                <details className='group/meer mt-2'>
                    <summary className='text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1 py-1.5 text-xs font-medium select-none [&::-webkit-details-marker]:hidden'>
                        <ChevronDown className='size-3.5 transition-transform group-open/meer:rotate-180' />
                        Details
                    </summary>
                    <dl className='readout mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[12.5px]'>
                        {(
                            [
                                ['Overname', thb(zaak.overname)],
                                ['Borg', kosten(zaak.borg)],
                                ['Huur vooruit', kosten(zaak.huurVooruit)],
                                ['Buffer 1e maand', thb(eersteMaand)],
                                ['Huur / mnd', thb(zaak.huur)],
                                ['Break-even omzet / dag', thb(zaak.breakEvenOmzetDag)]
                            ] as const
                        ).map(([k, v]) => (
                            <div key={k} className='contents'>
                                <dt className='text-muted-foreground'>{k}</dt>
                                <dd className={cn('text-right', v === 'onbekend' && 'opacity-50')}>{v}</dd>
                            </div>
                        ))}
                    </dl>
                    {zaak.opmerking && (
                        <p className='text-muted-foreground mt-2.5 border-t pt-2.5 text-[12.5px] leading-relaxed'>
                            {zaak.opmerking}
                        </p>
                    )}
                </details>

                <div className='mt-auto flex items-center gap-2 pt-3'>
                    {zaak.link ? (
                        <a
                            href={zaak.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='btn-primary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm'>
                            Bekijk advertentie
                            <ExternalLink className='size-3.5' />
                        </a>
                    ) : (
                        <span className='inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-stone-50 px-3 text-sm text-stone-400'>
                            Geen advertentie
                        </span>
                    )}
                    {tel && (
                        <a
                            href={tel}
                            title={zaak.telefoon ?? undefined}
                            aria-label={`Bel ${zaak.telefoon}`}
                            className='btn-key grid size-9 shrink-0 place-items-center rounded-xl'>
                            <Phone className='size-4 text-[var(--brand)]' />
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}
