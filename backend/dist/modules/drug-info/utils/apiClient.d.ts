import { AxiosRequestConfig } from 'axios';
declare class ApiClient {
    static requestWithRetry<T>(url: string, options?: AxiosRequestConfig, retries?: number, delay?: number): Promise<T>;
    static get<T>(url: string, params?: Record<string, any>, options?: AxiosRequestConfig, retries?: number, delay?: number): Promise<T>;
    static post<T>(url: string, data?: any, options?: AxiosRequestConfig, retries?: number, delay?: number): Promise<T>;
}
export default ApiClient;
//# sourceMappingURL=apiClient.d.ts.map