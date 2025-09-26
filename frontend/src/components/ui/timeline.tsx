import * as React from "react"
import { cn } from "../../lib/utils"

interface TimelineProps {
  children: React.ReactNode
  className?: string
}

interface TimelineItemProps {
  children: React.ReactNode
  className?: string
}

interface TimelineContentProps {
  children: React.ReactNode
  className?: string
  side?: 'left' | 'right'
}

interface TimelineSeparatorProps {
  children: React.ReactNode
  className?: string
}

interface TimelineDotProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

interface TimelineConnectorProps {
  className?: string
}

interface TimelineOppositeContentProps {
  children: React.ReactNode
  className?: string
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </div>
  )
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex", className)}
      {...props}
    >
      {children}
    </div>
  )
)
TimelineItem.displayName = "TimelineItem"

const TimelineOppositeContent = React.forwardRef<HTMLDivElement, TimelineOppositeContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-32 pr-4 py-2 text-right text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
TimelineOppositeContent.displayName = "TimelineOppositeContent"

const TimelineSeparator = React.forwardRef<HTMLDivElement, TimelineSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center flex-shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
TimelineSeparator.displayName = "TimelineSeparator"

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: "bg-background border-2 border-border",
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-white",
      error: "bg-red-500 text-white",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex items-center justify-center w-8 h-8 rounded-full",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineDot.displayName = "TimelineDot"

const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-0.5 h-full min-h-6 bg-border flex-1",
        className
      )}
      {...props}
    />
  )
)
TimelineConnector.displayName = "TimelineConnector"

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, children, side = 'right', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 py-2",
        side === 'left' ? "pr-4 text-right" : "pl-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
TimelineContent.displayName = "TimelineContent"

export {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
};