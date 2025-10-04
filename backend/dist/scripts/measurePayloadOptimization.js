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
const payloadOptimization_1 = require("../utils/payloadOptimization");
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
async function measurePayloadOptimization() {
    try {
        logger_1.default.info('Starting payload optimization measurement');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare';
        await mongoose_1.default.connect(mongoUri);
        logger_1.default.info('Connected to MongoDB');
        const results = [];
        await testPatientOptimization(results);
        await testClinicalNotesOptimization(results);
        await testMedicationOptimization(results);
        await testAuditLogOptimization(results);
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: results.length,
            summary: {
                averageReduction: results.reduce((sum, r) => sum + r.reductionPercent, 0) / results.length,
                totalBytesReduced: results.reduce((sum, r) => sum + r.reductionBytes, 0),
                bestOptimization: results.reduce((best, current) => current.reductionPercent > best.reductionPercent ? current : best),
                worstOptimization: results.reduce((worst, current) => current.reductionPercent < worst.reductionPercent ? current : worst),
            },
            results,
            recommendations: generateRecommendations(results),
        };
        logger_1.default.info('Payload Optimization Summary:', {
            averageReduction: `${report.summary.averageReduction.toFixed(2)}%`,
            totalBytesReduced: `${(report.summary.totalBytesReduced / 1024).toFixed(2)} KB`,
            bestTest: report.summary.bestOptimization.testName,
            bestReduction: `${report.summary.bestOptimization.reductionPercent.toFixed(2)}%`,
        });
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const reportPath = path.join(process.cwd(), 'payload-optimization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        logger_1.default.info(`Detailed report written to: ${reportPath}`);
        console.log('\n=== PAYLOAD OPTIMIZATION RESULTS ===\n');
        console.table(results.map(r => ({
            'Test Name': r.testName,
            'Records': r.recordCount,
            'Original (KB)': (r.originalSize / 1024).toFixed(2),
            'Optimized (KB)': (r.optimizedSize / 1024).toFixed(2),
            'Reduction %': `${r.reductionPercent.toFixed(2)}%`,
            'Processing (ms)': r.processingTime.toFixed(2),
        })));
        console.log('\n=== RECOMMENDATIONS ===\n');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Payload optimization measurement failed:', error);
        process.exit(1);
    }
}
async function testPatientOptimization(results) {
    try {
        const Patient = mongoose_1.default.model('Patient');
        const patients = await Patient.find({}).limit(100).lean();
        if (patients.length === 0) {
            logger_1.default.warn('No patients found for testing');
            return;
        }
        const presets = [
            { name: 'Mobile Preset', ...payloadOptimization_1.OptimizationPresets.mobile },
            { name: 'List Preset', ...payloadOptimization_1.OptimizationPresets.list },
            { name: 'Detail Preset', ...payloadOptimization_1.OptimizationPresets.detail },
        ];
        for (const preset of presets) {
            const startTime = Date.now();
            let optimizedData = payloadOptimization_1.FieldProjection.project(patients, preset.projection);
            optimizedData = payloadOptimization_1.PayloadOptimizer.optimize(optimizedData, preset.optimization);
            const processingTime = Date.now() - startTime;
            const originalSize = Buffer.byteLength(JSON.stringify(patients));
            const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedData));
            const reductionBytes = originalSize - optimizedSize;
            const reductionPercent = (reductionBytes / originalSize) * 100;
            results.push({
                testName: `Patients - ${preset.name}`,
                originalSize,
                optimizedSize,
                reductionBytes,
                reductionPercent,
                processingTime,
                recordCount: patients.length,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error testing patient optimization:', error);
    }
}
async function testClinicalNotesOptimization(results) {
    try {
        const ClinicalNote = mongoose_1.default.model('ClinicalNote');
        const notes = await ClinicalNote.find({}).limit(50).lean();
        if (notes.length === 0) {
            logger_1.default.warn('No clinical notes found for testing');
            return;
        }
        const optimizations = [
            {
                name: 'Standard',
                projection: { exclude: ['__v', 'internalNotes'] },
                optimization: { removeNullValues: true, removeEmptyArrays: true },
            },
            {
                name: 'Aggressive',
                projection: { exclude: ['__v', 'internalNotes', 'attachments'], maxDepth: 3 },
                optimization: {
                    removeNullValues: true,
                    removeEmptyArrays: true,
                    removeEmptyObjects: true,
                    maxStringLength: 500,
                },
            },
            {
                name: 'Mobile',
                projection: {
                    include: ['_id', 'patientId', 'noteType', 'summary', 'createdAt', 'authorId'],
                    maxDepth: 2,
                },
                optimization: {
                    removeNullValues: true,
                    maxStringLength: 200,
                    dateFormat: 'timestamp',
                },
            },
        ];
        for (const opt of optimizations) {
            const startTime = Date.now();
            let optimizedData = payloadOptimization_1.FieldProjection.project(notes, opt.projection);
            optimizedData = payloadOptimization_1.PayloadOptimizer.optimize(optimizedData, opt.optimization);
            const processingTime = Date.now() - startTime;
            const originalSize = Buffer.byteLength(JSON.stringify(notes));
            const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedData));
            const reductionBytes = originalSize - optimizedSize;
            const reductionPercent = (reductionBytes / originalSize) * 100;
            results.push({
                testName: `Clinical Notes - ${opt.name}`,
                originalSize,
                optimizedSize,
                reductionBytes,
                reductionPercent,
                processingTime,
                recordCount: notes.length,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error testing clinical notes optimization:', error);
    }
}
async function testMedicationOptimization(results) {
    try {
        const Medication = mongoose_1.default.model('Medication');
        const medications = await Medication.find({}).limit(100).lean();
        if (medications.length === 0) {
            logger_1.default.warn('No medications found for testing');
            return;
        }
        const startTime = Date.now();
        const optimizedData = payloadOptimization_1.FieldProjection.project(medications, {
            exclude: ['__v', 'internalNotes', 'auditTrail'],
            maxDepth: 4,
        });
        const finalData = payloadOptimization_1.PayloadOptimizer.optimize(optimizedData, {
            removeNullValues: true,
            removeEmptyArrays: true,
            removeEmptyObjects: true,
        });
        const processingTime = Date.now() - startTime;
        const originalSize = Buffer.byteLength(JSON.stringify(medications));
        const optimizedSize = Buffer.byteLength(JSON.stringify(finalData));
        const reductionBytes = originalSize - optimizedSize;
        const reductionPercent = (reductionBytes / originalSize) * 100;
        results.push({
            testName: 'Medications - Standard',
            originalSize,
            optimizedSize,
            reductionBytes,
            reductionPercent,
            processingTime,
            recordCount: medications.length,
        });
    }
    catch (error) {
        logger_1.default.error('Error testing medication optimization:', error);
    }
}
async function testAuditLogOptimization(results) {
    try {
        const AuditLog = mongoose_1.default.model('AuditLog');
        const auditLogs = await AuditLog.find({}).limit(200).lean();
        if (auditLogs.length === 0) {
            logger_1.default.warn('No audit logs found for testing');
            return;
        }
        const startTime = Date.now();
        const optimizedData = payloadOptimization_1.FieldProjection.project(auditLogs, {
            exclude: ['__v', 'rawRequest', 'rawResponse'],
            maxDepth: 3,
            maxArrayLength: 10,
        });
        const finalData = payloadOptimization_1.PayloadOptimizer.optimize(optimizedData, {
            removeNullValues: true,
            removeEmptyArrays: true,
            removeEmptyObjects: true,
            maxStringLength: 1000,
            dateFormat: 'timestamp',
        });
        const processingTime = Date.now() - startTime;
        const originalSize = Buffer.byteLength(JSON.stringify(auditLogs));
        const optimizedSize = Buffer.byteLength(JSON.stringify(finalData));
        const reductionBytes = originalSize - optimizedSize;
        const reductionPercent = (reductionBytes / originalSize) * 100;
        results.push({
            testName: 'Audit Logs - Optimized',
            originalSize,
            optimizedSize,
            reductionBytes,
            reductionPercent,
            processingTime,
            recordCount: auditLogs.length,
        });
    }
    catch (error) {
        logger_1.default.error('Error testing audit log optimization:', error);
    }
}
function generateRecommendations(results) {
    const recommendations = [];
    const bestReduction = Math.max(...results.map(r => r.reductionPercent));
    const avgReduction = results.reduce((sum, r) => sum + r.reductionPercent, 0) / results.length;
    if (avgReduction > 30) {
        recommendations.push(`EXCELLENT: Average payload reduction of ${avgReduction.toFixed(1)}% achieved. Deploy optimizations to production.`);
    }
    else if (avgReduction > 15) {
        recommendations.push(`GOOD: Average payload reduction of ${avgReduction.toFixed(1)}% achieved. Consider deploying for high-traffic endpoints.`);
    }
    else {
        recommendations.push(`MODERATE: Average payload reduction of ${avgReduction.toFixed(1)}% achieved. Focus on endpoints with large payloads.`);
    }
    const highImpact = results.filter(r => r.reductionPercent > 40);
    if (highImpact.length > 0) {
        recommendations.push(`HIGH IMPACT: ${highImpact.map(r => r.testName).join(', ')} show >40% reduction. Prioritize these optimizations.`);
    }
    const slowOptimizations = results.filter(r => r.processingTime > 100);
    if (slowOptimizations.length > 0) {
        recommendations.push(`PERFORMANCE: ${slowOptimizations.map(r => r.testName).join(', ')} take >100ms to process. Consider caching optimized responses.`);
    }
    const totalReduction = results.reduce((sum, r) => sum + r.reductionBytes, 0);
    if (totalReduction > 100 * 1024) {
        recommendations.push(`COMPRESSION: Total reduction of ${(totalReduction / 1024).toFixed(1)}KB suggests gzip/brotli compression will be highly effective.`);
    }
    const mobileTests = results.filter(r => r.testName.includes('Mobile'));
    if (mobileTests.length > 0) {
        const avgMobileReduction = mobileTests.reduce((sum, r) => sum + r.reductionPercent, 0) / mobileTests.length;
        recommendations.push(`MOBILE: Mobile optimizations achieve ${avgMobileReduction.toFixed(1)}% reduction on average. Implement for mobile API endpoints.`);
    }
    return recommendations;
}
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
Payload Optimization Measurement Tool

Usage:
  npm run measure:payload-optimization              # Run full measurement
  npm run measure:payload-optimization -- --help   # Show this help

This tool measures the impact of different payload optimization strategies
on real data from your MongoDB collections.

The measurement includes:
- Field projection optimization
- Payload size reduction techniques
- Processing time analysis
- Compression effectiveness estimation

Output:
- Console summary with recommendations
- Detailed JSON report: payload-optimization-report.json
  `);
    process.exit(0);
}
measurePayloadOptimization();
exports.default = measurePayloadOptimization;
//# sourceMappingURL=measurePayloadOptimization.js.map