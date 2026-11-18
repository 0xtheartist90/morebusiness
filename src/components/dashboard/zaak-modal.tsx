'use client';

import type { ReactNode } from 'react';

import { BAND_DOT, BAND_PILL, Foto, HartKnop, cijfers } from '@/components/dashboard/zaak-card';
import { telHref } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useGeld } from '@/lib/valuta';
import { type Zaak, band } from '@/lib/zaak-types';
import * as Dialog from '@radix-ui/react-dialog';

import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Phone, X } from 'lucide-react';

// ---- Right pane building blocks: one panel shape, one row shape, one footer shape -------------------

/** A panel: title (and optional note on the right), rows, and an optional footer strip for the total. */
function Paneel({
    titel,
    meta,
    voet,
    children
}: {
    titel: string;
    meta?: ReactNode;
    voet?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className='flex flex-col overflow-hidden rounded-xl border bg-white'>
            <header className='flex h-11 shrink-0 items-center justify-between gap-2 border-b px-4'>
                <h3 className='text-[13px] font-semibold'>{titel}</h3>
                {meta}
            </header>
            <div className='flex-1 px-4 py-2'>{children}</div>
            {voet && (
                <footer className='flex h-11 shrink-0 items-center justify-between gap-3 border-t bg-[#fffaf5] px-4 text-[13.5px] font-semibold'>
                    {voet}
                </footer>
            )}
        </section>
    );
}

/** A row: label left, amount right in tabular figures. Unknown amounts are shown faded. */
function Rij({ label, hint, waarde, sterk }: { label: string; hint?: string; waarde: string; sterk?: boolean }) {
    const { t } = useT();

    return (
        <div className='flex h-8 items-center justify-between gap-3 text-[13.5px]'>
            <span className={cn('truncate', sterk ? 'font-semibold' : 'text-stone-600')}>
                {label}
                {hint && <span className='text-muted-foreground font-normal'> · {hint}</span>}
            </span>
            <span
                className={cn(
                    'readout shrink-0',
                    sterk && 'font-semibold',
                    waarde === t('onbekend') && 'text-stone-400'
                )}>
                {waarde}
            </span>
        </div>
    );
}

/** A row with a bar, all bars on the same scale (the turnover). Only profit is orange. */
function StaafRij({
    label,
    waarde,
    max,
    accent,
    min,
    sterk,
    sub
}: {
    label: string;
    waarde: number;
    max: number;
    /** Profit: orange. */
    accent?: boolean;
    min?: boolean;
    /** A total (the monthly costs): bold, dark bar. */
    sterk?: boolean;
    /** A part of the total above: indented, smaller, light bar. */
    sub?: boolean;
}) {
    const { geld } = useGeld();

    return (
        <div
            className={cn(
                'grid grid-cols-[9.75rem_1fr_5.5rem] items-center gap-3',
                sub ? 'h-7 text-[12.5px]' : 'h-9 text-[13.5px]'
            )}>
            <span
                className={cn(
                    'truncate',
                    sub && 'text-muted-foreground pl-3',
                    !sub && (accent || sterk ? 'font-semibold' : 'text-stone-600')
                )}>
                {label}
            </span>
            <div className={cn('rounded-full bg-stone-100', sub ? 'h-1' : 'h-2')}>
                <div
                    className={cn(
                        'h-full rounded-full',
                        accent ? 'bg-emerald-500' : sterk ? 'bg-rose-500' : sub ? 'bg-stone-300' : 'bg-stone-400'
                    )}
                    style={{ width: `${Math.max(2, Math.min(100, (waarde / max) * 100))}%` }}
                />
            </div>
            <span
                className={cn(
                    'readout text-right',
                    (accent || sterk) && 'font-semibold',
                    accent && 'text-emerald-700',
                    sterk && 'text-rose-700',
                    sub && 'text-muted-foreground'
                )}>
                {min ? '\u2212\u2009' : ''}
                {geld(waarde)}
            </span>
        </div>
    );
}

/** One part of the stock, under "Inkoop": smaller still, no bar, just label, share and amount. */
function Deel({ label, hint, waarde }: { label: string; hint: string; waarde: string }) {
    return (
        <div className='text-muted-foreground grid h-6 grid-cols-[1fr_auto] items-center gap-3 pl-6 text-[12px]'>
            <span className='truncate'>
                {label} <span className='opacity-70'>· {hint}</span>
            </span>
            <span className='readout'>{waarde}</span>
        </div>
    );
}

