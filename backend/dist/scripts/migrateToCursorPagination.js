#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
async function analyzePaginationPerformance() {
    try {
        logger_1.default.info('Starting pagination performance analysis');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const db = mongoose_1.default.connection.db;
        const collections = await db.listCollections().toArray();
        const analyses = [];
        const keyCollections = [
            'patients',
            'clinicalnotes',
            'medications',
            'auditlogs',
            'messages',
            'notifications',
            'medicationtherapyreviews',
            'clinicalinterventions'
        ];
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            if (!keyCollections.includes(collectionName)) {
                continue;
            }
            try {
                const collection = db.collection(collectionName);
                const stats = await collection.stats();
                const indexes = await collection.indexes();
                const sortFields = ['createdAt', 'updatedAt', '_id', 'timestamp'];
                const indexesOnSortFields = indexes
                    .filter(index => {
                    const keys = Object.keys(index.key);
                    return sortFields.some(field => keys.includes(field));
                })
                    .map(index => Object.keys(index.key).join(', '));
                let recommendedSortField = 'createdAt';
                if (indexesOnSortFields.some(idx => idx.includes('createdAt'))) {
                    recommendedSortField = 'createdAt';
                }
                else if (indexesOnSortFields.some(idx => idx.includes('updatedAt'))) {
                    recommendedSortField = 'updatedAt';
                }
                else if (indexesOnSortFields.some(idx => idx.includes('timestamp'))) {
                    recommendedSortField = 'timestamp';
                }
                else {
                    recommendedSortField = '_id';
                }
                let estimatedPerformanceGain = 'minimal';
                let migrationComplexity = 'low';
                if (stats.count > 100000) {
                    estimatedPerformanceGain = 'significant (50-80% faster for large offsets)';
                    migrationComplexity = 'medium';
                }
                else if (stats.count > 10000) {
                    estimatedPerformanceGain = 'moderate (20-50% faster for large offsets)';
                    migrationComplexity = 'low';
                }
                else if (stats.count > 1000) {
                    estimatedPerformanceGain = 'small (10-20% faster for large offsets)';
                    migrationComplexity = 'low';
                }
                if (indexesOnSortFields.length === 0) {
                    migrationComplexity = 'high';
                }
                const analysis = {
                    collection: collectionName,
                    totalDocuments: stats.count,
                    averageDocumentSize: Math.round(stats.avgObjSize || 0),
                    indexesOnSortFields,
                    recommendedSortField,
                    estimatedPerformanceGain,
                    migrationComplexity,
                };
                analyses.push(analysis);
                logger_1.default.info(`Analyzed collection: ${collectionName}`, {
                    documents: stats.count,
                    avgSize: analysis.averageDocumentSize,
                    indexes: indexesOnSortFields.length,
                });
            }
            catch (error) {
                logger_1.default.warn(`Failed to analyze collection ${collectionName}:`, error);
            }
        }
        const report = {
            timestamp: new Date().toISOString(),
            totalCollectionsAnalyzed: analyses.length,
            summary: {
                highPriorityMigrations: analyses.filter(a => a.totalDocuments > 10000 && a.migrationComplexity !== 'high').length,
                mediumPriorityMigrations: analyses.filter(a => a.totalDocuments > 1000 && a.totalDocuments <= 10000).length,
                lowPriorityMigrations: analyses.filter(a => a.totalDocuments <= 1000).length,
                complexMigrations: analyses.filter(a => a.migrationComplexity === 'high').length,
            },
            collections: analyses,
            recommendations: generateRecommendations(analyses),
        };
        logger_1.default.info('Pagination Analysis Summary:', report.summary);
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const reportPath = path.join(process.cwd(), 'cursor-pagination-analysis.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        logger_1.default.info(`Detailed report written to: ${reportPath}`);
        console.log('\n=== CURSOR PAGINATION MIGRATION RECOMMENDATIONS ===\n');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        console.log('\n=== COLLECTION ANALYSIS ===\n');
        analyses
            .sort((a, b) => b.totalDocuments - a.totalDocuments)
            .forEach(analysis => {
            console.log(`Collection: ${analysis.collection}`);
            console.log(`  Documents: ${analysis.totalDocuments.toLocaleString()}`);
            console.log(`  Avg Size: ${analysis.averageDocumentSize} bytes`);
            console.log(`  Sort Indexes: ${analysis.indexesOnSortFields.join(', ') || 'None'}`);
            console.log(`  Recommended Sort: ${analysis.recommendedSortField}`);
            console.log(`  Performance Gain: ${analysis.estimatedPerformanceGain}`);
            console.log(`  Migration Complexity: ${analysis.migrationComplexity}`);
            console.log('');
        });
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Pagination analysis failed:', error);
        process.exit(1);
    }
}
function generateRecommendations(analyses) {
    const recommendations = [];
    const highPriority = analyses.filter(a => a.totalDocuments > 10000 && a.migrationComplexity !== 'high');
    if (highPriority.length > 0) {
        recommendations.push(`HIGH PRIORITY: Migrate ${highPriority.map(a => a.collection).join(', ')} to cursor pagination immediately. These collections have >10k documents and will see significant performance improvements.`);
    }
    const needIndexes = analyses.filter(a => a.indexesOnSortFields.length === 0);
    if (needIndexes.length > 0) {
        recommendations.push(`CREATE INDEXES: Add indexes on sort fields for ${needIndexes.map(a => a.collection).join(', ')} before migrating to cursor pagination.`);
    }
    const mediumPriority = analyses.filter(a => a.totalDocuments > 1000 && a.totalDocuments <= 10000 && a.migrationComplexity === 'low');
    if (mediumPriority.length > 0) {
        recommendations.push(`MEDIUM PRIORITY: Consider migrating ${mediumPriority.map(a => a.collection).join(', ')} to cursor pagination for better scalability.`);
    }
    recommendations.push('BACKWARD COMPATIBILITY: Implement dual pagination support (cursor + legacy skip/limit) to maintain API compatibility during transition.');
    recommendations.push('FRONTEND UPDATES: Update frontend pagination components to use cursor-based pagination for better user experience with large datasets.');
    recommendations.push('MONITORING: Set up performance monitoring to track pagination performance improvements after migration.');
    return recommendations;
}
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
Cursor Pagination Migration Analysis Tool

Usage:
  npm run db:analyze-pagination              # Run full analysis
  npm run db:analyze-pagination -- --help   # Show this help

This tool analyzes your MongoDB collections and provides recommendations
for migrating from skip/limit to cursor-based pagination.

The analysis includes:
- Collection sizes and document counts
- Existing indexes on sort fields
- Estimated performance improvements
- Migration complexity assessment
- Prioritized recommendations

Output:
- Console summary with recommendations
- Detailed JSON report: cursor-pagination-analysis.json
  `);
    process.exit(0);
}
analyzePaginationPerformance();
exports.default = analyzePaginationPerformance;
//# sourceMappingURL=migrateToCursorPagination.js.map