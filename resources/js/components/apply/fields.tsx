import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

/**
 * Radio options rendered as tappable cards, built on the shadcn RadioGroup.
 */
function RadioCards({
    id,
    label,
    hint,
    options,
    value,
    onChange,
    error,
    className,
}: {
    id: string;
    label: string;
    hint?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}) {
    return (
        <fieldset className="grid gap-2">
            <legend id={id} className="mb-2 text-sm leading-snug font-medium">
                {label}
            </legend>
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            <RadioGroup
                value={value}
                onValueChange={onChange}
                aria-labelledby={id}
                aria-invalid={!!error}
                className={className}
            >
                {options.map((option) => {
                    const optionId = `${id}-${option.value}`;

                    return (
                        <Label
                            key={option.value}
                            htmlFor={optionId}
                            className={cn(
                                'flex h-11 cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-4 font-normal transition-colors hover:bg-accent has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/10 has-data-[state=checked]:font-medium',
                                error && !value && 'border-destructive',
                            )}
                        >
                            <RadioGroupItem
                                id={optionId}
                                value={option.value}
                                aria-invalid={!!error && !value}
                            />
                            {option.label}
                        </Label>
                    );
                })}
            </RadioGroup>
            <InputError message={error} />
        </fieldset>
    );
}

const yesNoOptions: SelectOption[] = [
    { value: 'yes', label: 'Yego' },
    { value: 'no', label: 'Oya' },
];

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
        <RadioCards
            id={id}
            label={label}
            hint={hint}
            options={yesNoOptions}
            value={value === null ? '' : value ? 'yes' : 'no'}
            onChange={(answer) => onChange(answer === 'yes')}
            error={error}
            className="grid-cols-2 sm:max-w-xs"
        />
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
        <RadioCards
            id={id}
            label={label}
            options={options}
            value={value}
            onChange={onChange}
            error={error}
            className="gap-2 sm:grid-cols-2"
        />
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
