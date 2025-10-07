"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
class ApiClient {
    constructor(config) {
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'PharmacyCopilot-SaaS/1.0'
        };
        if (config.apiKey) {
            defaultHeaders['Authorization'] = `Bearer ${config.apiKey}`;
        }
        this.client = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                ...defaultHeaders,
                ...config.headers
            }
        });
        this.client.interceptors.request.use((config) => {
            logger_1.default.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data
            });
            return config;
        }, (error) => {
            logger_1.default.error('API Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.default.info(`API Response: ${response.status} ${response.config.url}`, {
                data: response.data,
                headers: response.headers
            });
            return response;
        }, (error) => {
            logger_1.default.error('API Response Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            return Promise.reject(error);
        });
    }
    async get(url, config) {
        return this.executeWithRetry(() => this.client.get(url, config));
    }
    async post(url, data, config) {
        return this.executeWithRetry(() => this.client.post(url, data, config));
    }
    async put(url, data, config) {
        return this.executeWithRetry(() => this.client.put(url, data, config));
    }
    async delete(url, config) {
        return this.executeWithRetry(() => this.client.delete(url, config));
    }
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                    throw error;
                }
                if (attempt === this.retryAttempts) {
                    logger_1.default.error(`API call failed after ${this.retryAttempts} attempts:`, error);
                    throw error;
                }
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                logger_1.default.warn(`API call failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    setHeader(key, value) {
        this.client.defaults.headers.common[key] = value;
    }
    removeHeader(key) {
        delete this.client.defaults.headers.common[key];
    }
    getConfig() {
        return {
            baseURL: this.client.defaults.baseURL,
            timeout: this.client.defaults.timeout,
            headers: this.client.defaults.headers
        };
    }
}
exports.ApiClient = ApiClient;
exports.default = ApiClient;
//# sourceMappingURL=apiClient.js.map