/** A small number in a row of three, under the customer meter. */
function Mini({ label, waarde }: { label: string; waarde: string }) {
    const { t } = useT();

    return (
        <div className='min-w-0 px-3 first:pl-0 last:pr-0'>
            <p className='text-muted-foreground text-[11.5px] leading-tight'>{label}</p>
            <p
                className={cn(
                    'readout mt-0.5 truncate text-[14px] font-semibold',
                    waarde === t('onbekend') && 'font-normal text-stone-400'
                )}>
                {waarde}
            </p>
        </div>
    );
}

function Kpi({
    label,
    children,
    accent,
    klein,
    sterk
}: {
    label: string;
    children: ReactNode;
    accent?: boolean;
    /** The three monthly tiles: a size smaller, so three fit in a row. */
    klein?: boolean;
    /** The monthly costs: a darker edge, as the number to keep an eye on. */
    sterk?: boolean;
}) {
    return (
        <div
            className={cn(
                'h-full min-w-0 rounded-xl border',
                klein ? 'px-3 py-2.5' : 'px-3.5 py-3',
                accent ? 'border-[#f3e2d4] bg-[linear-gradient(180deg,#fff,#fff7f0)]' : 'bg-white',
                sterk && 'border-rose-200 bg-rose-50/50'
            )}>
            <p className='text-muted-foreground truncate text-[11.5px]'>{label}</p>
            <div className={cn('readout mt-1 truncate leading-tight font-semibold', klein ? 'text-[15px]' : 'text-lg')}>
                {children}
            </div>
        </div>
    );
}

function Onbekend() {
    const { t } = useT();

    return <span className='text-muted-foreground font-normal'>{t('onbekend')}</span>;
}

// ---- The pop-up ---------------------------------------------------------------------------------------

