import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"
import { badgeVariants } from "@/components/ui/badge"

// Component variant types
export type ButtonVariant = VariantProps<typeof buttonVariants>
export type BadgeVariant = VariantProps<typeof badgeVariants>

// Common UI component props
export interface BaseComponentProps {
    className?: string
    children?: React.ReactNode
}

// Form component interfaces
export interface FormFieldProps extends BaseComponentProps {
    label?: string
    error?: string
    required?: boolean
    disabled?: boolean
}

// Theme-related interfaces
export interface ThemeColors {
    primary: string
    secondary: string
    background: string
    foreground: string
    muted: string
    accent: string
    destructive: string
    border: string
    input: string
    ring: string
}

export interface ComponentVariants {
    button: {
        variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
        size: 'default' | 'sm' | 'lg' | 'icon'
    }
    badge: {
        variant: 'default' | 'secondary' | 'destructive' | 'outline'
    }
    input: {
        variant: 'default' | 'destructive'
        size: 'default' | 'sm' | 'lg'
    }
    card: {
        variant: 'default' | 'outline'
    }
}