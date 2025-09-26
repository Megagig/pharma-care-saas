import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from '../date-picker'

describe('DatePicker Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DatePicker
        label="Birth Date"
        value={undefined}
        onChange={mockOnChange}
        required
        helperText="Select your birth date"
      />
    )

    const button = screen.getByRole('button')
    
    // Check ARIA attributes
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    expect(button).toHaveAttribute('aria-required', 'true')
    expect(button).toHaveAttribute('aria-describedby')
    
    // Check label association
    const label = screen.getByText('Birth Date')
    expect(label).toBeInTheDocument()
    
    // Check helper text
    const helperText = screen.getByText('Select your birth date')
    expect(helperText).toHaveAttribute('role', 'status')
    expect(helperText).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle keyboard navigation', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DatePicker
        label="Birth Date"
        value={undefined}
        onChange={mockOnChange}
      />
    )

    const button = screen.getByRole('button')
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    // Test Escape key
    fireEvent.keyDown(button, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should show error state with proper ARIA attributes', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DatePicker
        label="Birth Date"
        value={undefined}
        onChange={mockOnChange}
        error={true}
        helperText="This field is required"
      />
    )

    const button = screen.getByRole('button')
    const helperText = screen.getByText('This field is required')
    
    expect(button).toHaveAttribute('aria-invalid', 'true')
    expect(helperText).toHaveAttribute('role', 'alert')
    expect(helperText).toHaveAttribute('aria-live', 'assertive')
  })

  it('should have proper focus management', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DatePicker
        label="Birth Date"
        value={undefined}
        onChange={mockOnChange}
      />
    )

    const button = screen.getByRole('button')
    
    // Button should be focusable
    button.focus()
    expect(document.activeElement).toBe(button)
  })
});