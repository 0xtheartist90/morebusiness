'use client';

import type { ReactNode } from 'react';

import { BAND_DOT, BAND_PILL, Foto, HartKnop, cijfers } from '@/components/dashboard/zaak-card';
import { getal, kosten, maanden, telHref, thb } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Zaak, band, enkelvoud } from '@/lib/zaak-types';
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
    return (
        <div className='flex h-8 items-center justify-between gap-3 text-[13.5px]'>
            <span className={cn('truncate', sterk ? 'font-semibold' : 'text-stone-600')}>
                {label}
                {hint && <span className='text-muted-foreground font-normal'> · {hint}</span>}
            </span>
            <span
                className={cn('readout shrink-0', sterk && 'font-semibold', waarde === 'onbekend' && 'text-stone-400')}>
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
    min
}: {
    label: string;
    waarde: number;
    max: number;
    accent?: boolean;
    min?: boolean;
}) {
    return (
        <div className='grid h-8 grid-cols-[8.25rem_1fr_5.5rem] items-center gap-3 text-[13.5px]'>
            <span className={cn('truncate', accent ? 'font-semibold' : 'text-stone-600')}>{label}</span>
            <div className='h-1.5 rounded-full bg-stone-100'>
                <div
                    className={cn('h-full rounded-full', accent ? 'bg-[var(--brand)]' : 'bg-stone-300')}
                    style={{ width: `${Math.max(2, Math.min(100, (waarde / max) * 100))}%` }}
                />
            </div>
            <span className={cn('readout text-right', accent && 'font-semibold')}>
                {min ? '− ' : ''}
                {thb(waarde)}
            </span>
        </div>
    );
}

/** A small number in a row of three, under the customer meter. */
function Mini({ label, waarde }: { label: string; waarde: string }) {
    return (
        <div className='min-w-0 px-3 first:pl-0 last:pr-0'>
            <p className='text-muted-foreground text-[11.5px] leading-tight'>{label}</p>
            <p
                className={cn(
                    'readout mt-0.5 truncate text-[14px] font-semibold',
                    waarde === 'onbekend' && 'font-normal text-stone-400'
                )}>
                {waarde}
            </p>
        </div>
    );
}

