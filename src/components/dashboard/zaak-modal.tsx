'use client';

import type { ReactNode } from 'react';

import { BAND_DOT, BAND_PILL, Foto, HartKnop, cijfers } from '@/components/dashboard/zaak-card';
import { getal, kosten, maanden, telHref, thb } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Zaak, band, enkelvoud } from '@/lib/zaak-types';
import * as Dialog from '@radix-ui/react-dialog';

import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Phone, X } from 'lucide-react';

/** A section of the pop-up: a small lowercase heading, then its content. */
function Blok({
    titel,
    rechts,
    children,
    className
}: {
    titel: string;
    rechts?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-xl border bg-white p-4', className)}>
            <div className='flex items-center justify-between gap-2'>
                <h3 className='label-hud'>{titel}</h3>
                {rechts}
            </div>
            <div className='mt-3'>{children}</div>
        </section>
    );
}

/** One line of a sum: label, amount; `totaal` draws the line above it and makes it bold. */
function Som({
    label,
    hint,
    waarde,
    totaal,
    accent
}: {
    label: string;
    hint?: string;
    waarde: string;
    totaal?: boolean;
    accent?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-baseline justify-between gap-3 py-1 text-[13.5px]',
                totaal && 'mt-1 border-t pt-2 font-semibold'
            )}>
            <span className={cn(totaal ? 'text-foreground' : 'text-stone-600')}>
                {label}
                {hint && <span className='text-muted-foreground font-normal'> · {hint}</span>}
            </span>
            <span
                className={cn(
                    'readout',
                    accent && 'text-[var(--brand-ink)]',
                    waarde === 'onbekend' && 'font-normal opacity-50'
                )}>
                {waarde}
            </span>
        </div>
    );
}

/**
 * One bar per amount, all on the same scale (the turnover), so lengths compare directly. Only profit is orange; the
 * rest stays neutral, so the eye goes to what is left over.
 */
function Staaf({
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
        <div className='grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-[13px]'>
            <span className={cn('truncate', accent ? 'text-foreground font-semibold' : 'text-stone-600')}>{label}</span>
            <div className='h-2 rounded-full bg-stone-100'>
                <div
                    className={cn('h-full rounded-full', accent ? 'bg-[var(--brand)]' : 'bg-stone-300')}
                    style={{ width: `${Math.max(2, Math.min(100, (waarde / max) * 100))}%` }}
                />
            </div>
            <span
                className={cn(
                    'readout text-right',
                    accent ? 'font-semibold text-[var(--brand-ink)]' : 'text-stone-700'
                )}>
                {min ? '− ' : ''}
                {thb(waarde)}
            </span>
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
            <div className='readout mt-1 truncate text-lg leading-tight font-semibold sm:text-xl'>{children}</div>
        </div>
    );
}

