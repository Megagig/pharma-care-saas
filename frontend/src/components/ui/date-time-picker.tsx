import { Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/button';
"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { Label } from "./label"
} from "./popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
  maxDateTime?: Date
  minDateTime?: Date
  error?: boolean
  helperText?: string
}

export function DateTimePicker({ 
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  label,
  required = false,
  maxDateTime,
  minDateTime,
  error = false,
  helperText}
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [hours, setHours] = React.useState(value ? value.getHours().toString().padStart(2, '0') : '12')
  const [minutes, setMinutes] = React.useState(value ? value.getMinutes().toString().padStart(2, '0') : '00')
  const [period, setPeriod] = React.useState(value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM')
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("date")
  
  const buttonId = React.useId()
  const helperId = React.useId()
  const hoursId = React.useId()
  const minutesId = React.useId()

  // Update internal state when value prop changes
    if (value) {
      setSelectedDate(value)
      setHours(value.getHours().toString().padStart(2, '0'))
      setMinutes(value.getMinutes().toString().padStart(2, '0'))
      setPeriod(value.getHours() >= 12 ? 'PM' : 'AM')
    }
  }, [value])

  const formatDateTime = (date: Date) => {
    return format(date, "PPP 'at' p")
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange?.(undefined)
      return
    }

    const newDateTime = new Date(date)
    
    // Convert 12-hour to 24-hour format
    const hour24 = period === 'PM' && hours !== '12' 
      ? parseInt(hours) + 12 
      : period === 'AM' && hours === '12' 
        ? 0 
        : parseInt(hours)

    newDateTime.setHours(hour24, parseInt(minutes), 0, 0)
    
    // Check constraints
    if (maxDateTime && newDateTime > maxDateTime) {
      return
    }
    if (minDateTime && newDateTime < minDateTime) {
      return
    }

    setSelectedDate(newDateTime)
    onChange?.(newDateTime)
  }

  const handleTimeChange = (newHours: string, newMinutes: string, newPeriod: string) => {
    if (!selectedDate) return

    const hour24 = newPeriod === 'PM' && newHours !== '12' 
      ? parseInt(newHours) + 12 
      : newPeriod === 'AM' && newHours === '12' 
        ? 0 
        : parseInt(newHours)

    const newDateTime = new Date(selectedDate)
    newDateTime.setHours(hour24, parseInt(newMinutes), 0, 0)
    
    // Check constraints
    if (maxDateTime && newDateTime > maxDateTime) {
      return
    }
    if (minDateTime && newDateTime < minDateTime) {
      return
    }

    setSelectedDate(newDateTime)
    onChange?.(newDateTime)
  }

  const handleHoursChange = (value: string) => {
    const numValue = parseInt(value)
    if (numValue >= 1 && numValue <= 12) {
      const paddedValue = value.padStart(2, '0')
      setHours(paddedValue)
      handleTimeChange(paddedValue, minutes, period)
    }
  }

  const handleMinutesChange = (value: string) => {
    const numValue = parseInt(value)
    if (numValue >= 0 && numValue <= 59) {
      const paddedValue = value.padStart(2, '0')
      setMinutes(paddedValue)
      handleTimeChange(hours, paddedValue, period)
    }
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    handleTimeChange(hours, minutes, newPeriod)
  }

  const handleApply = () => {
    setOpen(false)
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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
              !selectedDate && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive"}
            )}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-describedby={helperText ? helperId : undefined}
            aria-invalid={error}
            aria-required={required}
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {selectedDate ? formatDateTime(selectedDate) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          role="dialog"
          aria-label={`${label || 'Date and time'} picker`}
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2" role="tablist">
              <TabsTrigger 
                value="date" 
                className="flex items-center gap-2"
                role="tab"
                aria-
              >
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                Date
              </TabsTrigger>
              <TabsTrigger 
                value="time" 
                className="flex items-center gap-2"
                role="tab"
                aria-
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                Time
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="date" className="p-0" role="tabpanel">
              <Calendar
                mode="single"
                
                onSelect={handleDateSelect}
                
                initialFocus
                aria-label="Choose date"
              />
            </TabsContent>
            
            <TabsContent value="time" className="p-4" role="tabpanel">
              <div className="space-y-4">
                <div className="text-sm font-medium" id="time-selection-heading">
                  Select Time
                </div>
                <div className="flex items-center space-x-2" role="group" aria-labelledby="time-selection-heading">
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
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-3 border-t">
            <Button 
              onClick={handleApply} 
              className="w-full" 
              size="sm"
              aria-label="Apply selected date and time"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {helperText && (
        <p 
          id={helperId}
          className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground"}
          )}
          role={error ? "alert" : "status"}
          aria-live={error ? "assertive" : "polite"}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}

export { DateTimePicker as default };