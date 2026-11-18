'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

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

/**
 * Chart colours, checked with the dataviz palette validator (light surface): start = dark orange (one-off) + light
 * orange (first-month buffer); month = orange profit against two blues for the costs. Every segment also has a
 * labelled legend row with its amount, so nothing is read from colour alone.
 */
const KLEUR = {
    eenmalig: '#c2550a',
    buffer: '#f08a3c',
    winst: '#e8670c',
    vast: '#2563a8',
    inkoop: '#4a9bd9'
};

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
        // Photos come from the ad sites and Drive, so a plain img (no Next image domains to keep up to date).
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

/** A small section heading inside the card, in the dashboard's lowercase spaced voice. */
function Kop({ children, rechts }: { children: ReactNode; rechts?: ReactNode }) {
    return (
        <div className='flex items-center justify-between gap-2'>
            <p className='label-xs text-muted-foreground font-medium'>{children}</p>
            {rechts}
        </div>
    );
}

type Deel = { label: string; waarde: number; kleur: string };

/** One bar split into parts (part of a whole), 2px gaps between the parts, rounded ends. */
function Verdeelbalk({ delen, className }: { delen: Deel[]; className?: string }) {
    const totaal = delen.reduce((t, d) => t + Math.max(0, d.waarde), 0);
    if (!totaal) return null;

    return (
        <div
            className={cn('flex h-2.5 gap-[2px] overflow-hidden rounded-full', className)}
            role='img'
            aria-label={delen.map((d) => `${d.label} ${thb(d.waarde)}`).join(', ')}>
            {delen
                .filter((d) => d.waarde > 0)
                .map((d) => (
                    <div
                        key={d.label}
                        title={`${d.label}: ${thb(d.waarde)} (${Math.round((d.waarde / totaal) * 100)}%)`}
                        className='h-full first:rounded-l-full last:rounded-r-full'
                        style={{ width: `${(d.waarde / totaal) * 100}%`, background: d.kleur }}
                    />
                ))}
        </div>
    );
}

/** A legend row: colour key, label (with an optional hint), amount on the right. */
function Legenda({ kleur, label, hint, waarde }: { kleur: string; label: string; hint?: string; waarde: string }) {
    return (
        <div className='flex items-baseline gap-2 text-[12.5px]'>
            <span
                className='size-2 shrink-0 translate-y-[-1px] rounded-[3px]'
                style={{ background: kleur }}
                aria-hidden
            />
            <span className='min-w-0 flex-1 truncate text-stone-700'>
                {label}
                {hint && <span className='text-muted-foreground'> · {hint}</span>}
            </span>
            <span className='readout font-medium text-stone-900'>{waarde}</span>
        </div>
    );
}

/** A KPI tile inside the card. */
function Tegel({ label, waarde, accent }: { label: string; waarde: string; accent?: boolean }) {
    const leeg = waarde === 'onbekend';

    return (
        <div
            className={cn(
                'min-w-0 rounded-lg border px-2.5 py-2',
                accent ? 'border-[#f6cfae] bg-[#fff6ee]' : 'border-[var(--border)] bg-white'
            )}>
            <p className='text-muted-foreground truncate text-[11px]'>{label}</p>
            <p
                className={cn(
                    'readout mt-0.5 truncate text-[14.5px] leading-tight font-semibold',
                    accent && 'text-[var(--brand-ink)]',
                    leeg && 'text-muted-foreground/60 font-normal'
                )}>
                {leeg ? '–' : waarde}
            </p>
        </div>
    );
}

/**
 * Customers a day as a meter: the bar fills to the expected number, the dark tick marks break-even (the point where
 * the monthly costs are covered). Everything right of the tick is profit.
 */
