import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const kinyarwandaMonths = [
    'Mutarama',
    'Gashyantare',
    'Werurwe',
    'Mata',
    'Gicurasi',
    'Kamena',
    'Nyakanga',
    'Kanama',
    'Nzeri',
    'Ukwakira',
    'Ugushyingo',
    'Ukuboza',
];

/**
 * Format an amount of Rwandan francs the local way, e.g. "5.000.000 RWF".
 */
export function formatRwf(amount: number): string {
    return `${Math.round(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} RWF`;
}

/**
 * Format a YYYY-MM-DD date in Kinyarwanda, e.g. "30 Ukwakira 2026".
 */
export function formatKinyarwandaDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);

    return `${day} ${kinyarwandaMonths[month - 1]} ${year}`;
}
