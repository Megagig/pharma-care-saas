import { Button, Input, Label } from '@/components/ui/button';
"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
} from "./popover"

interface TimePickerProps {
  time?: Date
  onTimeChange?: (time: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export function TimePicker({ 
  time,
  onTimeChange,
  placeholder = "Select time",
  disabled = false,
  className,
  label,
  required = false}
}: TimePickerProps) {
  const [hours, setHours] = React.useState(time ? time.getHours().toString().padStart(2, '0') : '12')
  const [minutes, setMinutes] = React.useState(time ? time.getMinutes().toString().padStart(2, '0') : '00')
  const [period, setPeriod] = React.useState(time ? (time.getHours() >= 12 ? 'PM' : 'AM') : 'AM')
  const [open, setOpen] = React.useState(false)
  
  const buttonId = React.useId()
  const hoursId = React.useId()
  const minutesId = React.useId()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true}
  }

  const handleTimeChange = (newHours: string, newMinutes: string, newPeriod: string) => {
    if (!onTimeChange) return

    const hour24 = newPeriod === 'PM' && newHours !== '12' 
      ? parseInt(newHours) + 12 
      : newPeriod === 'AM' && newHours === '12' 
        ? 0 
        : parseInt(newHours)

    const newTime = new Date()
    newTime.setHours(hour24, parseInt(newMinutes), 0, 0)
    onTimeChange(newTime)
  }

  const handleHoursChange = (value: string) => {
    const numValue = parseInt(value)
    if (numValue >= 1 && numValue <= 12) {
      setHours(value.padStart(2, '0'))
      handleTimeChange(value.padStart(2, '0'), minutes, period)
    }
  }

  const handleMinutesChange = (value: string) => {
    const numValue = parseInt(value)
    if (numValue >= 0 && numValue <= 59) {
      setMinutes(value.padStart(2, '0'))
      handleTimeChange(hours, value.padStart(2, '0'), period)
    }
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    handleTimeChange(hours, minutes, newPeriod)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(!open)
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={buttonId} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={buttonId}
            
            className={cn(
              "w-full justify-start text-left font-normal",
              !time && "text-muted-foreground"}
            )}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-required={required}
          >
            <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
            {time ? formatTime(time) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-4" 
          align="start"
          role="dialog"
          aria-label={`${label || 'Time'} picker`}
        >
          <div className="flex items-center space-x-2" role="group" aria-label="Time selection">
            <div className="space-y-2">
              <Label htmlFor={hoursId} className="text-xs">Hours</Label>
              <Input
                id={hoursId}
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) => handleHoursChange(e.target.value)}
                className="w-16 text-center"
                aria-describedby="hours-help"
              />
              <div id="hours-help" className="sr-only">
                Enter hours from 1 to 12
              </div>
            </div>
            <div className="pt-6" aria-hidden="true">:</div>
            <div className="space-y-2">
              <Label htmlFor={minutesId} className="text-xs">Minutes</Label>
              <Input
                id={minutesId}
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => handleMinutesChange(e.target.value)}
                className="w-16 text-center"
                aria-describedby="minutes-help"
              />
              <div id="minutes-help" className="sr-only">
                Enter minutes from 0 to 59
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Period</Label>
              <div className="flex" role="radiogroup" aria-label="AM or PM">
                <Button
                  type="button"
                  variant={period === 'AM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('AM')}
                  className="rounded-r-none"
                  role="radio"
                  aria-checked={period === 'AM'}
                >
                  AM
                </Button>
                <Button
                  type="button"
                  variant={period === 'PM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('PM')}
                  className="rounded-l-none"
                  role="radio"
                  aria-checked={period === 'PM'}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { TimePicker as default };