/* Global type declarations for the project */

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Process environment for Node.js compatibility
declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_STRIPE_PUBLISHABLE_KEY: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

// User type augmentation for missing properties
declare module '../../types/User' {
  interface User {
    permissions?: string[];
    features?: string[];
    licenseStatus?: 'pending' | 'approved' | 'rejected';
    subscriptionTier?: 'free_trial' | 'basic' | 'pro' | 'enterprise';
    currentSubscription?: any;
    stripeCustomerId?: string;
  }
}

// Module declarations for missing packages
declare module '@stripe/stripe-js' {
  export function loadStripe(key: string): Promise<any>;
  export interface Stripe {
    confirmCardSetup(clientSecret: string, data?: any): Promise<any>;
  }
}

declare module '@stripe/react-stripe-js' {
  export const Elements: React.ComponentType<any>;
  export const CardElement: React.ComponentType<any>;
  export function useStripe(): any;
  export function useElements(): any;
}

// Fix for MUI Grid component type issues
declare module '@mui/material/Grid' {
  interface GridProps {
    item?: boolean;
    container?: boolean;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  }
}

// Generic API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Common utility types
export type ErrorWithMessage = {
  message: string;
};

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}