function KlantenMeter({ zaak }: { zaak: Zaak }) {
    const quitte = zaak.klantenNodig!;
    const verwacht = zaak.verwachtKlanten;
    const max = Math.max(quitte, verwacht ?? 0) * 1.25 || 1;
    const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
    const per = enkelvoud(zaak.eenheid);
    const boven = verwacht !== null && quitte > 0 ? Math.round((verwacht / quitte - 1) * 100) : null;

    return (
        <div>
            <div className='flex items-end justify-between gap-3'>
                <div>
                    <p className='readout text-[15px] leading-tight font-semibold'>
                        {getal(quitte)}{' '}
                        <span className='text-muted-foreground text-[12px] font-normal'>{zaak.eenheid}</span>
                    </p>
                    <p className='text-muted-foreground text-[11px]'>nodig om quitte te spelen</p>
                </div>
                {verwacht !== null && (
                    <div className='text-right'>
                        <p className='readout text-[15px] leading-tight font-semibold text-[var(--brand-ink)]'>
                            {getal(verwacht)}{' '}
                            <span className='text-muted-foreground text-[12px] font-normal'>{zaak.eenheid}</span>
                        </p>
                        <p className='text-muted-foreground text-[11px]'>verwacht (basis voor winst)</p>
                    </div>
                )}
            </div>

            <div
                className='relative mt-2.5 h-2.5 rounded-full bg-stone-100'
                role='img'
                aria-label={`Quitte bij ${getal(quitte)} ${zaak.eenheid} per dag, verwacht ${verwacht === null ? 'onbekend' : getal(verwacht)}`}>
                {verwacht !== null && (
                    <div
                        className='absolute inset-y-0 left-0 rounded-full'
                        style={{ width: pct(verwacht), background: KLEUR.winst }}
                    />
                )}
                {/* Break-even tick, with a white ring so it stands out on the orange fill. */}
                <div
                    className='absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-stone-900 ring-2 ring-white'
                    style={{ left: pct(quitte) }}
                    title={`Quitte: ${getal(quitte)} ${zaak.eenheid} per dag`}
                />
            </div>

            <p className='text-muted-foreground mt-2 text-[11.5px]'>
                {zaak.bestedingPerKlant !== null && (
                    <>
                        <span className='readout text-foreground font-medium'>{thb(zaak.bestedingPerKlant)}</span> per{' '}
                        {per}
                    </>
                )}
                {boven !== null && boven > 0 && (
                    <>
                        {zaak.bestedingPerKlant !== null && ' · '}
                        verwacht {boven}% boven quitte
                    </>
                )}
            </p>
        </div>
    );
}

