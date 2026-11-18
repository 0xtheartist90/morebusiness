'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { SHEET_TAG } from '@/lib/zaken';

/** Drops the cached sheet, so the next render reads the Google Sheet again (the refresh button). */
export async function vernieuwSheet() {
    revalidateTag(SHEET_TAG);
    revalidatePath('/');
}
