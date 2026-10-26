import { Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatRwf } from '@/lib/utils';
import type { BudgetItem } from '@/types';

export function budgetTotal(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export default function BudgetTable({
    items,
    grantAmount,
    errors,
    onChange,
}: {
    items: BudgetItem[];
    grantAmount: number;
    errors: Record<string, string | undefined>;
    onChange: (items: BudgetItem[]) => void;
}) {
    const total = budgetTotal(items);
    const remaining = grantAmount - total;

    const updateItem = (
        index: number,
        field: keyof BudgetItem,
        value: string,
    ) => {
        onChange(
            items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    return (
        <div className="grid gap-3">
            <div className="hidden grid-cols-[1fr_8rem_10rem_2.5rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span>Igikorwa / Ikintu kizagurwa</span>
                <span>Ingano</span>
                <span>Amafaranga (RWF)</span>
                <span className="sr-only">Siba</span>
            </div>

            {items.map((item, index) => (
                <div
                    key={index}
                    className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_8rem_10rem_2.5rem] sm:items-start sm:border-0 sm:p-0"
                >
                    <div className="grid gap-1">
                        <label
                            htmlFor={`budget-${index}-description`}
                            className="text-xs text-muted-foreground sm:sr-only"
                        >
                            Igikorwa / Ikintu kizagurwa
                        </label>
                        <Input
                            id={`budget-${index}-description`}
                            value={item.description}
                            onChange={(e) =>
                                updateItem(index, 'description', e.target.value)
                            }
                            placeholder="Urugero: Imashini idoda"
                            aria-invalid={
                                !!errors[`budget_items.${index}.description`]
                            }
                        />
                        <InputError
                            message={
                                errors[`budget_items.${index}.description`]
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <label
                            htmlFor={`budget-${index}-quantity`}
                            className="text-xs text-muted-foreground sm:sr-only"
                        >
                            Ingano
                        </label>
                        <Input
                            id={`budget-${index}-quantity`}
                            value={item.quantity}
                            onChange={(e) =>
                                updateItem(index, 'quantity', e.target.value)
                            }
                            placeholder="Urugero: 2"
                            aria-invalid={
                                !!errors[`budget_items.${index}.quantity`]
                            }
                        />
                        <InputError
                            message={errors[`budget_items.${index}.quantity`]}
                        />
                    </div>
                    <div className="grid gap-1">
                        <label
                            htmlFor={`budget-${index}-amount`}
                            className="text-xs text-muted-foreground sm:sr-only"
                        >
                            Amafaranga (RWF)
                        </label>
                        <Input
                            id={`budget-${index}-amount`}
                            inputMode="numeric"
                            value={item.amount}
                            onChange={(e) =>
                                updateItem(
                                    index,
                                    'amount',
                                    e.target.value.replace(/\D/g, ''),
                                )
                            }
                            placeholder="0"
                            aria-invalid={
                                !!errors[`budget_items.${index}.amount`]
                            }
                        />
                        <InputError
                            message={errors[`budget_items.${index}.amount`]}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="justify-self-end"
                        disabled={items.length === 1}
                        onClick={() =>
                            onChange(items.filter((_, i) => i !== index))
                        }
                        aria-label="Siba uyu murongo"
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                disabled={items.length >= 20}
                onClick={() =>
                    onChange([
                        ...items,
                        { description: '', quantity: '', amount: '' },
                    ])
                }
            >
                <Plus />
                Ongeraho umurongo
            </Button>

            <div className="grid gap-1 rounded-lg bg-muted p-4 text-sm">
                <div className="flex justify-between font-semibold">
                    <span>IGITERANYO</span>
                    <span
                        className={cn(
                            'whitespace-nowrap',
                            remaining < 0 && 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {formatRwf(total)}
                    </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>
                        {remaining >= 0
                            ? 'Amafaranga asigaye'
                            : 'Warengeje amafaranga y’inkunga'}
                    </span>
                    <span className="whitespace-nowrap">
                        {formatRwf(Math.abs(remaining))}
                    </span>
                </div>
            </div>
            <InputError message={errors.budget_items} />
        </div>
    );
}