export function ZaakCard({ zaak, favoriet, onFavoriet }: { zaak: Zaak; favoriet: boolean; onFavoriet: () => void }) {
    const b = band(zaak.terugverdientijd);
    const tel = telHref(zaak.telefoon);

    // Every month, as the sheet counts it: stock bought (a share of turnover) + fixed costs (rent, wage, utilities,
    // other). The one-off costs (takeover, deposit, rent in advance) are only in the start investment.
    const omzet = zaak.omzetPerMaand;
    const winst = zaak.winstPerMaand;
    const lasten = omzet !== null && winst !== null ? omzet - winst : zaak.vasteKosten;
    const inkoop = lasten !== null && zaak.vasteKosten !== null ? lasten - zaak.vasteKosten : null;
    const buffer = zaak.startkapitaal !== null && zaak.eenmalig !== null ? zaak.startkapitaal - zaak.eenmalig : null;
    const marge = omzet && winst !== null ? Math.round((winst / omzet) * 100) : null;

    return (
        <article
            className={cn(
                'group panel flex flex-col overflow-hidden transition-shadow hover:shadow-[0_1px_2px_rgb(40_24_10/0.04),0_18px_40px_-20px_rgb(40_24_10/0.25)]',
                favoriet && 'border-[#f6c39a]'
            )}>
            <div className='relative aspect-[12/5] overflow-hidden'>
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

            <div className='flex flex-1 flex-col'>
                <div className='px-4 pt-4 sm:px-5'>
                    <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-[12.5px]'>
                        <span className='shrink-0 font-medium text-[var(--brand-ink)]'>{zaak.type}</span>
                        <span aria-hidden>·</span>
                        <MapPin className='size-3 shrink-0' />
                        <span className='truncate'>{zaak.locatie ?? 'locatie onbekend'}</span>
                    </p>
                    <h3 className='mt-1 line-clamp-1 text-base leading-snug font-semibold' title={zaak.naam}>
                        {zaak.naam}
                    </h3>
                </div>

                {/* 1. Start: what it takes, built up from one-off costs and a first-month buffer. */}
                <section className='mt-4 border-t px-4 py-4 sm:px-5'>
                    <Kop
                        rechts={
                            <span
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                    BAND_PILL[b]
                                )}>
                                <span className={cn('size-1.5 rounded-full', BAND_DOT[b])} aria-hidden />
                                {zaak.terugverdientijd === null
                                    ? 'terugverdientijd ?'
                                    : `terug in ${maanden(zaak.terugverdientijd)}`}
                            </span>
                        }>
                        startinvestering
                    </Kop>
                    <p
                        className={cn(
                            'readout mt-1.5 text-[1.85rem] leading-none',
                            zaak.startkapitaal === null ? 'text-muted-foreground/60 text-xl' : 'text-glow'
                        )}>
                        {zaak.startkapitaal === null ? 'onbekend' : thb(zaak.startkapitaal)}
                    </p>
                    {buffer !== null && zaak.eenmalig !== null && (
                        <>
                            <Verdeelbalk
                                className='mt-3'
                                delen={[
                                    { label: 'Eenmalig', waarde: zaak.eenmalig, kleur: KLEUR.eenmalig },
                                    { label: 'Buffer 1e maand', waarde: buffer, kleur: KLEUR.buffer }
                                ]}
                            />
                            <div className='mt-2.5 space-y-1'>
                                <Legenda
                                    kleur={KLEUR.eenmalig}
                                    label='Eenmalig'
                                    hint='overname, borg, huur vooruit'
                                    waarde={thb(zaak.eenmalig)}
                                />
                                <Legenda
                                    kleur={KLEUR.buffer}
                                    label='Buffer'
                                    hint='lasten 1e maand'
                                    waarde={thb(buffer)}
                                />
                            </div>
                        </>
                    )}
                </section>

                {/* 2. Every month: turnover, costs, profit, and how the turnover splits. */}
                <section className='border-t bg-[var(--canvas)] px-4 py-4 sm:px-5'>
                    <Kop
                        rechts={
                            marge !== null && (
                                <span className='readout text-muted-foreground text-[11.5px]'>marge {marge}%</span>
                            )
                        }>
                        elke maand
                    </Kop>
                    {omzet === null && winst === null ? (
                        <p className='text-muted-foreground mt-2 text-[13px]'>Omzet en winst nog niet berekend.</p>
                    ) : (
                        <>
                            <div className='mt-2 grid grid-cols-3 gap-1.5'>
                                <Tegel label='Omzet' waarde={thb(omzet)} />
                                <Tegel label='Lasten' waarde={thb(lasten)} />
                                <Tegel label='Winst' waarde={thb(winst)} accent />
                            </div>
                            {omzet !== null && winst !== null && inkoop !== null && zaak.vasteKosten !== null && (
                                <>
                                    <Verdeelbalk
                                        className='mt-3'
                                        delen={[
                                            { label: 'Inkoop', waarde: inkoop, kleur: KLEUR.inkoop },
                                            { label: 'Huur, loon, nuts', waarde: zaak.vasteKosten, kleur: KLEUR.vast },
                                            { label: 'Winst', waarde: winst, kleur: KLEUR.winst }
                                        ]}
                                    />
                                    <div className='mt-2.5 space-y-1'>
                                        <Legenda kleur={KLEUR.inkoop} label='Inkoop' waarde={thb(inkoop)} />
                                        <Legenda
                                            kleur={KLEUR.vast}
                                            label='Huur, loon, nuts'
                                            waarde={thb(zaak.vasteKosten)}
                                        />
                                        <Legenda kleur={KLEUR.winst} label='Winst' waarde={thb(winst)} />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </section>

                {/* 3. Per day: break-even against the expected number of customers. */}
                {zaak.klantenNodig !== null && (
                    <section className='border-t px-4 py-4 sm:px-5'>
                        <Kop>per dag</Kop>
                        <div className='mt-2'>
                            <KlantenMeter zaak={zaak} />
                        </div>
                    </section>
                )}

                <div className='mt-auto border-t px-4 pt-2 pb-4 sm:px-5'>
                    <details className='group/meer'>
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

                    <div className='mt-2 flex items-center gap-2'>
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
            </div>
        </article>
    );
}
