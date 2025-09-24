// API Configuration
export const API_CONFIG = {
    // Base API URL - can be overridden by environment variables
    BASE_URL: import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),

    // Request timeout in milliseconds
    TIMEOUT: 30000,

    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },

    // Retry configuration
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
} as const;

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
        ? API_CONFIG.BASE_URL.slice(0, -1)
        : API_CONFIG.BASE_URL;

    const cleanEndpoint = endpoint.startsWith('/')
        ? endpoint
        : `/${endpoint}`;

    return `${baseUrl}${cleanEndpoint}`;
};

// Environment info
export const ENV_INFO = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
} as const;