import mongoose from 'mongoose';
import Redis from 'ioredis';
export declare const initializeRedisCache: () => Redis | null;
export declare const getRedisClient: () => Redis | null;
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
    compress?: boolean;
}
export declare class CacheManager {
    private static defaultTTL;
    private static keyPrefix;
    static generateKey(type: string, identifier: string, workplaceId?: string): string;
    static set(key: string, value: any, options?: CacheOptions): Promise<boolean>;
    static get<T>(key: string): Promise<T | null>;
    static delete(pattern: string): Promise<boolean>;
    static invalidateInterventionCaches(interventionId?: string, patientId?: string, workplaceId?: string): Promise<void>;
}
export declare class QueryOptimizer {
    static optimizeInterventionQuery(baseQuery: any, options?: {
        includePatient?: boolean;
        includeUser?: boolean;
        includeAssignments?: boolean;
        lean?: boolean;
    }): any;
    static createDashboardAggregation(workplaceId: string, dateRange?: {
        from: Date;
        to: Date;
    }): ({
        $match: any;
        $facet?: undefined;
    } | {
        $facet: {
            statusCounts: {
                $group: {
                    _id: string;
                    count: {
                        $sum: number;
                    };
                };
            }[];
            categoryDistribution: ({
                $group: {
                    _id: string;
                    count: {
                        $sum: number;
                    };
                    completed: {
                        $sum: {
                            $cond: (number | {
                                $eq: string[];
                            })[];
                        };
                    };
                };
                $addFields?: undefined;
            } | {
                $addFields: {
                    successRate: {
                        $cond: (number | {
                            $gt: (string | number)[];
                            $multiply?: undefined;
                        } | {
                            $multiply: (number | {
                                $divide: string[];
                            })[];
                            $gt?: undefined;
                        })[];
                    };
                };
                $group?: undefined;
            })[];
            priorityDistribution: {
                $group: {
                    _id: string;
                    count: {
                        $sum: number;
                    };
                };
            }[];
            resolutionMetrics: ({
                $match: {
                    status: string;
                    actualDuration: {
                        $exists: boolean;
                        $gt: number;
                    };
                };
                $group?: undefined;
            } | {
                $group: {
                    _id: null;
                    avgResolutionTime: {
                        $avg: string;
                    };
                    totalCostSavings: {
                        $sum: string;
                    };
                };
                $match?: undefined;
            })[];
            monthlyTrends: ({
                $group: {
                    _id: {
                        year: {
                            $year: string;
                        };
                        month: {
                            $month: string;
                        };
                    };
                    total: {
                        $sum: number;
                    };
                    completed: {
                        $sum: {
                            $cond: (number | {
                                $eq: string[];
                            })[];
                        };
                    };
                };
                $addFields?: undefined;
                $sort?: undefined;
                $limit?: undefined;
            } | {
                $addFields: {
                    successRate: {
                        $cond: (number | {
                            $gt: (string | number)[];
                            $multiply?: undefined;
                        } | {
                            $multiply: (number | {
                                $divide: string[];
                            })[];
                            $gt?: undefined;
                        })[];
                    };
                };
                $group?: undefined;
                $sort?: undefined;
                $limit?: undefined;
            } | {
                $sort: {
                    '_id.year': number;
                    '_id.month': number;
                };
                $group?: undefined;
                $addFields?: undefined;
                $limit?: undefined;
            } | {
                $limit: number;
                $group?: undefined;
                $addFields?: undefined;
                $sort?: undefined;
            })[];
        };
        $match?: undefined;
    })[];
    static createUserAssignmentsQuery(userId: string, workplaceId: string, status?: string[]): ({
        $match: any;
        $addFields?: undefined;
        $lookup?: undefined;
        $unwind?: undefined;
        $project?: undefined;
        $sort?: undefined;
    } | {
        $addFields: {
            userAssignments: {
                $filter: {
                    input: string;
                    cond: {
                        $and: ({
                            $eq: (string | mongoose.Types.ObjectId)[];
                            $in?: undefined;
                            $ne?: undefined;
                        } | {
                            $in: (string | string[])[];
                            $eq?: undefined;
                            $ne?: undefined;
                        } | {
                            $ne: (string | null)[];
                            $eq?: undefined;
                            $in?: undefined;
                        })[];
                    };
                };
            };
        };
        $match?: undefined;
        $lookup?: undefined;
        $unwind?: undefined;
        $project?: undefined;
        $sort?: undefined;
    } | {
        $lookup: {
            from: string;
            localField: string;
            foreignField: string;
            as: string;
            pipeline: {
                $project: {
                    firstName: number;
                    lastName: number;
                    mrn: number;
                };
            }[];
        };
        $match?: undefined;
        $addFields?: undefined;
        $unwind?: undefined;
        $project?: undefined;
        $sort?: undefined;
    } | {
        $unwind: string;
        $match?: undefined;
        $addFields?: undefined;
        $lookup?: undefined;
        $project?: undefined;
        $sort?: undefined;
    } | {
        $project: {
            interventionNumber: number;
            category: number;
            priority: number;
            status: number;
            identifiedDate: number;
            patient: number;
            userAssignments: number;
        };
        $match?: undefined;
        $addFields?: undefined;
        $lookup?: undefined;
        $unwind?: undefined;
        $sort?: undefined;
    } | {
        $sort: {
            priority: number;
            identifiedDate: number;
        };
        $match?: undefined;
        $addFields?: undefined;
        $lookup?: undefined;
        $unwind?: undefined;
        $project?: undefined;
    })[];
}
export interface PerformanceMetrics {
    operation: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    error?: string;
    metadata?: any;
}
export declare class PerformanceMonitor {
    private static metrics;
    private static maxMetrics;
    static trackOperation<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T>;
    private static recordMetric;
    static getPerformanceStats(operation?: string): {
        totalOperations: number;
        averageDuration: number;
        successRate: number;
        slowOperations: number;
        recentErrors: string[];
    };
    static clearMetrics(): void;
    static exportMetrics(operation?: string): PerformanceMetrics[];
}
export declare class MemoryOptimizer {
    static optimizeInterventionData(intervention: any): any;
    static processBatch<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, batchSize?: number): Promise<R[]>;
}
export declare const initializePerformanceOptimization: () => void;
//# sourceMappingURL=performanceOptimization.d.ts.map