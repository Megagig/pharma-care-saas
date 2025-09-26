import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema, ZodError } from 'zod';
import { useMemo } from 'react';

/**
 * Common validation error messages
 */
export const VALIDATION_ERROR_MESSAGES = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: (min: number) => `Minimum length is ${min} characters`,
    maxLength: (max: number) => `Maximum length is ${max} characters`,
    pattern: 'Please enter a valid format',
    select: 'Please select an option',
    number: 'Please enter a valid number',
    date: 'Please enter a valid date',
    time: 'Please enter a valid time',
    phone: 'Please enter a valid phone number',
    url: 'Please enter a valid URL',
    password: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
    confirmPassword: 'Passwords do not match',
    fileRequired: 'Please select a file',
    fileSize: (max: number) => `File size must be less than ${max}MB`,
    fileType: (types: string) => `File type must be ${types}`,
};

/**
 * Common validation schemas
 */
export const COMMON_VALIDATION_SCHEMAS = {
    email: z.string().email(VALIDATION_ERROR_MESSAGES.email),
    password: z.string()
        .min(8, VALIDATION_ERROR_MESSAGES.minLength(8))
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, VALIDATION_ERROR_MESSAGES.phone),
    url: z.string().url(VALIDATION_ERROR_MESSAGES.url),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, VALIDATION_ERROR_MESSAGES.date),
    time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, VALIDATION_ERROR_MESSAGES.time),
    nonEmptyString: z.string().min(1, VALIDATION_ERROR_MESSAGES.required),
    nonEmptyArray: z.array(z.any()).min(1, VALIDATION_ERROR_MESSAGES.required),
    positiveNumber: z.number().positive('Please enter a positive number'),
    nonNegativeNumber: z.number().min(0, 'Please enter a non-negative number'),
};

/**
 * A hook that provides a consistent way to handle form validation with Zod and React Hook Form.
 * 
 * @param schema The Zod schema for validation
 * @param options Additional options for useForm
 * @returns Form methods and validation state
 */
export function useFormValidation<TFieldValues extends FieldValues = FieldValues>(
    schema: ZodSchema<TFieldValues>,
    options?: UseFormProps<TFieldValues>
): UseFormReturn<TFieldValues> {
    const formMethods = useForm<TFieldValues>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        ...options,
    });

    return formMethods;
}

/**
 * A hook that provides field-level validation helpers
 * 
 * @returns Validation helper functions
 */
export function useFieldValidation() {
    /**
     * Creates a validation rule for a required field
     */
    const required = (message = VALIDATION_ERROR_MESSAGES.required) => ({
        required: message,
    });

    /**
     * Creates a validation rule for a field with minimum length
     */
    const minLength = (min: number, message?: string) => ({
        minLength: {
            value: min,
            message: message || VALIDATION_ERROR_MESSAGES.minLength(min),
        },
    });

    /**
     * Creates a validation rule for a field with maximum length
     */
    const maxLength = (max: number, message?: string) => ({
        maxLength: {
            value: max,
            message: message || VALIDATION_ERROR_MESSAGES.maxLength(max),
        },
    });

    /**
     * Creates a validation rule for a field with a pattern
     */
    const pattern = (regex: RegExp, message?: string) => ({
        pattern: {
            value: regex,
            message: message || VALIDATION_ERROR_MESSAGES.pattern,
        },
    });

    /**
     * Creates a validation rule for a numeric field
     */
    const numeric = (message = VALIDATION_ERROR_MESSAGES.number) => ({
        pattern: {
            value: /^[0-9]*\.?[0-9]*$/,
            message,
        },
    });

    /**
     * Creates a validation rule for an integer field
     */
    const integer = (message = 'Please enter a whole number') => ({
        pattern: {
            value: /^[0-9]*$/,
            message,
        },
    });

    /**
     * Creates a validation rule for a positive number
     */
    const positive = (message = 'Please enter a positive number') => ({
        validate: (value: number) => value > 0 || message,
    });

    /**
     * Creates a validation rule for a non-negative number
     */
    const nonNegative = (message = 'Please enter a non-negative number') => ({
        validate: (value: number) => value >= 0 || message,
    });

    /**
     * Creates a validation rule for a field that must match another field
     */
    const matches = (fieldName: string, message = VALIDATION_ERROR_MESSAGES.confirmPassword) => ({
        validate: (value: string, formValues: any) =>
            value === formValues[fieldName] || message,
    });

    /**
     * Creates a validation rule for a field that must be one of the allowed values
     */
    const oneOf = (values: any[], message = 'Please select a valid option') => ({
        validate: (value: any) => values.includes(value) || message,
    });

    /**
     * Creates a validation rule for a field that must not be one of the disallowed values
     */
    const notOneOf = (values: any[], message = 'Please select a different option') => ({
        validate: (value: any) => !values.includes(value) || message,
    });

    return {
        required,
        minLength,
        maxLength,
        pattern,
        numeric,
        integer,
        positive,
        nonNegative,
        matches,
        oneOf,
        notOneOf,
    };
}

/**
 * A hook that provides form validation for multi-step forms
 * 
 * @param schema The Zod schema for validation
 * @param stepSchemas Optional schemas for each step
 * @returns Form methods and step validation helpers
 */
export function useMultiStepFormValidation<TFieldValues extends FieldValues = FieldValues>(
    schema: ZodSchema<TFieldValues>,
    stepSchemas?: ZodSchema<any>[]
) {
    const formMethods = useFormValidation(schema);

    const validateStep = useMemo(() => {
        return (step: number, data: any) => {
            if (stepSchemas && stepSchemas[step]) {
                try {
                    stepSchemas[step].parse(data);
                    return { isValid: true, errors: {} };
                } catch (error) {
                    if (error instanceof ZodError) {
                        const errors: Record<string, string> = {};
                        error.issues.forEach(err => {
                            errors[err.path.join('.')] = err.message;
                        });
                        return { isValid: false, errors };
                    }
                    return { isValid: false, errors: { general: 'Validation failed' } };
                }
            }
            return { isValid: true, errors: {} };
        };
    }, [stepSchemas]);

    const isStepValid = useMemo(() => {
        return (step: number) => {
            const values = formMethods.getValues();
            return validateStep(step, values).isValid;
        };
    }, [formMethods, validateStep]);

    return {
        ...formMethods,
        validateStep,
        isStepValid,
    };
}