'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { vernieuwSheet } from '@/app/actions';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { RefreshCw } from 'lucide-react';

/** Reads the Google Sheet again right away, instead of waiting for the 5-minute refresh. */
export function VernieuwKnop({ className }: { className?: string }) {
    const router = useRouter();
    const [bezig, start] = useTransition();
    const { t } = useT();

    return (
        <button
            type='button'
            disabled={bezig}
            onClick={() =>
                start(async () => {
                    await vernieuwSheet();
                    router.refresh();
                })
            }
            title={t('vernieuwTitel')}
            className={cn(
                'btn-key inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium disabled:opacity-70',
                className
            )}>
            <RefreshCw className={cn('size-4 text-[var(--brand-ink)]', bezig && 'animate-spin')} />
            {bezig ? t('bezig') : t('vernieuwen')}
        </button>
    );
}
