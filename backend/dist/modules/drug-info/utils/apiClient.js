"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class ApiClient {
    static async requestWithRetry(url, options = {}, retries = 3, delay = 1000) {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await (0, axios_1.default)({
                    url,
                    ...options
                });
                return response.data;
            }
            catch (error) {
                logger_1.default.warn(`API request failed (attempt ${i + 1}/${retries + 1}): ${url}`, error.message);
                if (i === retries) {
                    logger_1.default.error(`API request failed after ${retries + 1} attempts: ${url}`, error.message);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
        throw new Error('Unexpected error in requestWithRetry');
    }
    static async get(url, params = {}, options = {}, retries = 3, delay = 1000) {
        return this.requestWithRetry(url, {
            method: 'GET',
            params,
            ...options
        }, retries, delay);
    }
    static async post(url, data = {}, options = {}, retries = 3, delay = 1000) {
        return this.requestWithRetry(url, {
            method: 'POST',
            data,
            ...options
        }, retries, delay);
    }
}
exports.default = ApiClient;
//# sourceMappingURL=apiClient.js.map