function Kpi({ label, children, accent }: { label: string; children: ReactNode; accent?: boolean }) {
    return (
        <div
            className={cn(
                'min-w-0 rounded-xl border px-3.5 py-3',
                accent ? 'border-[#f3e2d4] bg-[linear-gradient(180deg,#fff,#fff7f0)]' : 'bg-white'
            )}>
            <p className='text-muted-foreground truncate text-[11.5px]'>{label}</p>
            <div className='readout mt-1 truncate text-lg leading-tight font-semibold'>{children}</div>
        </div>
    );
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
    const b = band(zaak.terugverdientijd);
    const { omzet, winst, lasten, inkoop, buffer, marge } = cijfers(zaak);
    const tel = telHref(zaak.telefoon);
    const quitte = zaak.klantenNodig;
    const verwacht = zaak.verwachtKlanten;
    const meterMax = Math.max(quitte ?? 0, verwacht ?? 0) * 1.25 || 1;
    const pct = (n: number) => `${Math.min(100, (n / meterMax) * 100)}%`;
    const boven = verwacht !== null && quitte ? Math.round((verwacht / quitte - 1) * 100) : null;
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
                                    Nieuw
                                </span>
                            )}
                        </div>
                        <div className='flex items-center gap-1.5'>
                            <HartKnop zaak={zaak} favoriet={favoriet} onFavoriet={onFavoriet} />
                            <Dialog.Close aria-label='Sluiten' className={cn(ronde, 'lg:hidden')}>
                                <X className='size-4' />
                            </Dialog.Close>
                        </div>
                    </div>
                </div>

                <div className='flex flex-1 flex-col gap-4 p-4 lg:min-h-0 lg:overflow-y-auto lg:p-5'>
                    <header>
                        <p className='text-muted-foreground flex items-center gap-1.5 text-[13px]'>
                            <span className='font-medium text-[var(--brand-ink)]'>{zaak.type}</span>
                            <span aria-hidden>·</span>
                            <MapPin className='size-3.5 shrink-0' />
                            <span className='truncate'>{zaak.locatie ?? 'locatie onbekend'}</span>
                        </p>
                        <Dialog.Title className='mt-1 text-xl leading-snug font-semibold'>{zaak.naam}</Dialog.Title>
                        <Dialog.Description className='sr-only'>
                            Startinvestering, maandcijfers en klanten per dag van {zaak.naam}.
                        </Dialog.Description>
                    </header>

                    <div className='grid grid-cols-2 gap-2'>
                        <Kpi label='Startinvestering' accent>
                            <span
                                className={
                                    zaak.startkapitaal === null ? 'text-muted-foreground font-normal' : 'text-glow'
                                }>
                                {thb(zaak.startkapitaal)}
                            </span>
                        </Kpi>
                        <Kpi label='Winst / maand'>
                            {winst === null ? (
                                <span className='text-muted-foreground font-normal'>onbekend</span>
                            ) : (
                                thb(winst)
                            )}
                        </Kpi>
                        <Kpi label='Terugverdiend in'>
                            <span className='flex items-center gap-2'>
                                <span className={cn('size-2.5 rounded-full', BAND_DOT[b])} aria-hidden />
                                {maanden(zaak.terugverdientijd)}
                            </span>
                        </Kpi>
                        <Kpi label='Quitte bij'>
                            {quitte === null ? (
                                <span className='text-muted-foreground font-normal'>onbekend</span>
                            ) : (
                                <>
                                    {getal(quitte)}{' '}
                                    <span className='text-muted-foreground text-sm font-normal'>
                                        {zaak.eenheid}/dag
                                    </span>
                                </>
                            )}
                        </Kpi>
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
                                Bekijk advertentie
                                <ExternalLink className='size-3.5' />
                            </a>
                        ) : (
                            <span className='inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-50 px-4 text-sm text-stone-400'>
                                Geen advertentie
                            </span>
                        )}
                        {tel && (
                            <a
                                href={tel}
                                title={zaak.telefoon ?? undefined}
                                className='btn-key inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium'>
                                <Phone className='size-4 text-[var(--brand)]' />
                                Bel
                            </a>
                        )}
                    </div>
                </div>
            </aside>

            {/* Right pane: four equal panels. */}
            <div className='flex min-w-0 flex-1 flex-col lg:min-h-0'>
                <div className='hidden h-14 shrink-0 items-center justify-between gap-3 border-b bg-white px-5 lg:flex'>
                    <p className='readout text-muted-foreground text-[13px]'>
                        {positie && totaal ? (
                            <>
                                Zaak <span className='text-foreground font-semibold'>{positie}</span> van {totaal}
                            </>
                        ) : null}
                    </p>
                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            onClick={onVorige}
                            disabled={!onVorige}
                            aria-label='Vorige zaak'
                            title='Vorige (←)'
                            className={navKnop}>
                            <ChevronLeft className='size-4' />
                        </button>
                        <button
                            type='button'
                            onClick={onVolgende}
                            disabled={!onVolgende}
                            aria-label='Volgende zaak'
                            title='Volgende (→)'
                            className={navKnop}>
                            <ChevronRight className='size-4' />
                        </button>
                        <Dialog.Close aria-label='Sluiten' className={cn(navKnop, 'ml-2')}>
                            <X className='size-4' />
                        </Dialog.Close>
                    </div>
                </div>

                <div className='grid auto-rows-fr gap-4 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-5 xl:grid-cols-2'>
                    {/* Start: the sum, ending in the total. */}
                    <Paneel
                        titel='Startinvestering'
                        meta={
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                    BAND_PILL[b]
                                )}>
                                terug in {maanden(zaak.terugverdientijd)}
                            </span>
                        }
                        voet={
                            <>
                                <span>Totaal nodig</span>
                                <span className='readout text-[var(--brand-ink)]'>{thb(zaak.startkapitaal)}</span>
                            </>
                        }>
                        <div className='divide-y divide-stone-100'>
                            <Rij label='Overname' waarde={thb(zaak.overname)} />
                            <Rij label='Borg' waarde={kosten(zaak.borg)} />
                            <Rij label='Huur vooruit' waarde={kosten(zaak.huurVooruit)} />
                            <Rij label='Eenmalig' waarde={thb(zaak.eenmalig)} sterk />
                            <Rij label='Buffer' hint='1 maand lasten' waarde={thb(buffer)} />
                        </div>
                    </Paneel>

                    {/* Month: one scale, only profit in orange. */}
                    <Paneel
                        titel='Elke maand'
                        meta={<span className='text-muted-foreground text-xs'>lasten {thb(lasten)}</span>}
                        voet={
                            winst !== null && (
                                <>
                                    <span>
                                        Winst{' '}
                                        {marge !== null && (
                                            <span className='text-muted-foreground font-normal'>· marge {marge}%</span>
                                        )}
                                    </span>
                                    <span className='readout text-[var(--brand-ink)]'>{thb(winst)}</span>
                                </>
                            )
                        }>
                        {omzet === null || winst === null ? (
                            <p className='text-muted-foreground py-2 text-sm'>Omzet en winst nog niet berekend.</p>
                        ) : (
                            <div className='divide-y divide-stone-100'>
                                <StaafRij label='Omzet' waarde={omzet} max={omzet} />
                                {inkoop !== null && <StaafRij label='Inkoop' waarde={inkoop} max={omzet} min />}
                                {zaak.vasteKosten !== null && (
                                    <StaafRij label='Huur, loon, nuts' waarde={zaak.vasteKosten} max={omzet} min />
                                )}
                                <StaafRij label='Winst' waarde={winst} max={omzet} accent />
                            </div>
                        )}
                    </Paneel>

                    {/* Per day: break-even against expected. */}
                    <Paneel
                        titel='Klanten per dag'
                        meta={<span className='text-muted-foreground text-xs'>{zaak.eenheid}</span>}>
                        {quitte === null ? (
                            <p className='text-muted-foreground py-2 text-sm'>Nog niet berekend.</p>
                        ) : (
                            <div className='py-1.5'>
                                <div className='flex items-end justify-between gap-4'>
                                    <div>
                                        <p className='readout text-2xl leading-none font-semibold'>{getal(quitte)}</p>
                                        <p className='text-muted-foreground mt-1 text-xs'>quitte</p>
                                    </div>
                                    {verwacht !== null && (
                                        <div className='text-right'>
                                            <p className='readout text-2xl leading-none font-semibold text-[var(--brand-ink)]'>
                                                {getal(verwacht)}
                                            </p>
                                            <p className='text-muted-foreground mt-1 text-xs'>verwacht</p>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className='relative mt-3 h-2.5 rounded-full bg-stone-100'
                                    role='img'
                                    aria-label={`Quitte ${getal(quitte)}, verwacht ${verwacht === null ? 'onbekend' : getal(verwacht)} per dag`}>
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
                                        label={`Per ${enkelvoud(zaak.eenheid)}`}
                                        waarde={thb(zaak.bestedingPerKlant)}
                                    />
                                    <Mini label='Omzet quitte' waarde={thb(zaak.breakEvenOmzetDag)} />
                                    <Mini label='Boven quitte' waarde={boven === null ? 'onbekend' : `+${boven}%`} />
                                </div>
                            </div>
                        )}
                    </Paneel>

                    {/* Details. */}
                    <Paneel
                        titel='Details'
                        meta={
                            <span className='text-muted-foreground text-xs'>
                                {zaak.bron === 'FB' ? 'Facebook' : zaak.bron}
                            </span>
                        }>
                        <div className='divide-y divide-stone-100'>
                            <Rij label='Huur / maand' waarde={thb(zaak.huur)} />
                            <Rij label='Vaste kosten / mnd' waarde={thb(zaak.vasteKosten)} />
                            <Rij label='Telefoon' waarde={zaak.telefoon ?? 'onbekend'} />
                            <Rij
                                label='Verwacht / dag'
                                waarde={verwacht === null ? 'onbekend' : `${getal(verwacht)} ${zaak.eenheid}`}
                            />
                        </div>
                    </Paneel>
                </div>

                {/* Phones: previous/next at the bottom of the scroll. */}
                <div className='flex items-center justify-between gap-2 px-4 pb-4 lg:hidden'>
                    <button
                        type='button'
                        onClick={onVorige}
                        disabled={!onVorige}
                        className='btn-key inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium disabled:opacity-40'>
                        <ChevronLeft className='size-4' /> Vorige
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
                        Volgende <ChevronRight className='size-4' />
                    </button>
                </div>
            </div>
        </div>
    );
}
