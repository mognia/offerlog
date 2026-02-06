"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function toTimeValue(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function setTimeOnDate(date: Date, time: string) {
    const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
    const d = new Date(date);
    d.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
    return d;
}

export function DateTimePicker({
                                   value,
                                   onChange,
                                   placeholder = "Pick date",
                                   disabled,
                               }: {
    value: Date | null;
    onChange: (v: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    // We use useMemo to ensure toTimeValue only runs when the 'value' changes.
    const timeValue = useMemo(() => (value ? toTimeValue(value) : "09:00"), [value]);

    return (
        <div className="grid grid-cols-[1fr_110px] gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="justify-start font-normal"
                        disabled={disabled}
                        type="button"
                    >
                        {value ? format(value, "PPP") : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value ?? undefined}
                        onSelect={(d) => {
                            if (!d) return onChange(null);
                            // We use the derived timeValue to maintain continuity
                            const next = setTimeOnDate(d, timeValue);
                            onChange(next);
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Input
                type="time"
                value={timeValue}
                onChange={(e) => {
                    const t = e.target.value;
                    if (value) {
                        onChange(setTimeOnDate(value, t));
                    }
                }}
                disabled={disabled || !value}
            />
        </div>
    );
}