import mongoose from 'mongoose';
export interface IndexDefinition {
    fields: Record<string, 1 | -1 | 'text'>;
    options?: {
        name?: string;
        unique?: boolean;
        sparse?: boolean;
        background?: boolean;
        partialFilterExpression?: any;
        expireAfterSeconds?: number;
    };
}
export declare class DatabaseOptimizer {
    static createOptimizedIndexes(): Promise<void>;
    static analyzeIndexUsage(): Promise<{
        totalIndexes: number;
        unusedIndexes: string[];
        slowQueries: any[];
        recommendations: string[];
    }>;
    static explainQuery(model: mongoose.Model<any>, query: any, options?: any): Promise<any>;
    static performMaintenance(): Promise<void>;
    static optimizeConnectionPool(): void;
}
export declare class OptimizedQueryBuilder {
    static buildInterventionListQuery(filters: any): any[];
    static buildDashboardMetricsQuery(workplaceId: string, dateRange?: {
        from: Date;
        to: Date;
    }): ({
        $match: any;
        $facet?: undefined;
    } | {
        $facet: {
            overallStats: {
                $group: {
                    _id: null;
                    total: {
                        $sum: number;
                    };
                    active: {
                        $sum: {
                            $cond: (number | {
                                $in: (string | string[])[];
                            })[];
                        };
                    };
                    completed: {
                        $sum: {
                            $cond: (number | {
                                $eq: string[];
                            })[];
                        };
                    };
                    overdue: {
                        $sum: {
                            $cond: (number | {
                                $and: ({
                                    $in: (string | string[])[];
                                    $lt?: undefined;
                                } | {
                                    $lt: (string | {
                                        $dateSubtract: {
                                            startDate: Date;
                                            unit: string;
                                            amount: {
                                                $switch: {
                                                    branches: ({
                                                        case: {
                                                            $in: (string | string[])[];
                                                            $eq?: undefined;
                                                        };
                                                        then: number;
                                                    } | {
                                                        case: {
                                                            $eq: string[];
                                                            $in?: undefined;
                                                        };
                                                        then: number;
                                                    })[];
                                                    default: number;
                                                };
                                            };
                                        };
                                    })[];
                                    $in?: undefined;
                                })[];
                            })[];
                        };
                    };
                    avgResolutionTime: {
                        $avg: {
                            $cond: (string | {
                                $and: ({
                                    $eq: string[];
                                    $gt?: undefined;
                                } | {
                                    $gt: (string | number)[];
                                    $eq?: undefined;
                                })[];
                            } | null)[];
                        };
                    };
                    totalCostSavings: {
                        $sum: {
                            $ifNull: (string | number)[];
                        };
                    };
                };
            }[];
            categoryStats: ({
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
                    successful: {
                        $sum: {
                            $cond: (number | {
                                $and: {
                                    $eq: (string | boolean)[];
                                }[];
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
            priorityStats: {
                $group: {
                    _id: string;
                    count: {
                        $sum: number;
                    };
                };
            }[];
            recentInterventions: ({
                $sort: {
                    identifiedDate: number;
                };
                $limit?: undefined;
                $lookup?: undefined;
                $unwind?: undefined;
                $project?: undefined;
            } | {
                $limit: number;
                $sort?: undefined;
                $lookup?: undefined;
                $unwind?: undefined;
                $project?: undefined;
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
                        };
                    }[];
                };
                $sort?: undefined;
                $limit?: undefined;
                $unwind?: undefined;
                $project?: undefined;
            } | {
                $unwind: string;
                $sort?: undefined;
                $limit?: undefined;
                $lookup?: undefined;
                $project?: undefined;
            } | {
                $project: {
                    interventionNumber: number;
                    category: number;
                    priority: number;
                    status: number;
                    identifiedDate: number;
                    patientName: {
                        $concat: string[];
                    };
                };
                $sort?: undefined;
                $limit?: undefined;
                $lookup?: undefined;
                $unwind?: undefined;
            })[];
        };
        $match?: undefined;
    })[];
}
export declare const initializeDatabaseOptimization: () => Promise<void>;
//# sourceMappingURL=databaseOptimization.d.ts.map