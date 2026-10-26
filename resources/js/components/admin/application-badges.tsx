import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus, Qualification } from '@/types';

export const qualificationStyles: Record<Qualification, string> = {
    high: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    medium: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    low: 'border-transparent bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    not_eligible:
        'border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const statusStyles: Record<ApplicationStatus, string> = {
    pending: '',
    shortlisted:
        'border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300',
    rejected:
        'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300',
    approved:
        'border-green-300 text-green-700 dark:border-green-800 dark:text-green-300',
};

export function QualificationBadge({
    value,
    label,
}: {
    value: Qualification;
    label: string;
}) {
    return <Badge className={qualificationStyles[value]}>{label}</Badge>;
}

export function StatusBadge({
    value,
    label,
}: {
    value: ApplicationStatus;
    label: string;
}) {
    return (
        <Badge variant="outline" className={cn(statusStyles[value])}>
            {label}
        </Badge>
    );
}
