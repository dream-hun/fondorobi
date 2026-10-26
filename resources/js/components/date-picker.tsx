import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatKinyarwandaDate, kinyarwandaMonths } from '@/lib/utils';

const kinyarwandaWeekdays = ['Cyu', 'Mbe', 'Kab', 'Gtu', 'Kan', 'Gnu', 'Gnd'];

/**
 * Parse a YYYY-MM-DD string as a local date (avoids UTC day shifts).
 */
function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export default function DatePicker({
    id,
    value,
    onChange,
    min,
    max,
    placeholder = 'Hitamo itariki',
    invalid = false,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    min?: Date;
    max?: Date;
    placeholder?: string;
    invalid?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = value ? parseIsoDate(value) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    aria-invalid={invalid}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                    )}
                >
                    {value ? formatKinyarwandaDate(value) : placeholder}
                    <CalendarIcon className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
            >
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selected}
                    defaultMonth={selected ?? max}
                    startMonth={min}
                    endMonth={max}
                    disabled={[
                        ...(min ? [{ before: min }] : []),
                        ...(max ? [{ after: max }] : []),
                    ]}
                    formatters={{
                        formatMonthDropdown: (date) =>
                            kinyarwandaMonths[date.getMonth()],
                        formatWeekdayName: (date) =>
                            kinyarwandaWeekdays[date.getDay()],
                    }}
                    onSelect={(date) => {
                        if (date) {
                            onChange(toIsoDate(date));
                            setOpen(false);
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