export function ZaakModal({
    zaak,
    onClose,
    favoriet,
    onFavoriet,
    onVorige,
    onVolgende
}: {
    zaak: Zaak | null;
    onClose: () => void;
    favoriet: boolean;
    onFavoriet: () => void;
    onVorige?: () => void;
    onVolgende?: () => void;
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
                    className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-1.5rem)] w-[min(60rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--canvas)] shadow-[0_30px_80px_-20px_rgb(20_12_4/0.45)] focus:outline-none'>
                    {zaak && (
                        <Inhoud
                            zaak={zaak}
                            favoriet={favoriet}
                            onFavoriet={onFavoriet}
                            onVorige={onVorige}
                            onVolgende={onVolgende}
                        />
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function Inhoud({
    zaak,
    favoriet,
    onFavoriet,
    onVorige,
    onVolgende
}: {
    zaak: Zaak;
    favoriet: boolean;
    onFavoriet: () => void;
    onVorige?: () => void;
    onVolgende?: () => void;
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

    return (
        <>
            <div className='min-h-0 flex-1 overflow-y-auto'>
                {/* Photo with the controls on top. */}
                <div className='relative aspect-[21/8] max-h-72 w-full overflow-hidden bg-white'>
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
                            {onVorige && (
                                <button
                                    type='button'
                                    onClick={onVorige}
                                    aria-label='Vorige zaak'
                                    title='Vorige (←)'
                                    className={ronde}>
                                    <ChevronLeft className='size-4' />
                                </button>
                            )}
                            {onVolgende && (
                                <button
                                    type='button'
                                    onClick={onVolgende}
                                    aria-label='Volgende zaak'
                                    title='Volgende (→)'
                                    className={ronde}>
                                    <ChevronRight className='size-4' />
                                </button>
                            )}
                            <HartKnop zaak={zaak} favoriet={favoriet} onFavoriet={onFavoriet} />
                            <Dialog.Close aria-label='Sluiten' className={ronde}>
                                <X className='size-4' />
                            </Dialog.Close>
                        </div>
                    </div>
                </div>

                <div className='space-y-4 p-4 sm:p-6'>
                    <header>
                        <p className='text-muted-foreground flex items-center gap-1.5 text-[13px]'>
                            <span className='font-medium text-[var(--brand-ink)]'>{zaak.type}</span>
                            <span aria-hidden>·</span>
                            <MapPin className='size-3.5 shrink-0' />
                            <span className='truncate'>{zaak.locatie ?? 'locatie onbekend'}</span>
                        </p>
                        <Dialog.Title className='mt-1 text-xl leading-snug font-semibold sm:text-2xl'>
                            {zaak.naam}
                        </Dialog.Title>
                        <Dialog.Description className='sr-only'>
                            Startinvestering, maandcijfers en klanten per dag van {zaak.naam}.
                        </Dialog.Description>
                    </header>

                    {/* The four numbers to decide on. */}
                    <div className='grid grid-cols-2 gap-2.5 md:grid-cols-4'>
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

                    <div className='grid gap-4 md:grid-cols-2'>
                        {/* Start: the sum, one-off first, then the buffer. */}
                        <Blok
                            titel='startinvestering'
                            rechts={
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                        BAND_PILL[b]
                                    )}>
                                    terug in {maanden(zaak.terugverdientijd)}
                                </span>
                            }>
                            <Som label='Overname' waarde={thb(zaak.overname)} />
                            <Som label='Borg' waarde={kosten(zaak.borg)} />
                            <Som label='Huur vooruit' waarde={kosten(zaak.huurVooruit)} />
                            <Som label='Eenmalig' hint='kwijt bij de start' waarde={thb(zaak.eenmalig)} totaal />
                            <Som label='Buffer' hint='1 maand lasten' waarde={thb(buffer)} />
                            <Som label='Startinvestering' waarde={thb(zaak.startkapitaal)} totaal accent />
                            <p className='text-muted-foreground mt-2 text-xs leading-relaxed'>
                                De terugverdientijd rekent alleen het eenmalige deel terug; de buffer heb je achter de
                                hand.
                            </p>
                        </Blok>

                        {/* Every month: one scale, only profit in orange. */}
                        <Blok
                            titel='elke maand'
                            rechts={
                                marge !== null && (
                                    <span className='readout text-muted-foreground text-xs'>marge {marge}%</span>
                                )
                            }>
                            {omzet === null || winst === null ? (
                                <p className='text-muted-foreground text-sm'>Omzet en winst nog niet berekend.</p>
                            ) : (
                                <div className='space-y-2.5'>
                                    <Staaf label='Omzet' waarde={omzet} max={omzet} />
                                    {inkoop !== null && <Staaf label='Inkoop' waarde={inkoop} max={omzet} min />}
                                    {zaak.vasteKosten !== null && (
                                        <Staaf label='Huur, loon, nuts' waarde={zaak.vasteKosten} max={omzet} min />
                                    )}
                                    <Staaf label='Winst' waarde={winst} max={omzet} accent />
                                    <p className='text-muted-foreground pt-1 text-xs leading-relaxed'>
                                        Lasten samen {thb(lasten)} per maand. Elke maand hetzelfde; de eenmalige kosten
                                        zitten hier niet in.
                                    </p>
                                </div>
                            )}
                        </Blok>
                    </div>

                    {/* Per day: break-even against expected. */}
                    {quitte !== null && (
                        <Blok titel='klanten per dag'>
                            <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
                                <div>
                                    <p className='readout text-2xl leading-none font-semibold'>
                                        {getal(quitte)}{' '}
                                        <span className='text-muted-foreground text-sm font-normal'>
                                            {zaak.eenheid}
                                        </span>
                                    </p>
                                    <p className='text-muted-foreground mt-1 text-xs'>
                                        nodig om quitte te spelen (lasten gedekt)
                                    </p>
                                </div>
                                {verwacht !== null && (
                                    <div className='text-right'>
                                        <p className='readout text-2xl leading-none font-semibold text-[var(--brand-ink)]'>
                                            {getal(verwacht)}{' '}
                                            <span className='text-muted-foreground text-sm font-normal'>
                                                {zaak.eenheid}
                                            </span>
                                        </p>
                                        <p className='text-muted-foreground mt-1 text-xs'>
                                            verwacht · hiermee is de winst gerekend
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div
                                className='relative mt-4 h-3 rounded-full bg-stone-100'
                                role='img'
                                aria-label={`Quitte ${getal(quitte)}, verwacht ${verwacht === null ? 'onbekend' : getal(verwacht)} per dag`}>
                                {verwacht !== null && (
                                    <div
                                        className='absolute inset-y-0 left-0 rounded-full bg-[var(--brand)]'
                                        style={{ width: pct(verwacht) }}
                                    />
                                )}
                                <div
                                    className='absolute -inset-y-1.5 w-[3px] -translate-x-1/2 rounded-full bg-stone-900 ring-2 ring-white'
                                    style={{ left: pct(quitte) }}
                                />
                            </div>
                            <p className='text-muted-foreground mt-3 text-[13px]'>
                                {zaak.bestedingPerKlant !== null && (
                                    <>
                                        Elke {enkelvoud(zaak.eenheid)} besteedt gemiddeld{' '}
                                        <span className='readout text-foreground font-medium'>
                                            {thb(zaak.bestedingPerKlant)}
                                        </span>
                                        .{' '}
                                    </>
                                )}
                                {boven !== null && boven > 0 && <>De verwachting ligt {boven}% boven quitte.</>}
                                {zaak.breakEvenOmzetDag !== null && (
                                    <> Quitte = {thb(zaak.breakEvenOmzetDag)} omzet per dag.</>
                                )}
                            </p>
                        </Blok>
                    )}

                    {/* The rest: contact and the note from the ad. */}
                    <Blok titel='details'>
                        <dl className='grid gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-2'>
                            {(
                                [
                                    ['Huur / maand', thb(zaak.huur)],
                                    ['Vaste kosten / maand', thb(zaak.vasteKosten)],
                                    ['Telefoon', zaak.telefoon ?? 'onbekend'],
                                    ['Bron', zaak.bron === 'FB' ? 'Facebook' : zaak.bron]
                                ] as const
                            ).map(([k, v]) => (
                                <div key={k} className='flex justify-between gap-3'>
                                    <dt className='text-muted-foreground'>{k}</dt>
                                    <dd className={cn('readout text-right', v === 'onbekend' && 'opacity-50')}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                        {zaak.opmerking && (
                            <p className='mt-3 border-t pt-3 text-[13.5px] leading-relaxed text-stone-600'>
                                {zaak.opmerking}
                            </p>
                        )}
                    </Blok>
                </div>
            </div>

            {/* Actions, always in view. */}
            <div className='flex items-center gap-2 border-t bg-white px-4 py-3 sm:px-6'>
                {zaak.link ? (
                    <a
                        href={zaak.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='btn-primary inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm sm:flex-none'>
                        Bekijk advertentie
                        <ExternalLink className='size-3.5' />
                    </a>
                ) : (
                    <span className='inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-50 px-4 text-sm text-stone-400 sm:flex-none'>
                        Geen advertentie
                    </span>
                )}
                {tel && (
                    <a
                        href={tel}
                        className='btn-key inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium'>
                        <Phone className='size-4 text-[var(--brand)]' />
                        <span className='hidden sm:inline'>{zaak.telefoon}</span>
                        <span className='sm:hidden'>Bel</span>
                    </a>
                )}
            </div>
        </>
    );
}
