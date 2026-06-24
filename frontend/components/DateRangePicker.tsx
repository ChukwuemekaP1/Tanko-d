'use client'

import * as React from 'react'
import {
  endOfMonth,
  endOfToday,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { CalendarDays } from 'lucide-react'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'

import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '../lib/utils'

export type DateRangeValue = { from?: Date; to?: Date } | undefined

export interface DateRangePickerProps {
  value?: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
  placeholder?: string
}

type Preset = {
  label: string
  value: () => { from: Date; to: Date }
}

const presets: Preset[] = [
  {
    label: 'Today',
    value: () => ({
      from: startOfToday(),
      to: endOfToday(),
    }),
  },
  {
    label: 'This Week',
    value: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: 'This Month',
    value: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
]

function isRangeSelected(
  left?: DateRangeValue,
  right?: DateRangeValue
): boolean {
  if (!left?.from || !left?.to || !right?.from || !right?.to) {
    return false
  }

  return isSameDay(left.from, right.from) && isSameDay(left.to, right.to)
}

function formatLabel(value: DateRangeValue, placeholder: string): string {
  if (!value?.from) {
    return placeholder
  }

  if (!value.to) {
    return format(value.from, 'PPP')
  }

  if (isSameDay(value.from, value.to)) {
    return format(value.from, 'PPP')
  }

  return `${format(value.from, 'PPP')} - ${format(value.to, 'PPP')}`
}

function toDayPickerRange(value?: DateRangeValue): DayPickerDateRange | undefined {
  if (!value?.from && !value?.to) {
    return undefined
  }

  return {
    from: value.from,
    to: value.to,
  }
}

export default function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = toDayPickerRange(value)
  const buttonLabel = formatLabel(value, placeholder)

  const handlePresetSelect = (preset: Preset) => {
    onChange(preset.value())
    setOpen(false)
  }

  const handleCalendarSelect = (range: DayPickerDateRange | undefined) => {
    if (!range?.from && !range?.to) {
      onChange(undefined)
      return
    }

    onChange({
      from: range.from,
      to: range.to,
    })
  }

  const handleClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'justify-start gap-2 text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-4 p-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const presetValue = preset.value()
              const active = isRangeSelected(value, presetValue)

              return (
                <Button
                  key={preset.label}
                  type="button"
                  variant={active ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              )
            })}
            {value?.from || value?.to ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={handleClear}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            onSelect={handleCalendarSelect}
            initialFocus
          />
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Dates are shared as yyyy-MM-dd.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}