export function ZaakModal({
    zaak,
    onClose,
    favoriet,
    onFavoriet,
    onVorige,
    onVolgende,
    positie,
    totaal
}: {
    zaak: Zaak | null;
    onClose: () => void;
    favoriet: boolean;
    onFavoriet: () => void;
    onVorige?: () => void;
    onVolgende?: () => void;
    /** 1-based place of this business in the current list, and the list's length. */
    positie?: number;
    totaal?: number;
}) {
    return (
        <Dialog.Root open={!!zaak} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-[2px]' />
                <Dialog.Content
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' && onVorige) onVorige();
                        if (e.key === 'ArrowRight' && onVolgende) onVolgende();
                    }}
                    className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-1.5rem)] w-[min(80rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-[var(--canvas)] shadow-[0_30px_80px_-20px_rgb(20_12_4/0.45)] focus:outline-none'>
                    {zaak && (
                        <Inhoud
                            zaak={zaak}
                            favoriet={favoriet}
                            onFavoriet={onFavoriet}
                            onVorige={onVorige}
                            onVolgende={onVolgende}
                            positie={positie}
                            totaal={totaal}
                        />
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

/**
 * Wide screens: two panes side by side. Left, the business itself (photo, name, the four numbers, the actions);
 * right, four equal panels (start, month, customers per day, details). Phones stack it all in one scrolling column.
 */
function Inhoud({
    zaak,
    favoriet,
    onFavoriet,
    onVorige,
    onVolgende,
    positie,
    totaal
}: {
    zaak: Zaak;
    favoriet: boolean;
    onFavoriet: () => void;
    onVorige?: () => void;
    onVolgende?: () => void;
    positie?: number;
    totaal?: number;
}) {
    const { geld, kosten: geldKosten } = useGeld();
    const { t, woord, enkel, getal, maanden } = useT();
    const eenheid = woord(zaak.eenheid);
    const b = band(zaak.terugverdientijd);
    const { omzet, winst, lasten, inkoop, buffer, marge } = cijfers(zaak);
    const tel = telHref(zaak.telefoon);
    const quitte = zaak.klantenNodig;
    const verwacht = zaak.verwachtKlanten;
    const meterMax = Math.max(quitte ?? 0, verwacht ?? 0) * 1.25 || 1;
    const pct = (n: number) => `${Math.min(100, (n / meterMax) * 100)}%`;
    const boven = verwacht !== null && quitte ? Math.round((verwacht / quitte - 1) * 100) : null;
    // Fixed costs as the sheet adds them up: rent + wage + utilities + other. "Overig" takes up any rounding, so the
    // parts always add up to the sheet's total. Null when a part is missing (then one combined row is shown).
    const vast = (() => {
        const { huur, loon, nuts, vasteKosten } = zaak;
        if (huur === null || loon === null || nuts === null || vasteKosten === null) return null;
        const overig = vasteKosten - huur - loon - nuts;
        if (overig < 0) return null;

        return [
            { label: t('huur'), waarde: huur },
            { label: t('loon'), waarde: loon },
            { label: t('nuts'), waarde: nuts },
            { label: t('overig'), waarde: overig }
        ].filter((v) => v.waarde > 0);
    })();
    const ronde = 'grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur hover:bg-white';
    const navKnop = 'btn-key grid size-8 place-items-center rounded-lg disabled:opacity-40';

    return (
        <div className='flex min-h-0 w-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden'>
            {/* Left pane: the business. */}
            <aside className='flex shrink-0 flex-col border-b bg-white lg:w-[24rem] lg:border-r lg:border-b-0 xl:w-[26rem]'>
                <div className='relative aspect-[16/10] w-full shrink-0 overflow-hidden lg:aspect-[4/3]'>
                    <Foto zaak={zaak} />
                    <div className='absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3'>
                        <div className='flex items-center gap-1.5'>
                            <span className='readout rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-700 shadow-sm'>
                                #{zaak.nr}
                            </span>
                            {zaak.nieuw && (
                                <span className='rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-white shadow-sm'>
                                    {t('nieuw')}
                                </span>
                            )}
                        </div>
                        <div className='flex items-center gap-1.5'>
                            <HartKnop zaak={zaak} favoriet={favoriet} onFavoriet={onFavoriet} />
                            <Dialog.Close aria-label={t('sluiten')} className={cn(ronde, 'lg:hidden')}>
                                <X className='size-4' />
                            </Dialog.Close>
                        </div>
                    </div>
                </div>

                <div className='flex flex-1 flex-col gap-4 p-4 lg:min-h-0 lg:overflow-y-auto lg:p-5'>
                    <header>
                        <p className='text-muted-foreground flex items-center gap-1.5 text-[13px]'>
                            <span className='font-medium text-[var(--brand-ink)]'>{woord(zaak.type)}</span>
                            <span aria-hidden>·</span>
                            <MapPin className='size-3.5 shrink-0' />
                            <span className='truncate'>{zaak.locatie ?? t('locatieOnbekend')}</span>
                        </p>
                        <Dialog.Title className='mt-1 text-xl leading-snug font-semibold'>{zaak.naam}</Dialog.Title>
                        <Dialog.Description className='sr-only'>
                            {t('beschrijving', { naam: zaak.naam })}
                        </Dialog.Description>
                    </header>

                    {/* Once: start and payback. Every month: in, out, left over. */}
                    <div className='grid grid-cols-6 gap-2'>
                        <div className='col-span-3'>
                            <Kpi label={t('startinvestering')} accent>
                                <span
                                    className={
                                        zaak.startkapitaal === null ? 'text-muted-foreground font-normal' : 'text-glow'
                                    }>
                                    {geld(zaak.startkapitaal)}
                                </span>
                            </Kpi>
                        </div>
                        <div className='col-span-3'>
                            <Kpi label={t('terugverdiendIn')}>
                                <span className='flex items-center gap-2'>
                                    <span className={cn('size-2.5 rounded-full', BAND_DOT[b])} aria-hidden />
                                    {maanden(zaak.terugverdientijd)}
                                </span>
                            </Kpi>
                        </div>
                        <p className='text-muted-foreground col-span-6 mt-1 -mb-0.5 text-[11.5px]'>
                            {t('perMaand')}
                            {verwacht !== null && (
                                <>
                                    {' '}
                                    · {t('bij')}{' '}
                                    <span className='text-foreground font-medium'>
                                        {getal(verwacht)} {t('perDag', { e: eenheid })}
                                    </span>
                                </>
                            )}
                        </p>
                        <div className='col-span-2'>
                            <Kpi label={t('omzet')} klein>
                                {omzet === null ? <Onbekend /> : geld(omzet)}
                            </Kpi>
                        </div>
                        <div className='col-span-2'>
                            <Kpi label={t('lasten')} klein sterk>
                                {lasten === null ? <Onbekend /> : <span className='text-rose-700'>{geld(lasten)}</span>}
                            </Kpi>
                        </div>
                        <div className='col-span-2'>
                            <Kpi label={t('winst')} klein>
                                {winst === null ? (
                                    <Onbekend />
                                ) : (
                                    <span className='text-emerald-700'>{geld(winst)}</span>
                                )}
                            </Kpi>
                        </div>
                    </div>

                    {zaak.opmerking && (
                        <p className='rounded-xl bg-[var(--muted)]/70 px-3.5 py-3 text-[13px] leading-relaxed text-stone-600'>
                            {zaak.opmerking}
                        </p>
                    )}

                    <div className='mt-auto flex items-center gap-2 pt-1'>
                        {zaak.link ? (
                            <a
                                href={zaak.link}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='btn-primary inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm'>
                                {t('bekijkAdvertentie')}
                                <ExternalLink className='size-3.5' />
                            </a>
                        ) : (
                            <span className='inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-50 px-4 text-sm text-stone-400'>
                                {t('geenAdvertentie')}
                            </span>
                        )}
                        {tel && (
                            <a
                                href={tel}
                                title={zaak.telefoon ?? undefined}
                                className='btn-key inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium'>
                                <Phone className='size-4 text-[var(--brand)]' />
                                {t('bel')}
                            </a>
                        )}
                    </div>
                </div>
            </aside>

            {/* Right pane: four equal panels. */}
            <div className='flex min-w-0 flex-1 flex-col lg:min-h-0'>
                <div className='hidden h-14 shrink-0 items-center justify-between gap-3 border-b bg-white px-5 lg:flex'>
                    <p className='readout text-muted-foreground text-[13px]'>
                        {positie && totaal ? <>{t('zaakVan', { i: positie, n: totaal })}</> : null}
                    </p>
                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            onClick={onVorige}
                            disabled={!onVorige}
                            aria-label={t('vorige')}
                            title={`${t('vorige')} (←)`}
                            className={navKnop}>
                            <ChevronLeft className='size-4' />
                        </button>
                        <button
                            type='button'
                            onClick={onVolgende}
                            disabled={!onVolgende}
                            aria-label={t('volgende')}
                            title={`${t('volgende')} (→)`}
                            className={navKnop}>
                            <ChevronRight className='size-4' />
                        </button>
                        <Dialog.Close aria-label={t('sluiten')} className={cn(navKnop, 'ml-2')}>
                            <X className='size-4' />
                        </Dialog.Close>
                    </div>
                </div>

                <div className='grid gap-4 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-5 xl:grid-cols-2 xl:items-start'>
                    {/* Start: the sum, ending in the total. */}
                    <Paneel
                        titel={t('startinvestering')}
                        meta={
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                    BAND_PILL[b]
                                )}>
                                {t('terugIn', { x: maanden(zaak.terugverdientijd) })}
                            </span>
                        }
                        voet={
                            <>
                                <span>{t('totaalNodig')}</span>
                                <span className='readout text-[var(--brand-ink)]'>{geld(zaak.startkapitaal)}</span>
                            </>
                        }>
                        <div className='divide-y divide-stone-100'>
                            <Rij label={t('overname')} waarde={geld(zaak.overname)} />
                            <Rij label={t('borg')} waarde={geldKosten(zaak.borg)} />
                            <Rij label={t('huurVooruit')} waarde={geldKosten(zaak.huurVooruit)} />
                            <Rij label={t('eenmalig')} waarde={geld(zaak.eenmalig)} sterk />
                            <Rij label={t('buffer')} hint={t('bufferHint')} waarde={geld(buffer)} />
                        </div>
                    </Paneel>

                    {/* Month: the full sum, costs broken down the way the sheet adds them up. Spans both rows. */}
                    <div className='xl:row-span-2'>
                        <Paneel
                            titel={t('elkeMaand')}
                            meta={<span className='text-muted-foreground text-xs'>{t('formule')}</span>}
                            voet={
                                winst !== null && (
                                    <>
                                        <span>
                                            {t('winst')}{' '}
                                            {marge !== null && (
                                                <span className='text-muted-foreground font-normal'>
                                                    · {t('marge', { x: marge })}
                                                </span>
                                            )}
                                        </span>
                                        <span className='readout text-emerald-700'>{geld(winst)}</span>
                                    </>
                                )
                            }>
                            {omzet === null || winst === null ? (
                                <p className='text-muted-foreground py-2 text-sm'>{t('nogGeenOmzet')}</p>
                            ) : (
                                <div>
                                    <StaafRij label={t('omzet')} waarde={omzet} max={omzet} />
                                    {/* Where the turnover comes from: the expected customers a day. */}
                                    {verwacht !== null &&
                                        zaak.bestedingPerKlant !== null &&
                                        zaak.openDagen !== null && (
                                            <p className='text-muted-foreground -mt-1 pb-1.5 pl-3 text-[12px]'>
                                                <span className='text-foreground font-medium'>
                                                    {getal(verwacht)} {t('perDag', { e: eenheid })}
                                                </span>{' '}
                                                {t('omzetUitleg', {
                                                    besteding: geld(zaak.bestedingPerKlant),
                                                    dagen: zaak.openDagen
                                                })}
                                            </p>
                                        )}

                                    <div className='border-y border-stone-100 py-1.5'>
                                        {lasten !== null && (
                                            <StaafRij label={t('lasten')} waarde={lasten} max={omzet} min sterk />
                                        )}

                                        {/* Stock: a share of turnover, with what it is made of. */}
                                        {inkoop !== null && (
                                            <>
                                                <StaafRij
                                                    label={
                                                        zaak.inkoopPct !== null
                                                            ? `${t('inkoop')} · ${getal(zaak.inkoopPct)}%`
                                                            : t('inkoop')
                                                    }
                                                    waarde={inkoop}
                                                    max={omzet}
                                                    sub
                                                />
                                                {zaak.inkoopDelen.map((d) => (
                                                    <Deel
                                                        key={d.label}
                                                        label={woord(d.label)}
                                                        hint={`${getal(d.pct)}%`}
                                                        waarde={geld((omzet * d.pct) / 100)}
                                                    />
                                                ))}
                                            </>
                                        )}

                                        {/* Fixed costs: rent, wage, utilities, other. */}
                                        {vast ? (
                                            vast.map((v) => (
                                                <StaafRij
                                                    key={v.label}
                                                    label={v.label}
                                                    waarde={v.waarde}
                                                    max={omzet}
                                                    sub
                                                />
                                            ))
                                        ) : zaak.vasteKosten !== null ? (
                                            <StaafRij
                                                label={t('huurLoonNuts')}
                                                waarde={zaak.vasteKosten}
                                                max={omzet}
                                                sub
                                            />
                                        ) : null}
                                    </div>

                                    <StaafRij label={t('winst')} waarde={winst} max={omzet} accent />
                                </div>
                            )}
                        </Paneel>
                    </div>

                    {/* Per day: break-even against expected. */}
                    <Paneel
                        titel={t('klantenPerDag')}
                        meta={<span className='text-muted-foreground text-xs'>{eenheid}</span>}>
                        {quitte === null ? (
                            <p className='text-muted-foreground py-2 text-sm'>{t('nogNiet')}</p>
                        ) : (
                            <div className='py-1.5'>
                                <div className='flex items-end justify-between gap-4'>
                                    <div>
                                        <p className='readout text-2xl leading-none font-semibold'>{getal(quitte)}</p>
                                        <p className='text-muted-foreground mt-1 text-xs'>{t('quitte')}</p>
                                    </div>
                                    {verwacht !== null && (
                                        <div className='text-right'>
                                            <p className='readout text-2xl leading-none font-semibold text-[var(--brand-ink)]'>
                                                {getal(verwacht)}
                                            </p>
                                            <p className='text-muted-foreground mt-1 text-xs'>{t('verwacht')}</p>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className='relative mt-3 h-2.5 rounded-full bg-stone-100'
                                    role='img'
                                    aria-label={`${t('quitte')} ${getal(quitte)}, ${t('verwacht')} ${getal(verwacht)}`}>
                                    {verwacht !== null && (
                                        <div
                                            className='absolute inset-y-0 left-0 rounded-full bg-[var(--brand)]'
                                            style={{ width: pct(verwacht) }}
                                        />
                                    )}
                                    <div
                                        className='absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-stone-900 ring-2 ring-white'
                                        style={{ left: pct(quitte) }}
                                    />
                                </div>
                                <div className='mt-4 grid grid-cols-3 divide-x border-t pt-3'>
                                    <Mini
                                        label={t('perEenheid', { e: enkel(zaak.eenheid) })}
                                        waarde={geld(zaak.bestedingPerKlant)}
                                    />
                                    <Mini label={t('omzetQuitte')} waarde={geld(zaak.breakEvenOmzetDag)} />
                                    <Mini
                                        label={t('bovenQuitte')}
                                        waarde={boven === null ? t('onbekend') : `+${boven}%`}
                                    />
                                </div>
                            </div>
                        )}
                    </Paneel>
                </div>

                {/* Phones: previous/next at the bottom of the scroll. */}
                <div className='flex items-center justify-between gap-2 px-4 pb-4 lg:hidden'>
                    <button
                        type='button'
                        onClick={onVorige}
                        disabled={!onVorige}
                        className='btn-key inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium disabled:opacity-40'>
                        <ChevronLeft className='size-4' /> {t('vorige')}
                    </button>
                    {positie && totaal ? (
                        <span className='readout text-muted-foreground text-xs'>
                            {positie} / {totaal}
                        </span>
                    ) : null}
                    <button
                        type='button'
                        onClick={onVolgende}
                        disabled={!onVolgende}
                        className='btn-key inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium disabled:opacity-40'>
                        {t('volgende')} <ChevronRight className='size-4' />
                    </button>
                </div>
            </div>
        </div>
    );
}
