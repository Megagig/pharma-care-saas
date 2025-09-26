import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DateTimePicker } from '../date-time-picker'

describe('DateTimePicker Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DateTimePicker
        label="Appointment Time"
        value={undefined}
        onChange={mockOnChange}
        required
        helperText="Select appointment date and time"
      />
    )

    const button = screen.getByRole('button')
    
    // Check ARIA attributes
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    expect(button).toHaveAttribute('aria-required', 'true')
    expect(button).toHaveAttribute('aria-describedby')
    
    // Check label association
    const label = screen.getByText('Appointment Time')
    expect(label).toBeInTheDocument()
    
    // Check helper text
    const helperText = screen.getByText('Select appointment date and time')
    expect(helperText).toHaveAttribute('role', 'status')
    expect(helperText).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle keyboard navigation', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DateTimePicker
        label="Appointment Time"
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

  it('should have accessible tabs for date and time selection', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DateTimePicker
        label="Appointment Time"
        value={new Date()}
        onChange={mockOnChange}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Check for tab list
    const tabList = screen.getByRole('tablist')
    expect(tabList).toBeInTheDocument()
    
    // Check for individual tabs
    const dateTab = screen.getByRole('tab', { name: /date/i })
    const timeTab = screen.getByRole('tab', { name: /time/i })
    
    expect(dateTab).toHaveAttribute('aria-selected')
    expect(timeTab).toHaveAttribute('aria-selected')
  })

  it('should show error state with proper ARIA attributes', () => {
    const mockOnChange = vi.fn()
    
    render(
      <DateTimePicker
        label="Appointment Time"
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
});