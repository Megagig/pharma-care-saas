import { Button, Label } from '@/components/ui/button';
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Label } from "./label"
} from "./popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  maxDate?: Date
  minDate?: Date
}

export function DatePicker({ 
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  label,
  required = false,
  error = false,
  helperText,
  maxDate,
  minDate}
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const buttonId = React.useId()
  const helperId = React.useId()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(!open)
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
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
              !value && "text-muted-foreground",
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
            {value ? (
              <span>{format(value, "PPP")}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          role="dialog"
          aria-label={`${label || 'Date'} picker`}
        >
          <Calendar
            mode="single"
            
            onSelect={handleDateSelect}
            
            initialFocus
            aria-label="Choose date"
          />
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

export { DatePicker as default };