#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeReportIndexes = initializeReportIndexes;
exports.cleanupUnusedIndexes = cleanupUnusedIndexes;
exports.analyzePerformance = analyzePerformance;
const mongoose_1 = __importDefault(require("mongoose"));
const databaseIndexing_1 = __importDefault(require("../utils/databaseIndexing"));
const logger_1 = __importDefault(require("../utils/logger"));
async function initializeReportIndexes() {
    try {
        logger_1.default.info('Starting database index initialization...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_db';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const indexingService = databaseIndexing_1.default.getInstance();
        await indexingService.createReportIndexes();
        const recommendations = await indexingService.analyzeQueryPerformance();
        if (recommendations.length > 0) {
            logger_1.default.info('Index recommendations generated:');
            recommendations.forEach((rec, index) => {
                logger_1.default.info(`${index + 1}. ${rec.collection}: ${rec.reason} (Priority: ${rec.priority})`);
                logger_1.default.info(`   Recommended index: ${JSON.stringify(rec.index.fields)}`);
                logger_1.default.info(`   Estimated impact: ${rec.estimatedImpact}`);
            });
        }
        const indexStats = await indexingService.getIndexStats();
        logger_1.default.info(`Index statistics collected for ${indexStats.length} collections`);
        logger_1.default.info('Database index initialization completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize database indexes:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info('Disconnected from MongoDB');
    }
}
async function cleanupUnusedIndexes() {
    try {
        logger_1.default.info('Starting unused index cleanup...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_db';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const indexingService = databaseIndexing_1.default.getInstance();
        await indexingService.dropUnusedIndexes();
        logger_1.default.info('Unused index cleanup completed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to cleanup unused indexes:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info('Disconnected from MongoDB');
    }
}
async function analyzePerformance() {
    try {
        logger_1.default.info('Starting query performance analysis...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_db';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const indexingService = databaseIndexing_1.default.getInstance();
        const recommendations = await indexingService.analyzeQueryPerformance();
        if (recommendations.length === 0) {
            logger_1.default.info('No performance issues detected. All queries are performing well.');
        }
        else {
            logger_1.default.info(`Found ${recommendations.length} performance optimization opportunities:`);
            recommendations.forEach((rec, index) => {
                logger_1.default.info(`\n${index + 1}. Collection: ${rec.collection}`);
                logger_1.default.info(`   Priority: ${rec.priority.toUpperCase()}`);
                logger_1.default.info(`   Issue: ${rec.reason}`);
                logger_1.default.info(`   Recommended Index: ${JSON.stringify(rec.index.fields, null, 2)}`);
                logger_1.default.info(`   Expected Impact: ${rec.estimatedImpact}`);
                if (rec.index.options?.name) {
                    logger_1.default.info(`   Index Name: ${rec.index.options.name}`);
                }
            });
            logger_1.default.info('\n=== MongoDB Commands for Manual Execution ===');
            recommendations.forEach((rec, index) => {
                const collectionName = rec.collection;
                const indexFields = JSON.stringify(rec.index.fields);
                const indexOptions = rec.index.options ? JSON.stringify(rec.index.options) : '{}';
                logger_1.default.info(`\n// Recommendation ${index + 1}: ${rec.reason}`);
                logger_1.default.info(`db.${collectionName}.createIndex(${indexFields}, ${indexOptions});`);
            });
        }
        const indexStats = await indexingService.getIndexStats();
        logger_1.default.info(`\n=== Current Index Statistics ===`);
        indexStats.forEach(stat => {
            logger_1.default.info(`\nCollection: ${stat.collection}`);
            stat.indexes.forEach((idx) => {
                logger_1.default.info(`  - ${idx.name}: ${idx.accesses?.ops || 0} operations`);
            });
        });
        logger_1.default.info('Query performance analysis completed');
    }
    catch (error) {
        logger_1.default.error('Failed to analyze query performance:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        logger_1.default.info('Disconnected from MongoDB');
    }
}
const command = process.argv[2];
switch (command) {
    case 'init':
        initializeReportIndexes();
        break;
    case 'cleanup':
        cleanupUnusedIndexes();
        break;
    case 'analyze':
        analyzePerformance();
        break;
    default:
        console.log('Usage: npm run db:indexes <command>');
        console.log('Commands:');
        console.log('  init     - Initialize all report indexes');
        console.log('  cleanup  - Remove unused indexes');
        console.log('  analyze  - Analyze query performance and generate recommendations');
        console.log('');
        console.log('Examples:');
        console.log('  npm run db:indexes init');
        console.log('  npm run db:indexes analyze');
        console.log('  npm run db:indexes cleanup');
        process.exit(1);
}
//# sourceMappingURL=initializeReportIndexes.js.map