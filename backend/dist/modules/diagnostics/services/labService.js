"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabService = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const LabResult_1 = __importDefault(require("../models/LabResult"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
const fhirService_1 = __importDefault(require("./fhirService"));
class LabService {
    async createLabOrder(orderData) {
        try {
            const patient = await Patient_1.default.findOne({
                _id: orderData.patientId,
                workplaceId: orderData.workplaceId,
            });
            if (!patient) {
                throw new Error('Patient not found or does not belong to this workplace');
            }
            const labOrder = new LabOrder_1.default({
                patientId: new mongoose_1.Types.ObjectId(orderData.patientId),
                orderedBy: new mongoose_1.Types.ObjectId(orderData.orderedBy),
                workplaceId: new mongoose_1.Types.ObjectId(orderData.workplaceId),
                locationId: orderData.locationId,
                tests: orderData.tests,
                status: 'ordered',
                orderDate: new Date(),
                expectedDate: orderData.expectedDate,
                externalOrderId: orderData.externalOrderId,
            });
            const savedOrder = await labOrder.save();
            logger_1.default.info('Lab order created successfully', {
                orderId: savedOrder._id,
                patientId: orderData.patientId,
                testsCount: orderData.tests.length,
                workplaceId: orderData.workplaceId,
            });
            return savedOrder;
        }
        catch (error) {
            logger_1.default.error('Failed to create lab order:', error);
            throw new Error(`Failed to create lab order: ${error}`);
        }
    }
    async getLabOrders(workplaceId, filters = {}, page = 1, limit = 20) {
        try {
            const query = { workplaceId: new mongoose_1.Types.ObjectId(workplaceId) };
            if (filters.patientId) {
                query.patientId = new mongoose_1.Types.ObjectId(filters.patientId);
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.priority) {
                query['tests.priority'] = filters.priority;
            }
            if (filters.testCode) {
                query['tests.code'] = filters.testCode;
            }
            if (filters.dateFrom || filters.dateTo) {
                query.orderDate = {};
                if (filters.dateFrom) {
                    query.orderDate.$gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    query.orderDate.$lte = filters.dateTo;
                }
            }
            const skip = (page - 1) * limit;
            const [orders, total] = await Promise.all([
                LabOrder_1.default.find(query)
                    .populate('patientId', 'firstName lastName dateOfBirth')
                    .populate('orderedBy', 'firstName lastName')
                    .sort({ orderDate: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                LabOrder_1.default.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit);
            logger_1.default.info('Lab orders retrieved', {
                workplaceId,
                total,
                page,
                filters: Object.keys(filters).length,
            });
            return {
                orders: orders,
                total,
                page,
                totalPages,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get lab orders:', error);
            throw new Error(`Failed to retrieve lab orders: ${error}`);
        }
    }
    async updateLabOrderStatus(orderId, status, workplaceId) {
        try {
            const updatedOrder = await LabOrder_1.default.findOneAndUpdate({
                _id: orderId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            }, {
                status,
                updatedAt: new Date(),
            }, { new: true });
            if (!updatedOrder) {
                throw new Error('Lab order not found or access denied');
            }
            logger_1.default.info('Lab order status updated', {
                orderId,
                status,
                workplaceId,
            });
            return updatedOrder;
        }
        catch (error) {
            logger_1.default.error('Failed to update lab order status:', error);
            throw new Error(`Failed to update lab order status: ${error}`);
        }
    }
    async addLabResult(resultData) {
        try {
            const patient = await Patient_1.default.findOne({
                _id: resultData.patientId,
                workplaceId: resultData.workplaceId,
            });
            if (!patient) {
                throw new Error('Patient not found or does not belong to this workplace');
            }
            if (resultData.orderId) {
                const labOrder = await LabOrder_1.default.findOne({
                    _id: resultData.orderId,
                    workplaceId: new mongoose_1.Types.ObjectId(resultData.workplaceId),
                });
                if (!labOrder) {
                    throw new Error('Lab order not found or access denied');
                }
            }
            const validation = await this.validateResult({
                testCode: resultData.testCode,
                testName: resultData.testName,
                value: resultData.value,
                unit: resultData.unit,
                referenceRange: resultData.referenceRange,
            });
            const labResult = new LabResult_1.default({
                orderId: resultData.orderId ? new mongoose_1.Types.ObjectId(resultData.orderId) : undefined,
                patientId: new mongoose_1.Types.ObjectId(resultData.patientId),
                workplaceId: new mongoose_1.Types.ObjectId(resultData.workplaceId),
                testCode: resultData.testCode,
                testName: resultData.testName,
                value: resultData.value,
                unit: resultData.unit,
                referenceRange: resultData.referenceRange,
                interpretation: validation.interpretation,
                flags: validation.flags,
                source: resultData.source || 'manual',
                performedAt: resultData.performedAt,
                recordedAt: new Date(),
                recordedBy: new mongoose_1.Types.ObjectId(resultData.recordedBy),
                externalResultId: resultData.externalResultId,
                loincCode: resultData.loincCode,
            });
            const savedResult = await labResult.save();
            if (resultData.orderId) {
                await this.updateLabOrderStatus(resultData.orderId, 'completed', resultData.workplaceId);
            }
            logger_1.default.info('Lab result added successfully', {
                resultId: savedResult._id,
                patientId: resultData.patientId,
                testCode: resultData.testCode,
                interpretation: validation.interpretation,
                workplaceId: resultData.workplaceId,
            });
            return savedResult;
        }
        catch (error) {
            logger_1.default.error('Failed to add lab result:', error);
            throw new Error(`Failed to add lab result: ${error}`);
        }
    }
    async getLabResults(workplaceId, filters = {}, page = 1, limit = 20) {
        try {
            const query = { workplaceId: new mongoose_1.Types.ObjectId(workplaceId) };
            if (filters.patientId) {
                query.patientId = new mongoose_1.Types.ObjectId(filters.patientId);
            }
            if (filters.testCode) {
                query.testCode = filters.testCode;
            }
            if (filters.interpretation) {
                query.interpretation = filters.interpretation;
            }
            if (filters.source) {
                query.source = filters.source;
            }
            if (filters.dateFrom || filters.dateTo) {
                query.performedAt = {};
                if (filters.dateFrom) {
                    query.performedAt.$gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    query.performedAt.$lte = filters.dateTo;
                }
            }
            const skip = (page - 1) * limit;
            const [results, total] = await Promise.all([
                LabResult_1.default.find(query)
                    .populate('patientId', 'firstName lastName dateOfBirth')
                    .populate('recordedBy', 'firstName lastName')
                    .sort({ performedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                LabResult_1.default.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit);
            logger_1.default.info('Lab results retrieved', {
                workplaceId,
                total,
                page,
                filters: Object.keys(filters).length,
            });
            return {
                results: results,
                total,
                page,
                totalPages,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get lab results:', error);
            throw new Error(`Failed to retrieve lab results: ${error}`);
        }
    }
    async validateResult(result) {
        try {
            const flags = [];
            const recommendations = [];
            let interpretation = 'normal';
            const numericValue = this.parseNumericValue(result.value);
            if (numericValue !== null && result.referenceRange) {
                if (result.referenceRange.low !== undefined && numericValue < result.referenceRange.low) {
                    interpretation = 'low';
                    flags.push('Below reference range');
                    if (this.isCriticalLow(result.testCode, numericValue)) {
                        interpretation = 'critical';
                        flags.push('CRITICAL LOW');
                        recommendations.push('Immediate clinical attention required');
                    }
                }
                else if (result.referenceRange.high !== undefined && numericValue > result.referenceRange.high) {
                    interpretation = 'high';
                    flags.push('Above reference range');
                    if (this.isCriticalHigh(result.testCode, numericValue)) {
                        interpretation = 'critical';
                        flags.push('CRITICAL HIGH');
                        recommendations.push('Immediate clinical attention required');
                    }
                }
            }
            else {
                interpretation = this.interpretQualitativeResult(result.value, result.testCode);
                if (interpretation === 'abnormal') {
                    flags.push('Abnormal result');
                    recommendations.push('Clinical correlation recommended');
                }
            }
            const testRecommendations = this.getTestSpecificRecommendations(result.testCode, interpretation, numericValue);
            recommendations.push(...testRecommendations);
            return {
                isValid: true,
                interpretation,
                flags,
                recommendations,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to validate lab result:', error);
            return {
                isValid: false,
                interpretation: 'abnormal',
                flags: ['Validation error'],
                recommendations: ['Manual review required'],
            };
        }
    }
    async getResultTrends(patientId, testCode, workplaceId, daysBack = 90) {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - daysBack);
            const results = await LabResult_1.default.find({
                patientId: new mongoose_1.Types.ObjectId(patientId),
                testCode,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                performedAt: { $gte: dateFrom },
            })
                .sort({ performedAt: 1 })
                .lean();
            if (results.length < 2) {
                return {
                    testCode,
                    testName: results[0]?.testName || testCode,
                    results: [],
                    trend: 'insufficient_data',
                    analysis: {
                        averageValue: 0,
                        changePercent: 0,
                        timeSpan: 0,
                    },
                };
            }
            const numericResults = results
                .map(result => ({
                value: this.parseNumericValue(result.value),
                unit: result.unit || '',
                performedAt: result.performedAt,
                interpretation: result.interpretation,
            }))
                .filter(result => result.value !== null);
            if (numericResults.length < 2) {
                return {
                    testCode,
                    testName: results[0].testName,
                    results: [],
                    trend: 'insufficient_data',
                    analysis: {
                        averageValue: 0,
                        changePercent: 0,
                        timeSpan: 0,
                    },
                };
            }
            const firstValue = numericResults[0].value;
            const lastValue = numericResults[numericResults.length - 1].value;
            const averageValue = numericResults.reduce((sum, r) => sum + r.value, 0) / numericResults.length;
            const changePercent = ((lastValue - firstValue) / firstValue) * 100;
            const timeSpan = Math.ceil((numericResults[numericResults.length - 1].performedAt.getTime() -
                numericResults[0].performedAt.getTime()) / (1000 * 60 * 60 * 24));
            let trend = 'stable';
            if (Math.abs(changePercent) < 5) {
                trend = 'stable';
            }
            else {
                const isImprovingTrend = this.isImprovingTrend(testCode, changePercent);
                trend = isImprovingTrend ? 'improving' : 'worsening';
            }
            logger_1.default.info('Result trends calculated', {
                patientId,
                testCode,
                resultsCount: numericResults.length,
                trend,
                changePercent: Math.round(changePercent * 100) / 100,
            });
            return {
                testCode,
                testName: results[0].testName,
                results: numericResults,
                trend,
                analysis: {
                    averageValue: Math.round(averageValue * 100) / 100,
                    changePercent: Math.round(changePercent * 100) / 100,
                    timeSpan,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get result trends:', error);
            throw new Error(`Failed to get result trends: ${error}`);
        }
    }
    parseNumericValue(value) {
        const cleaned = value.replace(/[<>≤≥±~]/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    isCriticalLow(testCode, value) {
        const criticalLowValues = {
            'GLU': 40,
            'K': 2.5,
            'NA': 120,
            'HGB': 6.0,
            'PLT': 20000,
            'WBC': 1.0,
        };
        const threshold = criticalLowValues[testCode.toUpperCase()];
        return threshold !== undefined && value < threshold;
    }
    isCriticalHigh(testCode, value) {
        const criticalHighValues = {
            'GLU': 400,
            'K': 6.5,
            'CREA': 5.0,
            'WBC': 50.0,
            'TEMP': 40.0,
        };
        const threshold = criticalHighValues[testCode.toUpperCase()];
        return threshold !== undefined && value > threshold;
    }
    interpretQualitativeResult(value, testCode) {
        const normalValues = ['negative', 'normal', 'within normal limits', 'wnl', 'neg'];
        const abnormalValues = ['positive', 'abnormal', 'elevated', 'pos'];
        const lowerValue = value.toLowerCase().trim();
        if (normalValues.some(normal => lowerValue.includes(normal))) {
            return 'normal';
        }
        if (abnormalValues.some(abnormal => lowerValue.includes(abnormal))) {
            return 'abnormal';
        }
        return 'abnormal';
    }
    getTestSpecificRecommendations(testCode, interpretation, value) {
        const recommendations = [];
        switch (testCode.toUpperCase()) {
            case 'GLU':
                if (interpretation === 'high') {
                    recommendations.push('Monitor for diabetes', 'Consider HbA1c if not recent');
                }
                else if (interpretation === 'low') {
                    recommendations.push('Evaluate for hypoglycemia causes', 'Monitor symptoms');
                }
                break;
            case 'CREA':
                if (interpretation === 'high') {
                    recommendations.push('Assess kidney function', 'Review medications for nephrotoxicity');
                }
                break;
            case 'K':
                if (interpretation === 'high') {
                    recommendations.push('Check ECG for hyperkalemia changes', 'Review ACE inhibitors');
                }
                else if (interpretation === 'low') {
                    recommendations.push('Consider potassium supplementation', 'Monitor for arrhythmias');
                }
                break;
            case 'HGB':
                if (interpretation === 'low') {
                    recommendations.push('Evaluate for anemia causes', 'Consider iron studies');
                }
                break;
            default:
                if (interpretation === 'critical') {
                    recommendations.push('Immediate clinical correlation required');
                }
                else if (interpretation === 'abnormal') {
                    recommendations.push('Clinical correlation recommended');
                }
        }
        return recommendations;
    }
    isImprovingTrend(testCode, changePercent) {
        const increasingIsBetter = ['HGB', 'PLT', 'ALB'];
        const decreasingIsBetter = ['GLU', 'CREA', 'CHOL', 'LDL'];
        const upperTestCode = testCode.toUpperCase();
        if (increasingIsBetter.includes(upperTestCode)) {
            return changePercent > 0;
        }
        if (decreasingIsBetter.includes(upperTestCode)) {
            return changePercent < 0;
        }
        return Math.abs(changePercent) < 10;
    }
    async getLabOrderById(orderId, workplaceId) {
        try {
            const order = await LabOrder_1.default.findOne({
                _id: orderId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            })
                .populate('patientId', 'firstName lastName dateOfBirth')
                .populate('orderedBy', 'firstName lastName')
                .lean();
            return order;
        }
        catch (error) {
            logger_1.default.error('Failed to get lab order by ID:', error);
            throw new Error(`Failed to get lab order: ${error}`);
        }
    }
    async getLabResultById(resultId, workplaceId) {
        try {
            const result = await LabResult_1.default.findOne({
                _id: resultId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            })
                .populate('patientId', 'firstName lastName dateOfBirth')
                .populate('recordedBy', 'firstName lastName')
                .lean();
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to get lab result by ID:', error);
            throw new Error(`Failed to get lab result: ${error}`);
        }
    }
    async updateLabOrder(orderId, updates, updatedBy) {
        try {
            const updatedOrder = await LabOrder_1.default.findByIdAndUpdate(orderId, {
                ...updates,
                updatedAt: new Date(),
                updatedBy: new mongoose_1.Types.ObjectId(updatedBy),
            }, { new: true });
            if (!updatedOrder) {
                throw new Error('Lab order not found');
            }
            logger_1.default.info('Lab order updated', { orderId, updates: Object.keys(updates) });
            return updatedOrder;
        }
        catch (error) {
            logger_1.default.error('Failed to update lab order:', error);
            throw new Error(`Failed to update lab order: ${error}`);
        }
    }
    async cancelLabOrder(orderId, cancelledBy) {
        try {
            const cancelledOrder = await LabOrder_1.default.findByIdAndUpdate(orderId, {
                status: 'cancelled',
                updatedAt: new Date(),
                updatedBy: new mongoose_1.Types.ObjectId(cancelledBy),
            }, { new: true });
            if (!cancelledOrder) {
                throw new Error('Lab order not found');
            }
            logger_1.default.info('Lab order cancelled', { orderId, cancelledBy });
            return cancelledOrder;
        }
        catch (error) {
            logger_1.default.error('Failed to cancel lab order:', error);
            throw new Error(`Failed to cancel lab order: ${error}`);
        }
    }
    async updateLabResult(resultId, updates, updatedBy) {
        try {
            const updatedResult = await LabResult_1.default.findByIdAndUpdate(resultId, {
                ...updates,
                updatedAt: new Date(),
                updatedBy: new mongoose_1.Types.ObjectId(updatedBy),
            }, { new: true });
            if (!updatedResult) {
                throw new Error('Lab result not found');
            }
            logger_1.default.info('Lab result updated', { resultId, updates: Object.keys(updates) });
            return updatedResult;
        }
        catch (error) {
            logger_1.default.error('Failed to update lab result:', error);
            throw new Error(`Failed to update lab result: ${error}`);
        }
    }
    async importFHIRResults(fhirBundle, patientMappings, workplaceId, importedBy) {
        try {
            const fhirConfig = {
                baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
                version: 'R4',
                timeout: 30000,
                retryAttempts: 3,
            };
            const fhirService = new fhirService_1.default(fhirConfig);
            const importResult = await fhirService.importLabResults(fhirBundle, patientMappings);
            logger_1.default.info('FHIR lab results import completed', {
                workplaceId,
                importedBy,
                bundleId: fhirBundle.id,
                imported: importResult.imported.length,
                failed: importResult.failed.length,
            });
            return importResult;
        }
        catch (error) {
            logger_1.default.error('Failed to import FHIR lab results:', error);
            throw new Error(`Failed to import FHIR lab results: ${error}`);
        }
    }
    async exportLabOrderToFHIR(orderId, workplaceId) {
        try {
            const labOrder = await LabOrder_1.default.findOne({
                _id: orderId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            });
            if (!labOrder) {
                throw new Error('Lab order not found');
            }
            const fhirConfig = {
                baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
                version: 'R4',
                timeout: 30000,
                retryAttempts: 3,
            };
            const fhirService = new fhirService_1.default(fhirConfig);
            const fhirServiceRequest = await fhirService.exportLabOrder(labOrder);
            logger_1.default.info('Lab order exported to FHIR format', {
                orderId,
                workplaceId,
                fhirId: fhirServiceRequest.id,
            });
            return fhirServiceRequest;
        }
        catch (error) {
            logger_1.default.error('Failed to export lab order to FHIR:', error);
            throw new Error(`Failed to export lab order to FHIR: ${error}`);
        }
    }
    async syncLabResultsFromFHIR(patientId, workplaceId, fromDate, toDate) {
        try {
            const fhirConfig = {
                baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
                version: 'R4',
                timeout: 30000,
                retryAttempts: 3,
            };
            const fhirService = new fhirService_1.default(fhirConfig);
            const fhirBundle = await fhirService.fetchLabResults(patientId, fromDate, toDate);
            const patientMappings = [{
                    fhirPatientId: patientId,
                    internalPatientId: patientId,
                    workplaceId,
                }];
            const importResult = await fhirService.importLabResults(fhirBundle, patientMappings);
            logger_1.default.info('Lab results synced from FHIR server', {
                patientId,
                workplaceId,
                synced: importResult.imported.length,
                errors: importResult.failed.length,
            });
            return {
                synced: importResult.imported.length,
                errors: importResult.failed.map(f => f.error),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to sync lab results from FHIR:', error);
            throw new Error(`Failed to sync lab results from FHIR: ${error}`);
        }
    }
    async testFHIRConnection() {
        try {
            const fhirConfig = {
                baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
                version: 'R4',
                timeout: 30000,
                retryAttempts: 3,
            };
            const fhirService = new fhirService_1.default(fhirConfig);
            const connected = await fhirService.testConnection();
            return { connected };
        }
        catch (error) {
            logger_1.default.error('FHIR connection test failed:', error);
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async deleteLabOrder(orderId, workplaceId) {
        try {
            const result = await LabOrder_1.default.findOneAndUpdate({
                _id: orderId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            }, {
                status: 'cancelled',
                updatedAt: new Date(),
            });
            if (!result) {
                throw new Error('Lab order not found or access denied');
            }
            logger_1.default.info('Lab order cancelled', { orderId, workplaceId });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to delete lab order:', error);
            throw new Error(`Failed to delete lab order: ${error}`);
        }
    }
}
exports.LabService = LabService;
exports.default = new LabService();
//# sourceMappingURL=labService.js.map