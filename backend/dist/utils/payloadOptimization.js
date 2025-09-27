"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationPresets = exports.responseOptimizationMiddleware = exports.PayloadOptimizer = exports.FieldProjection = void 0;
const logger_1 = __importDefault(require("./logger"));
class FieldProjection {
    static project(data, options = {}) {
        if (Array.isArray(data)) {
            return data.map(item => this.projectSingle(item, options));
        }
        return this.projectSingle(data, options);
    }
    static projectSingle(obj, options, currentDepth = 0) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        const { include, exclude, maxDepth = 10, maxArrayLength = 100 } = options;
        if (currentDepth >= maxDepth) {
            return {};
        }
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (exclude && exclude.includes(key)) {
                continue;
            }
            if (include && include.length > 0 && !include.includes(key)) {
                continue;
            }
            if (value && typeof value === 'object') {
                if (Array.isArray(value)) {
                    const limitedArray = value.slice(0, maxArrayLength);
                    result[key] = limitedArray.map(item => this.projectSingle(item, options, currentDepth + 1));
                }
                else {
                    result[key] = this.projectSingle(value, options, currentDepth + 1);
                }
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    static createMongoProjection(options) {
        const projection = {};
        if (options.include && options.include.length > 0) {
            options.include.forEach(field => {
                projection[field] = 1;
            });
        }
        else if (options.exclude && options.exclude.length > 0) {
            options.exclude.forEach(field => {
                projection[field] = 0;
            });
        }
        return projection;
    }
}
exports.FieldProjection = FieldProjection;
class PayloadOptimizer {
    static optimize(data, options = {}) {
        const { removeNullValues = true, removeEmptyArrays = true, removeEmptyObjects = true, compactArrays = false, maxStringLength, dateFormat = 'iso', } = options;
        return this.optimizeValue(data, options);
    }
    static optimizeValue(value, options) {
        if (value === null || value === undefined) {
            return options.removeNullValues ? undefined : value;
        }
        if (Array.isArray(value)) {
            const optimizedArray = value
                .map(item => this.optimizeValue(item, options))
                .filter(item => item !== undefined);
            if (options.removeEmptyArrays && optimizedArray.length === 0) {
                return undefined;
            }
            return optimizedArray;
        }
        if (value instanceof Date) {
            return this.formatDate(value, options.dateFormat);
        }
        if (typeof value === 'string') {
            if (options.maxStringLength && value.length > options.maxStringLength) {
                return value.substring(0, options.maxStringLength) + '...';
            }
            return value;
        }
        if (typeof value === 'object') {
            const optimizedObject = {};
            let hasProperties = false;
            for (const [key, val] of Object.entries(value)) {
                const optimizedVal = this.optimizeValue(val, options);
                if (optimizedVal !== undefined) {
                    optimizedObject[key] = optimizedVal;
                    hasProperties = true;
                }
            }
            if (options.removeEmptyObjects && !hasProperties) {
                return undefined;
            }
            return optimizedObject;
        }
        return value;
    }
    static formatDate(date, format) {
        switch (format) {
            case 'timestamp':
                return date.getTime();
            case 'short':
                return date.toISOString().split('T')[0];
            case 'iso':
            default:
                return date.toISOString();
        }
    }
    static calculateReduction(original, optimized) {
        const originalSize = Buffer.byteLength(JSON.stringify(original));
        const optimizedSize = Buffer.byteLength(JSON.stringify(optimized));
        const reductionBytes = originalSize - optimizedSize;
        const reductionPercent = (reductionBytes / originalSize) * 100;
        return {
            originalSize,
            optimizedSize,
            reductionBytes,
            reductionPercent,
        };
    }
}
exports.PayloadOptimizer = PayloadOptimizer;
const responseOptimizationMiddleware = (projectionOptions, optimizationOptions) => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            let optimizedData = data;
            try {
                if (projectionOptions) {
                    optimizedData = FieldProjection.project(optimizedData, projectionOptions);
                }
                if (optimizationOptions) {
                    optimizedData = PayloadOptimizer.optimize(optimizedData, optimizationOptions);
                }
                const originalSize = Buffer.byteLength(JSON.stringify(data));
                if (originalSize > 10 * 1024) {
                    const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedData));
                    const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
                    if (reduction > 10) {
                        logger_1.default.info('Payload optimization applied', {
                            endpoint: req.originalUrl,
                            originalSize,
                            optimizedSize,
                            reductionPercent: reduction.toFixed(2),
                        });
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Error optimizing payload:', error);
                optimizedData = data;
            }
            return originalJson(optimizedData);
        };
        next();
    };
};
exports.responseOptimizationMiddleware = responseOptimizationMiddleware;
exports.OptimizationPresets = {
    mobile: {
        projection: {
            exclude: ['__v', 'createdBy', 'updatedBy', 'internalNotes'],
            maxArrayLength: 20,
            maxDepth: 3,
        },
        optimization: {
            removeNullValues: true,
            removeEmptyArrays: true,
            removeEmptyObjects: true,
            maxStringLength: 200,
            dateFormat: 'timestamp',
        },
    },
    list: {
        projection: {
            include: ['_id', 'name', 'status', 'createdAt', 'updatedAt'],
            maxArrayLength: 50,
        },
        optimization: {
            removeNullValues: true,
            removeEmptyArrays: true,
            dateFormat: 'short',
        },
    },
    detail: {
        projection: {
            exclude: ['__v'],
            maxDepth: 5,
        },
        optimization: {
            removeNullValues: false,
            removeEmptyArrays: false,
            removeEmptyObjects: false,
        },
    },
    export: {
        projection: {
            exclude: ['__v', 'password', 'tokens'],
            maxDepth: 10,
        },
        optimization: {
            removeNullValues: true,
            removeEmptyArrays: true,
            removeEmptyObjects: true,
            dateFormat: 'iso',
        },
    },
};
exports.default = {
    FieldProjection,
    PayloadOptimizer,
    responseOptimizationMiddleware: exports.responseOptimizationMiddleware,
    OptimizationPresets: exports.OptimizationPresets,
};
//# sourceMappingURL=payloadOptimization.js.map