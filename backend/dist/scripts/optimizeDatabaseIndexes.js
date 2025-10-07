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
const PerformanceDatabaseOptimizer_1 = __importDefault(require("../services/PerformanceDatabaseOptimizer"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
async function optimizeDatabaseIndexes() {
    try {
        logger_1.default.info('Starting database index optimization script');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PharmacyCopilot';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const optimizer = PerformanceDatabaseOptimizer_1.default.getInstance();
        logger_1.default.info('Analyzing existing indexes...');
        const analysis = await optimizer.analyzeExistingIndexes();
        logger_1.default.info('Existing index analysis:', {
            collections: analysis.collections.length,
            totalIndexes: analysis.totalIndexes,
        });
        logger_1.default.info('Creating optimized indexes...');
        const result = await optimizer.createAllOptimizedIndexes();
        logger_1.default.info('Database optimization completed:', {
            totalIndexes: result.totalIndexes,
            successful: result.successfulIndexes,
            failed: result.failedIndexes,
            executionTime: `${result.executionTime}ms`,
        });
        if (result.failedIndexes > 0) {
            logger_1.default.warn('Failed index creations:');
            result.results
                .filter(r => !r.created)
                .forEach(r => {
                logger_1.default.warn(`  ${r.collection}: ${JSON.stringify(r.indexSpec)} - ${r.error}`);
            });
        }
        logger_1.default.info('Successfully created indexes:');
        result.results
            .filter(r => r.created)
            .forEach(r => {
            logger_1.default.info(`  ${r.collection}: ${JSON.stringify(r.indexSpec)} (${r.executionTime}ms)`);
        });
        const summary = {
            timestamp: new Date().toISOString(),
            totalCollections: analysis.collections.length,
            existingIndexes: analysis.totalIndexes,
            newIndexesAttempted: result.totalIndexes,
            newIndexesCreated: result.successfulIndexes,
            newIndexesFailed: result.failedIndexes,
            totalExecutionTime: result.executionTime,
            collections: result.results.reduce((acc, r) => {
                if (!acc[r.collection]) {
                    acc[r.collection] = { attempted: 0, created: 0, failed: 0 };
                }
                acc[r.collection].attempted++;
                if (r.created) {
                    acc[r.collection].created++;
                }
                else {
                    acc[r.collection].failed++;
                }
                return acc;
            }, {}),
        };
        logger_1.default.info('Optimization Summary:', summary);
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const summaryPath = path.join(process.cwd(), 'database-optimization-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        logger_1.default.info(`Summary written to: ${summaryPath}`);
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Database optimization failed:', error);
        process.exit(1);
    }
}
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const analyze = args.includes('--analyze');
if (analyze) {
    (async () => {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PharmacyCopilot');
            const optimizer = PerformanceDatabaseOptimizer_1.default.getInstance();
            const analysis = await optimizer.analyzeExistingIndexes();
            console.log('Index Analysis:', JSON.stringify(analysis, null, 2));
            process.exit(0);
        }
        catch (error) {
            console.error('Analysis failed:', error);
            process.exit(1);
        }
    })();
}
else if (dryRun) {
    logger_1.default.info('DRY RUN MODE - No indexes will be created');
    process.exit(0);
}
else {
    optimizeDatabaseIndexes();
}
exports.default = optimizeDatabaseIndexes;
//# sourceMappingURL=optimizeDatabaseIndexes.js.map