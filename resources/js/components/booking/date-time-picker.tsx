import { format, parse, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    'aria-invalid'?: boolean;
}

function toISOLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Pick date & time',
    id,
    'aria-invalid': ariaInvalid,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);

    const parsed = value
        ? parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
        : null;
    const selectedDate =
        parsed && !isNaN(parsed.getTime()) ? parsed : undefined;

    const hours = selectedDate
        ? String(selectedDate.getHours()).padStart(2, '0')
        : '14';
    const minutes = selectedDate
        ? String(selectedDate.getMinutes()).padStart(2, '0')
        : '00';

    function handleDateSelect(date: Date | undefined) {
        if (!date) return;

        const h = selectedDate ? selectedDate.getHours() : 14;
        const m = selectedDate ? selectedDate.getMinutes() : 0;
        const withTime = setMinutes(setHours(date, h), m);
        onChange(toISOLocal(withTime));
    }

    function handleTimeChange(type: 'hours' | 'minutes', val: string) {
        const num = parseInt(val, 10);
        if (isNaN(num)) return;

        const base = selectedDate ?? new Date();
        const updated =
            type === 'hours'
                ? setHours(base, Math.min(23, Math.max(0, num)))
                : setMinutes(base, Math.min(59, Math.max(0, num)));
        onChange(toISOLocal(updated));
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    aria-invalid={ariaInvalid}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {selectedDate
                        ? format(selectedDate, 'MMM d, yyyy  HH:mm')
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    showWeekNumber
                    weekStartsOn={1}
                    className="p-3"
                />
                <div className="border-t px-3 py-3">
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Time
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                            <Input
                                type="number"
                                min={0}
                                max={23}
                                value={hours}
                                onChange={(e) =>
                                    handleTimeChange('hours', e.target.value)
                                }
                                className="h-8 w-16 text-center tabular-nums"
                            />
                            <span className="text-muted-foreground">:</span>
                            <Input
                                type="number"
                                min={0}
                                max={59}
                                value={minutes}
                                onChange={(e) =>
                                    handleTimeChange('minutes', e.target.value)
                                }
                                className="h-8 w-16 text-center tabular-nums"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
