"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class DiagnosticCacheService {
    constructor(config) {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalAccessTime: 0,
            accessCount: 0,
        };
        this.config = {
            maxSize: 100 * 1024 * 1024,
            maxEntries: 10000,
            defaultTTL: 60 * 60 * 1000,
            cleanupInterval: 5 * 60 * 1000,
            enableCompression: true,
            enableMetrics: true,
        };
        if (config) {
            this.config = { ...this.config, ...config };
        }
        this.startCleanupTimer();
    }
    async cacheAIResult(inputHash, result, ttl = this.config.defaultTTL) {
        const key = `ai_result:${inputHash}`;
        const tags = ['ai_result', 'diagnostic'];
        await this.set(key, result, ttl, tags);
        logger_1.default.debug('AI result cached', {
            key,
            ttl,
            size: this.calculateSize(result),
        });
    }
    async getCachedAIResult(inputHash) {
        const key = `ai_result:${inputHash}`;
        return this.get(key);
    }
    async cacheDrugInteractions(medicationHash, interactions, ttl = 24 * 60 * 60 * 1000) {
        const key = `drug_interactions:${medicationHash}`;
        const tags = ['drug_interactions', 'clinical_api'];
        await this.set(key, interactions, ttl, tags);
        logger_1.default.debug('Drug interactions cached', {
            key,
            ttl,
            interactionCount: interactions.length,
        });
    }
    async getCachedDrugInteractions(medicationHash) {
        const key = `drug_interactions:${medicationHash}`;
        return this.get(key);
    }
    async cacheLabReferenceRanges(testCode, referenceRanges, ttl = 7 * 24 * 60 * 60 * 1000) {
        const key = `lab_ranges:${testCode}`;
        const tags = ['lab_ranges', 'reference_data'];
        await this.set(key, referenceRanges, ttl, tags);
    }
    async getCachedLabReferenceRanges(testCode) {
        const key = `lab_ranges:${testCode}`;
        return this.get(key);
    }
    async cacheFHIRMapping(mappingKey, mapping, ttl = 24 * 60 * 60 * 1000) {
        const key = `fhir_mapping:${mappingKey}`;
        const tags = ['fhir_mapping', 'integration'];
        await this.set(key, mapping, ttl, tags);
    }
    async getCachedFHIRMapping(mappingKey) {
        const key = `fhir_mapping:${mappingKey}`;
        return this.get(key);
    }
    async cachePatientSummary(patientId, workplaceId, summary, ttl = 30 * 60 * 1000) {
        const key = `patient_summary:${workplaceId}:${patientId}`;
        const tags = ['patient_summary', 'diagnostic_history'];
        await this.set(key, summary, ttl, tags);
    }
    async getCachedPatientSummary(patientId, workplaceId) {
        const key = `patient_summary:${workplaceId}:${patientId}`;
        return this.get(key);
    }
    async set(key, value, ttl = this.config.defaultTTL, tags = []) {
        const startTime = Date.now();
        try {
            await this.ensureCapacity();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + ttl);
            const size = this.calculateSize(value);
            const entry = {
                key,
                value: this.config.enableCompression ? this.compress(value) : value,
                createdAt: now,
                expiresAt,
                accessCount: 0,
                lastAccessed: now,
                tags,
                size,
            };
            this.cache.set(key, entry);
            if (this.config.enableMetrics) {
                this.updateAccessMetrics(Date.now() - startTime);
            }
            logger_1.default.debug('Cache entry set', {
                key,
                size,
                ttl,
                tags,
                totalEntries: this.cache.size,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to set cache entry', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async get(key) {
        const startTime = Date.now();
        try {
            const entry = this.cache.get(key);
            if (!entry) {
                this.stats.misses++;
                return null;
            }
            if (entry.expiresAt < new Date()) {
                this.cache.delete(key);
                this.stats.misses++;
                return null;
            }
            entry.accessCount++;
            entry.lastAccessed = new Date();
            this.cache.set(key, entry);
            this.stats.hits++;
            if (this.config.enableMetrics) {
                this.updateAccessMetrics(Date.now() - startTime);
            }
            const value = this.config.enableCompression ?
                this.decompress(entry.value) : entry.value;
            logger_1.default.debug('Cache hit', {
                key,
                accessCount: entry.accessCount,
                age: Date.now() - entry.createdAt.getTime(),
            });
            return value;
        }
        catch (error) {
            logger_1.default.error('Failed to get cache entry', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            this.stats.misses++;
            return null;
        }
    }
    async delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger_1.default.debug('Cache entry deleted', { key });
        }
        return deleted;
    }
    async clearByTag(tag) {
        let deletedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.includes(tag)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        logger_1.default.info('Cache entries cleared by tag', {
            tag,
            deletedCount,
        });
        return deletedCount;
    }
    async clear() {
        const entryCount = this.cache.size;
        this.cache.clear();
        logger_1.default.info('Cache cleared', { entryCount });
    }
    generateCacheKey(prefix, data) {
        const normalizedData = this.normalizeForHashing(data);
        const hash = crypto_1.default
            .createHash('sha256')
            .update(JSON.stringify(normalizedData))
            .digest('hex')
            .substring(0, 16);
        return `${prefix}:${hash}`;
    }
    normalizeForHashing(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.normalizeForHashing(item)).sort();
        }
        if (data && typeof data === 'object') {
            const normalized = {};
            const sortedKeys = Object.keys(data).sort();
            for (const key of sortedKeys) {
                normalized[key] = this.normalizeForHashing(data[key]);
            }
            return normalized;
        }
        return data;
    }
    async ensureCapacity() {
        if (this.cache.size >= this.config.maxEntries) {
            await this.evictLRU(Math.floor(this.config.maxEntries * 0.1));
        }
        const totalSize = this.getTotalSize();
        if (totalSize >= this.config.maxSize) {
            await this.evictLRU(Math.floor(this.cache.size * 0.1));
        }
    }
    async evictLRU(count) {
        const entries = Array.from(this.cache.entries())
            .map(([key, entry]) => ({ key, entry }))
            .sort((a, b) => a.entry.lastAccessed.getTime() - b.entry.lastAccessed.getTime());
        const toEvict = entries.slice(0, count);
        for (const { key } of toEvict) {
            this.cache.delete(key);
            this.stats.evictions++;
        }
        if (toEvict.length > 0) {
            logger_1.default.debug('LRU eviction completed', {
                evictedCount: toEvict.length,
                remainingEntries: this.cache.size,
            });
        }
    }
    async cleanupExpired() {
        const now = new Date();
        let expiredCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                this.cache.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            logger_1.default.debug('Expired entries cleaned up', {
                expiredCount,
                remainingEntries: this.cache.size,
            });
        }
    }
    calculateSize(data) {
        try {
            return Buffer.byteLength(JSON.stringify(data), 'utf8');
        }
        catch (error) {
            return 0;
        }
    }
    getTotalSize() {
        let totalSize = 0;
        for (const entry of this.cache.values()) {
            totalSize += entry.size;
        }
        return totalSize;
    }
    compress(data) {
        return data;
    }
    decompress(data) {
        return data;
    }
    updateAccessMetrics(accessTime) {
        this.stats.accessCount++;
        this.stats.totalAccessTime += accessTime;
    }
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
            totalEntries: this.cache.size,
            totalSize: this.getTotalSize(),
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
            missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
            evictionCount: this.stats.evictions,
            averageAccessTime: this.stats.accessCount > 0 ?
                this.stats.totalAccessTime / this.stats.accessCount : 0,
        };
    }
    getEntriesByTag(tag) {
        const entries = [];
        for (const entry of this.cache.values()) {
            if (entry.tags.includes(tag)) {
                entries.push(entry);
            }
        }
        return entries;
    }
    getHealthStatus() {
        const stats = this.getStats();
        const issues = [];
        const recommendations = [];
        if (stats.hitRate < 0.5) {
            issues.push('Low cache hit rate');
            recommendations.push('Consider increasing TTL or cache size');
        }
        const memoryUsagePercent = stats.totalSize / this.config.maxSize;
        if (memoryUsagePercent > 0.9) {
            issues.push('High memory usage');
            recommendations.push('Consider increasing cache size or reducing TTL');
        }
        if (stats.evictionCount > stats.totalEntries * 0.1) {
            issues.push('High eviction rate');
            recommendations.push('Consider increasing cache capacity');
        }
        return {
            isHealthy: issues.length === 0,
            issues,
            recommendations,
        };
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, this.config.cleanupInterval);
    }
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    }
    async warmUp(warmupData) {
        logger_1.default.info('Starting cache warmup', {
            itemCount: warmupData.length,
        });
        for (const item of warmupData) {
            await this.set(item.key, item.value, item.ttl || this.config.defaultTTL, item.tags || []);
        }
        logger_1.default.info('Cache warmup completed', {
            itemCount: warmupData.length,
            totalEntries: this.cache.size,
        });
    }
    exportCache() {
        const exportData = [];
        for (const [key, entry] of this.cache.entries()) {
            exportData.push({
                key,
                value: this.config.enableCompression ?
                    this.decompress(entry.value) : entry.value,
                expiresAt: entry.expiresAt,
                tags: entry.tags,
            });
        }
        return exportData;
    }
    async importCache(importData) {
        logger_1.default.info('Starting cache import', {
            itemCount: importData.length,
        });
        for (const item of importData) {
            const ttl = item.expiresAt.getTime() - Date.now();
            if (ttl > 0) {
                await this.set(item.key, item.value, ttl, item.tags);
            }
        }
        logger_1.default.info('Cache import completed', {
            itemCount: importData.length,
            totalEntries: this.cache.size,
        });
    }
}
exports.default = new DiagnosticCacheService();
//# sourceMappingURL=diagnosticCacheService.js.map