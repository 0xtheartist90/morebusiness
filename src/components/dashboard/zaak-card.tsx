'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useGeld } from '@/lib/valuta';
import { type Band, type Zaak, band } from '@/lib/zaak-types';

import {
    Car,
    Coffee,
    CupSoda,
    Heart,
    MapPin,
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

/** Payback, in the sheet's colours: green ≤ 6 months, amber 6–12, rose above. */
export const BAND_PILL: Record<Band, string> = {
    snel: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    middel: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    traag: 'bg-rose-50 text-rose-700 ring-rose-200/70',
    onbekend: 'bg-stone-50 text-stone-500 ring-stone-200'
};
export const BAND_DOT: Record<Band, string> = {
    snel: 'bg-emerald-500',
    middel: 'bg-amber-500',
    traag: 'bg-rose-500',
    onbekend: 'bg-stone-300'
};

/** The numbers both the card and the pop-up use, worked out once. */
export function cijfers(zaak: Zaak) {
    // Every month, as the sheet counts it: stock bought (a share of turnover) + fixed costs (rent, wage, utilities,
    // other). The one-off costs (takeover, deposit, rent in advance) are only in the start investment.
    const omzet = zaak.omzetPerMaand;
    const winst = zaak.winstPerMaand;
    const lasten = omzet !== null && winst !== null ? omzet - winst : zaak.vasteKosten;
    const inkoop = lasten !== null && zaak.vasteKosten !== null ? lasten - zaak.vasteKosten : null;
    const buffer = zaak.startkapitaal !== null && zaak.eenmalig !== null ? zaak.startkapitaal - zaak.eenmalig : null;
    const marge = omzet && winst !== null ? Math.round((winst / omzet) * 100) : null;

    return { omzet, winst, lasten, inkoop, buffer, marge };
}

export function Foto({ zaak, className }: { zaak: Zaak; className?: string }) {
    const [kapot, setKapot] = useState(false);
    const Icon = typeIcon(zaak.type);

    if (!zaak.foto || kapot)
        return (
            <div
                className={cn(
                    'flex h-full w-full items-center justify-center bg-[radial-gradient(26rem_12rem_at_50%_130%,rgb(var(--brand-rgb)/0.14),transparent_70%),linear-gradient(180deg,#fffaf6,#fff4ec)]',
                    className
                )}>
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
            className={cn('h-full w-full object-cover', className)}
        />
    );
}

export function HartKnop({
    zaak,
    favoriet,
    onFavoriet,
    className
}: {
    zaak: Zaak;
    favoriet: boolean;
    onFavoriet: () => void;
    className?: string;
}) {
    const { t } = useT();

    return (
        <button
            type='button'
            onClick={(e) => {
                // On a card the click would otherwise also open the pop-up.
                e.stopPropagation();
                onFavoriet();
            }}
            aria-pressed={favoriet}
            aria-label={`${zaak.naam}: ${favoriet ? t('favUit') : t('favAan')}`}
            title={favoriet ? t('favUit') : t('favAan')}
            className={cn(
                'grid size-9 shrink-0 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-95',
                className
            )}>
            <Heart className={cn('size-4', favoriet ? 'fill-[var(--brand)] text-[var(--brand)]' : 'text-stone-500')} />
        </button>
    );
}

/** One number on the card: a small label over the value; `klein` for the monthly row. */
function Cel({ label, children, klein }: { label: string; children: ReactNode; klein?: boolean }) {
    return (
        <div className='min-w-0'>
            <dt className='text-muted-foreground truncate text-[11px]'>{label}</dt>
            <dd className={cn('readout truncate font-semibold', klein ? 'text-[13.5px]' : 'text-[15px]')}>
                {children}
            </dd>
        </div>
    );
}

/** The overview card: photo, name and the three numbers to compare at a glance. Click for everything else. */
export function ZaakCard({
    zaak,
    favoriet,
    onFavoriet,
    onOpen
}: {
    zaak: Zaak;
    favoriet: boolean;
    onFavoriet: () => void;
    onOpen: () => void;
}) {
    const { geld } = useGeld();
    const { t, woord, maanden, getal } = useT();
    const b = band(zaak.terugverdientijd);
    const { winst, omzet, lasten } = cijfers(zaak);

    return (
        <article
            role='button'
            tabIndex={0}
            aria-label={`${zaak.naam}: ${t('alleDetails')}`}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen();
                }
            }}
            className={cn(
                'group panel flex cursor-pointer flex-col overflow-hidden text-left transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(40_24_10/0.04),0_18px_40px_-20px_rgb(40_24_10/0.3)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
                favoriet && 'border-[#f6c39a]'
            )}>
            <div className='relative aspect-[16/9] overflow-hidden'>
                <Foto zaak={zaak} className='transition-transform duration-500 group-hover:scale-[1.03]' />
                <div className='absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5'>
                    <div className='flex items-center gap-1.5'>
                        <span className='readout rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur'>
                            #{zaak.nr}
                        </span>
                        {zaak.nieuw && (
                            <span className='rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-white shadow-sm'>
                                {t('nieuw')}
                            </span>
                        )}
                    </div>
                    <HartKnop zaak={zaak} favoriet={favoriet} onFavoriet={onFavoriet} className='size-8' />
                </div>
            </div>

            <div className='flex flex-1 flex-col p-3.5 sm:p-4'>
                <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
                    <span className='shrink-0 font-medium text-[var(--brand-ink)]'>{woord(zaak.type)}</span>
                    <span aria-hidden>·</span>
                    <MapPin className='size-3 shrink-0' />
                    <span className='truncate'>{zaak.locatie ?? t('locatieOnbekend')}</span>
                </p>
                <h3 className='mt-0.5 line-clamp-1 text-[15px] leading-snug font-semibold' title={zaak.naam}>
                    {zaak.naam}
                </h3>

                {/* Once: start, payback, break-even. Every month: revenue, costs, profit. */}
                <div className='mt-auto pt-3'>
                    <dl className='grid grid-cols-3 gap-2'>
                        <Cel label={t('kaartStart')}>
                            <span className='text-[var(--brand-ink)]'>
                                {zaak.startkapitaal === null ? '–' : geld(zaak.startkapitaal)}
                            </span>
                        </Cel>
                        <Cel label={t('kaartTerug')}>
                            <span className='flex items-center gap-1.5'>
                                <span className={cn('size-2 shrink-0 rounded-full', BAND_DOT[b])} aria-hidden />
                                {zaak.terugverdientijd === null ? '–' : maanden(zaak.terugverdientijd)}
                            </span>
                        </Cel>
                        <Cel label={t('kaartQuitte')}>
                            {zaak.klantenNodig === null ? (
                                '–'
                            ) : (
                                <>
                                    {getal(zaak.klantenNodig)}
                                    <span className='text-muted-foreground text-[11px] font-normal'>
                                        {t('perDagKort')}
                                    </span>
                                </>
                            )}
                        </Cel>
                    </dl>
                    <dl className='mt-2.5 grid grid-cols-3 gap-2 border-t pt-2.5'>
                        <Cel label={t('kaartOmzet')} klein>
                            {omzet === null ? '–' : geld(omzet)}
                        </Cel>
                        <Cel label={t('kaartLasten')} klein>
                            {lasten === null ? '–' : <span className='text-rose-700'>{geld(lasten)}</span>}
                        </Cel>
                        <Cel label={t('kaartWinst')} klein>
                            {winst === null ? '–' : <span className='text-emerald-700'>{geld(winst)}</span>}
                        </Cel>
                    </dl>
                </div>
            </div>
        </article>
    );
}
