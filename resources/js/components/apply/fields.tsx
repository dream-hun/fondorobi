import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/types';

export function Field({
    id,
    label,
    hint,
    error,
    optional = false,
    children,
}: {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="leading-snug">
                {label}
                {optional && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        (si ngombwa)
                    </span>
                )}
            </Label>
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            {children}
            <InputError message={error} />
        </div>
    );
}

export function YesNoField({
    id,
    label,
    hint,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    hint?: string;
    value: boolean | null;
    onChange: (value: boolean) => void;
    error?: string;
}) {
    return (
        <fieldset className="grid gap-2" aria-invalid={!!error}>
            <legend id={id} className="mb-2 text-sm leading-snug font-medium">
                {label}
            </legend>
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            <div
                role="radiogroup"
                aria-labelledby={id}
                className="grid grid-cols-2 gap-3 sm:max-w-xs"
            >
                {[
                    { answer: true, text: 'Yego' },
                    { answer: false, text: 'Oya' },
                ].map(({ answer, text }) => (
                    <button
                        key={text}
                        type="button"
                        role="radio"
                        aria-checked={value === answer}
                        onClick={() => onChange(answer)}
                        className={cn(
                            'h-11 rounded-md border text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            value === answer
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-background hover:bg-accent',
                            error && value === null && 'border-destructive',
                        )}
                    >
                        {text}
                    </button>
                ))}
            </div>
            <InputError message={error} />
        </fieldset>
    );
}

export function ChoiceField({
    id,
    label,
    options,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <fieldset className="grid gap-2">
            <legend id={id} className="mb-2 text-sm leading-snug font-medium">
                {label}
            </legend>
            <div
                role="radiogroup"
                aria-labelledby={id}
                className="grid gap-2 sm:grid-cols-2"
            >
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'flex h-11 items-center rounded-md border px-4 text-left text-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            value === option.value
                                ? 'border-primary bg-primary/10 font-medium'
                                : 'border-input bg-background hover:bg-accent',
                            error && !value && 'border-destructive',
                        )}
                    >
                        <span
                            className={cn(
                                'mr-3 size-4 shrink-0 rounded-full border',
                                value === option.value
                                    ? 'border-4 border-primary'
                                    : 'border-input',
                            )}
                        />
                        {option.label}
                    </button>
                ))}
            </div>
            <InputError message={error} />
        </fieldset>
    );
}

export function SelectField({
    id,
    label,
    placeholder = 'Hitamo',
    options,
    value,
    onChange,
    error,
    disabled = false,
}: {
    id: string;
    label: string;
    placeholder?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <Field id={id} label={label} error={error}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger
                    id={id}
                    className="h-10 w-full"
                    aria-invalid={!!error}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}
