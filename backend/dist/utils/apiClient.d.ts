import { AxiosRequestConfig, AxiosResponse } from 'axios';
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    retryAttempts?: number;
    retryDelay?: number;
    apiKey?: string;
}
export declare class ApiClient {
    private client;
    private retryAttempts;
    private retryDelay;
    constructor(config: ApiClientConfig);
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    private executeWithRetry;
    setHeader(key: string, value: string): void;
    removeHeader(key: string): void;
    getConfig(): any;
}
export default ApiClient;
//# sourceMappingURL=apiClient.d.ts.map