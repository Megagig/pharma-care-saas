"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const ManualLabOrder_1 = __importDefault(require("../models/ManualLabOrder"));
const ManualLabResult_1 = __importDefault(require("../models/ManualLabResult"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
const User_1 = __importDefault(require("../../../models/User"));
const Workplace_1 = __importDefault(require("../../../models/Workplace"));
const Allergy_1 = __importDefault(require("../../../models/Allergy"));
const Medication_1 = __importDefault(require("../../../models/Medication"));
const tokenService_1 = __importDefault(require("./tokenService"));
const pdfGenerationService_1 = require("./pdfGenerationService");
const auditService_1 = __importDefault(require("../../../services/auditService"));
const manualLabAuditService_1 = __importDefault(require("./manualLabAuditService"));
const mtrNotificationService_1 = require("../../../services/mtrNotificationService");
const manualLabCacheService_1 = __importDefault(require("./manualLabCacheService"));
const manualLabPerformanceMiddleware_1 = require("../middlewares/manualLabPerformanceMiddleware");
const services_1 = require("../../diagnostics/services");
const responseHelpers_1 = require("../../../utils/responseHelpers");
class ManualLabService {
    static async createOrder(orderData, auditContext) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const patient = await Patient_1.default.findOne({
                _id: orderData.patientId,
                workplaceId: orderData.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!patient) {
                throw (0, responseHelpers_1.createNotFoundError)('Patient not found or does not belong to this workplace');
            }
            const orderingUser = await User_1.default.findOne({
                _id: orderData.orderedBy,
                workplaceId: orderData.workplaceId,
                role: { $in: ['pharmacist', 'owner'] },
                isDeleted: { $ne: true }
            }).session(session);
            if (!orderingUser) {
                throw (0, responseHelpers_1.createValidationError)('Invalid ordering user or insufficient permissions');
            }
            if (!orderData.consentObtained) {
                throw (0, responseHelpers_1.createValidationError)('Patient consent is required for manual lab orders');
            }
            const orderId = await ManualLabOrder_1.default.generateNextOrderId(orderData.workplaceId);
            const tokens = tokenService_1.default.generateLabOrderTokens(orderId, orderData.workplaceId.toString());
            const order = new ManualLabOrder_1.default({
                orderId,
                patientId: orderData.patientId,
                workplaceId: orderData.workplaceId,
                locationId: orderData.locationId,
                orderedBy: orderData.orderedBy,
                tests: orderData.tests,
                indication: orderData.indication,
                priority: orderData.priority || 'routine',
                notes: orderData.notes,
                consentObtained: orderData.consentObtained,
                consentTimestamp: new Date(),
                consentObtainedBy: orderData.consentObtainedBy,
                requisitionFormUrl: `/api/manual-lab-orders/${orderId}/pdf`,
                barcodeData: tokens.barcodeData,
                status: 'requested',
                createdBy: orderData.orderedBy
            });
            await order.save({ session });
            const workplace = await Workplace_1.default.findById(orderData.workplaceId).session(session);
            if (!workplace) {
                throw (0, responseHelpers_1.createNotFoundError)('Workplace not found');
            }
            const pharmacist = await User_1.default.findById(orderData.orderedBy).session(session);
            if (!pharmacist) {
                throw (0, responseHelpers_1.createNotFoundError)('Pharmacist not found');
            }
            const pdfResult = await pdfGenerationService_1.pdfGenerationService.generateRequisitionPDF(order, patient, workplace, pharmacist);
            order.requisitionFormUrl = pdfResult.url;
            await order.save({ session });
            await manualLabAuditService_1.default.logOrderCreation(auditContext, order, true, pdfResult.metadata?.generatedAt?.getTime());
            await session.commitTransaction();
            await manualLabCacheService_1.default.invalidateOrderCache(orderData.workplaceId, order.orderId, orderData.patientId);
            logger_1.default.info('Manual lab order created successfully', {
                orderId: order.orderId,
                patientId: orderData.patientId,
                workplaceId: orderData.workplaceId,
                testCount: order.tests.length,
                service: 'manual-lab'
            });
            return order;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to create manual lab order', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId: orderData.patientId,
                workplaceId: orderData.workplaceId,
                service: 'manual-lab'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getOrderById(orderId, workplaceId, auditContext) {
        try {
            const cachedOrder = await manualLabCacheService_1.default.getCachedOrder(workplaceId, orderId.toUpperCase());
            if (cachedOrder) {
                if (auditContext) {
                    await auditService_1.default.logActivity(auditContext, {
                        action: 'MANUAL_LAB_ORDER_ACCESSED',
                        resourceType: 'Patient',
                        resourceId: cachedOrder._id,
                        patientId: cachedOrder.patientId,
                        details: {
                            orderId: cachedOrder.orderId,
                            status: cachedOrder.status,
                            accessType: 'view',
                            fromCache: true
                        },
                        complianceCategory: 'data_access',
                        riskLevel: 'low'
                    });
                }
                return cachedOrder;
            }
            const order = await ManualLabOrder_1.default.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId,
                isDeleted: { $ne: true }
            })
                .populate('patientId', 'firstName lastName mrn dateOfBirth')
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email');
            if (order) {
                await manualLabCacheService_1.default.cacheOrder(order);
            }
            if (order && auditContext) {
                await auditService_1.default.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDER_ACCESSED',
                    resourceType: 'Patient',
                    resourceId: order._id,
                    patientId: order.patientId,
                    details: {
                        orderId: order.orderId,
                        status: order.status,
                        accessType: 'view',
                        fromCache: false
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'low'
                });
            }
            return order;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve manual lab order', {
                orderId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }
    static async getOrdersByPatient(patientId, workplaceId, options = {}) {
        try {
            const page = Math.max(1, options.page || 1);
            const limit = Math.min(100, Math.max(1, options.limit || 20));
            if (!options.status && options.sortBy === 'createdAt' && options.sortOrder !== 'asc') {
                const cachedOrders = await manualLabCacheService_1.default.getCachedPatientOrders(workplaceId, patientId, page, limit);
                if (cachedOrders) {
                    const total = await ManualLabOrder_1.default.countDocuments({
                        patientId,
                        workplaceId,
                        isDeleted: { $ne: true }
                    });
                    const pages = Math.ceil(total / limit);
                    return {
                        data: cachedOrders,
                        pagination: {
                            page,
                            limit,
                            total,
                            pages,
                            hasNext: page < pages,
                            hasPrev: page > 1
                        }
                    };
                }
            }
            const skip = (page - 1) * limit;
            const query = {
                patientId,
                workplaceId,
                isDeleted: { $ne: true }
            };
            if (options.status) {
                query.status = options.status;
            }
            const sortBy = options.sortBy || 'createdAt';
            const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
            const sort = { [sortBy]: sortOrder };
            const total = await ManualLabOrder_1.default.countDocuments(query);
            const orders = await ManualLabOrder_1.default.find(query)
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limit);
            if (!options.status && options.sortBy === 'createdAt' && options.sortOrder !== 'asc') {
                await manualLabCacheService_1.default.cachePatientOrders(workplaceId, patientId, orders, page, limit);
            }
            const pages = Math.ceil(total / limit);
            return {
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                    hasNext: page < pages,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve patient lab orders', {
                patientId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }
    static async updateOrderStatus(orderId, statusUpdate, auditContext) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await ManualLabOrder_1.default.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: auditContext.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!order) {
                throw (0, responseHelpers_1.createNotFoundError)('Lab order not found');
            }
            const validTransitions = this.getValidStatusTransitions(order.status);
            if (!validTransitions.includes(statusUpdate.status)) {
                throw (0, responseHelpers_1.createBusinessRuleError)(`Invalid status transition from ${order.status} to ${statusUpdate.status}`);
            }
            const oldStatus = order.status;
            await order.updateStatus(statusUpdate.status, statusUpdate.updatedBy);
            if (statusUpdate.notes) {
                order.notes = statusUpdate.notes;
                await order.save({ session });
            }
            await auditService_1.default.logActivity(auditContext, {
                action: 'MANUAL_LAB_ORDER_STATUS_UPDATED',
                resourceType: 'Patient',
                resourceId: order._id,
                patientId: order.patientId,
                oldValues: { status: oldStatus },
                newValues: { status: statusUpdate.status },
                changedFields: ['status'],
                details: {
                    orderId: order.orderId,
                    oldStatus,
                    newStatus: statusUpdate.status,
                    notes: statusUpdate.notes
                },
                complianceCategory: 'workflow_compliance',
                riskLevel: 'medium'
            });
            await session.commitTransaction();
            logger_1.default.info('Manual lab order status updated', {
                orderId: order.orderId,
                oldStatus,
                newStatus: statusUpdate.status,
                updatedBy: statusUpdate.updatedBy,
                service: 'manual-lab'
            });
            return order;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to update lab order status', {
                orderId,
                statusUpdate,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async addResults(orderId, resultData, auditContext) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await ManualLabOrder_1.default.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: auditContext.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!order) {
                throw (0, responseHelpers_1.createNotFoundError)('Lab order not found');
            }
            if (!['sample_collected', 'result_awaited'].includes(order.status)) {
                throw (0, responseHelpers_1.createBusinessRuleError)('Results can only be added to orders with sample collected or result awaited status');
            }
            const existingResult = await ManualLabResult_1.default.findOne({
                orderId: orderId.toUpperCase(),
                isDeleted: { $ne: true }
            }).session(session);
            if (existingResult) {
                throw (0, responseHelpers_1.createBusinessRuleError)('Results already exist for this order');
            }
            const orderedTestCodes = order.tests.map(test => test.code.toUpperCase());
            const resultTestCodes = resultData.values.map(value => value.testCode.toUpperCase());
            const invalidCodes = resultTestCodes.filter(code => !orderedTestCodes.includes(code));
            if (invalidCodes.length > 0) {
                throw (0, responseHelpers_1.createValidationError)(`Invalid test codes: ${invalidCodes.join(', ')}. Must match ordered tests.`);
            }
            const result = new ManualLabResult_1.default({
                orderId: orderId.toUpperCase(),
                enteredBy: resultData.enteredBy,
                enteredAt: new Date(),
                values: resultData.values.map(value => ({
                    ...value,
                    testCode: value.testCode.toUpperCase()
                })),
                interpretation: [],
                aiProcessed: false,
                reviewNotes: resultData.reviewNotes,
                createdBy: resultData.enteredBy
            });
            this.generateAutoInterpretations(result, order);
            await result.save({ session });
            await order.updateStatus('completed', resultData.enteredBy);
            await auditService_1.default.logActivity(auditContext, {
                action: 'MANUAL_LAB_RESULTS_ENTERED',
                resourceType: 'Patient',
                resourceId: result._id,
                patientId: order.patientId,
                details: {
                    orderId: order.orderId,
                    testCount: result.values.length,
                    hasAbnormalResults: result.hasAbnormalResults(),
                    enteredBy: resultData.enteredBy
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: result.hasAbnormalResults() ? 'high' : 'medium'
            });
            await session.commitTransaction();
            await manualLabCacheService_1.default.cacheResult(result);
            await manualLabCacheService_1.default.invalidateOrderCache(order.workplaceId, order.orderId, order.patientId);
            this.triggerAIInterpretation({
                orderId: order.orderId,
                patientId: order.patientId,
                workplaceId: order.workplaceId,
                labResults: result.values,
                indication: order.indication,
                requestedBy: resultData.enteredBy
            }).catch(error => {
                logger_1.default.error('AI interpretation failed', {
                    orderId: order.orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab'
                });
            });
            logger_1.default.info('Manual lab results entered successfully', {
                orderId: order.orderId,
                resultId: result._id,
                testCount: result.values.length,
                hasAbnormalResults: result.hasAbnormalResults(),
                service: 'manual-lab'
            });
            return result;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to add lab results', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getResultsByOrder(orderId, workplaceId, auditContext) {
        try {
            const cachedResult = await manualLabCacheService_1.default.getCachedResult(orderId.toUpperCase());
            if (cachedResult) {
                const order = await ManualLabOrder_1.default.findOne({
                    orderId: orderId.toUpperCase(),
                    workplaceId,
                    isDeleted: { $ne: true }
                });
                if (!order) {
                    throw (0, responseHelpers_1.createNotFoundError)('Lab order not found');
                }
                if (auditContext) {
                    await auditService_1.default.logActivity(auditContext, {
                        action: 'MANUAL_LAB_RESULTS_ACCESSED',
                        resourceType: 'Patient',
                        resourceId: cachedResult._id,
                        patientId: order.patientId,
                        details: {
                            orderId: cachedResult.orderId,
                            hasAbnormalResults: cachedResult.hasAbnormalResults(),
                            aiProcessed: cachedResult.aiProcessed,
                            accessType: 'view',
                            fromCache: true
                        },
                        complianceCategory: 'data_access',
                        riskLevel: 'low'
                    });
                }
                return cachedResult;
            }
            const order = await ManualLabOrder_1.default.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId,
                isDeleted: { $ne: true }
            });
            if (!order) {
                throw (0, responseHelpers_1.createNotFoundError)('Lab order not found');
            }
            const result = await ManualLabResult_1.default.findOne({
                orderId: orderId.toUpperCase(),
                isDeleted: { $ne: true }
            })
                .populate('enteredBy', 'firstName lastName email role')
                .populate('reviewedBy', 'firstName lastName email role')
                .populate('diagnosticResultId');
            if (result) {
                await manualLabCacheService_1.default.cacheResult(result);
            }
            if (result && auditContext) {
                await auditService_1.default.logActivity(auditContext, {
                    action: 'MANUAL_LAB_RESULTS_ACCESSED',
                    resourceType: 'Patient',
                    resourceId: result._id,
                    patientId: order.patientId,
                    details: {
                        orderId: result.orderId,
                        hasAbnormalResults: result.hasAbnormalResults(),
                        aiProcessed: result.aiProcessed,
                        accessType: 'view',
                        fromCache: false
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'low'
                });
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve lab results', {
                orderId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }
    static async resolveToken(token, auditContext) {
        try {
            const tokenValidation = tokenService_1.default.validateToken(token);
            if (!tokenValidation.valid || !tokenValidation.payload) {
                throw (0, responseHelpers_1.createValidationError)(`Invalid token: ${tokenValidation.error}`);
            }
            const { orderId, workplaceId } = tokenValidation.payload;
            const order = await ManualLabOrder_1.default.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                isDeleted: { $ne: true }
            })
                .populate('patientId', 'firstName lastName mrn')
                .populate('orderedBy', 'firstName lastName email role');
            if (!order) {
                throw (0, responseHelpers_1.createNotFoundError)('Lab order not found or token expired');
            }
            const barcodeData = tokenService_1.default.parseBarcodeData(order.barcodeData);
            if (!barcodeData || !tokenService_1.default.verifyTokenHash(token, barcodeData.tokenHash + '0'.repeat(48))) {
                logger_1.default.warn('Token hash verification failed', {
                    orderId: order.orderId,
                    service: 'manual-lab'
                });
            }
            if (auditContext) {
                await auditService_1.default.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDER_TOKEN_RESOLVED',
                    resourceType: 'Patient',
                    resourceId: order._id,
                    patientId: order.patientId,
                    details: {
                        orderId: order.orderId,
                        tokenType: 'qr_barcode_scan',
                        status: order.status
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'medium'
                });
            }
            logger_1.default.info('Token resolved successfully', {
                orderId: order.orderId,
                workplaceId: order.workplaceId,
                service: 'manual-lab'
            });
            return order;
        }
        catch (error) {
            logger_1.default.error('Failed to resolve token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }
    static async getOrders(filters, auditContext) {
        try {
            const page = Math.max(1, filters.page || 1);
            const limit = Math.min(100, Math.max(1, filters.limit || 20));
            const skip = (page - 1) * limit;
            const query = {
                workplaceId: filters.workplaceId,
                isDeleted: { $ne: true }
            };
            if (filters.patientId)
                query.patientId = filters.patientId;
            if (filters.orderedBy)
                query.orderedBy = filters.orderedBy;
            if (filters.status)
                query.status = filters.status;
            if (filters.priority)
                query.priority = filters.priority;
            if (filters.locationId)
                query.locationId = filters.locationId;
            if (filters.dateFrom || filters.dateTo) {
                query.createdAt = {};
                if (filters.dateFrom)
                    query.createdAt.$gte = filters.dateFrom;
                if (filters.dateTo)
                    query.createdAt.$lte = filters.dateTo;
            }
            if (filters.search) {
                query.$text = { $search: filters.search };
            }
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
            const sort = { [sortBy]: sortOrder };
            const total = await ManualLabOrder_1.default.countDocuments(query);
            const orders = await ManualLabOrder_1.default.find(query)
                .populate('patientId', 'firstName lastName mrn dateOfBirth')
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limit);
            const pages = Math.ceil(total / limit);
            if (auditContext && orders.length > 0) {
                await auditService_1.default.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDERS_BULK_ACCESSED',
                    resourceType: 'Patient',
                    resourceId: new mongoose_1.default.Types.ObjectId(),
                    details: {
                        filterCriteria: filters,
                        resultCount: orders.length,
                        totalCount: total,
                        accessType: 'bulk_view'
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'low'
                });
            }
            return {
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                    hasNext: page < pages,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve lab orders', {
                filters,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }
    static async triggerAIInterpretation(request) {
        try {
            const patient = await Patient_1.default.findById(request.patientId);
            if (!patient) {
                throw (0, responseHelpers_1.createNotFoundError)('Patient not found for AI interpretation');
            }
            const medicationRecords = await Medication_1.default.find({
                patient: request.patientId,
                status: 'active'
            });
            const currentMedications = medicationRecords.map(med => ({
                name: med.drugName,
                dosage: med.instructions.dosage || '',
                frequency: med.instructions.frequency || '',
                route: med.dosageForm,
                startDate: med.createdAt,
                indication: med.therapy.indication
            }));
            const allergyRecords = await Allergy_1.default.find({
                patientId: request.patientId,
                workplaceId: request.workplaceId,
                isDeleted: { $ne: true }
            });
            const allergies = allergyRecords.map(allergy => allergy.substance);
            const age = patient.dob ?
                Math.floor((Date.now() - patient.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
                patient.age;
            const diagnosticRequestData = {
                patientId: request.patientId.toString(),
                pharmacistId: request.requestedBy.toString(),
                workplaceId: request.workplaceId.toString(),
                inputSnapshot: {
                    symptoms: {
                        subjective: [request.indication],
                        objective: [],
                        duration: 'unknown',
                        severity: 'mild',
                        onset: 'chronic'
                    },
                    currentMedications,
                    allergies,
                    medicalHistory: [],
                    labResultIds: [],
                    vitals: patient.latestVitals ? {
                        weight: patient.weightKg,
                        bloodPressure: patient.latestVitals.bpSystolic && patient.latestVitals.bpDiastolic ?
                            `${patient.latestVitals.bpSystolic}/${patient.latestVitals.bpDiastolic}` : undefined,
                        heartRate: undefined,
                        temperature: patient.latestVitals.tempC,
                        respiratoryRate: patient.latestVitals.rr,
                        oxygenSaturation: undefined
                    } : undefined
                },
                priority: 'routine',
                consentObtained: true
            };
            const diagnosticRequest = await services_1.diagnosticService.createDiagnosticRequest(diagnosticRequestData);
            const analysisResult = await services_1.diagnosticService.processDiagnosticRequest(diagnosticRequest._id.toString(), {
                skipInteractionCheck: false,
                skipLabValidation: true,
                retryOnFailure: true,
                maxRetries: 2
            });
            this.validateAIResponse(analysisResult.result);
            const labResult = await ManualLabResult_1.default.findOne({
                orderId: request.orderId.toUpperCase(),
                isDeleted: { $ne: true }
            });
            if (labResult && analysisResult.result) {
                await labResult.markAsAIProcessed(analysisResult.result._id);
            }
            await this.processCriticalAlerts(analysisResult.result, request);
            const order = await ManualLabOrder_1.default.findOne({
                orderId: request.orderId.toUpperCase(),
                workplaceId: request.workplaceId,
                isDeleted: { $ne: true }
            });
            if (order && order.status !== 'completed') {
                await order.updateStatus('completed', request.requestedBy);
            }
            logger_1.default.info('AI interpretation completed', {
                orderId: request.orderId,
                diagnosticRequestId: diagnosticRequest._id,
                diagnosticResultId: analysisResult.result._id,
                processingTime: analysisResult.processingTime,
                hasRedFlags: analysisResult.result.redFlags?.length > 0,
                criticalRedFlags: analysisResult.result.redFlags?.filter(flag => flag.severity === 'critical').length || 0,
                confidenceScore: analysisResult.result.aiMetadata?.confidenceScore,
                service: 'manual-lab'
            });
            return {
                diagnosticRequest,
                diagnosticResult: analysisResult.result,
                processingTime: analysisResult.processingTime,
                interactionResults: analysisResult.interactionResults,
                criticalAlertsTriggered: analysisResult.result.redFlags?.filter(flag => flag.severity === 'critical').length || 0
            };
        }
        catch (error) {
            logger_1.default.error('AI interpretation failed', {
                orderId: request.orderId,
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                service: 'manual-lab'
            });
            return null;
        }
    }
    static validateAIResponse(diagnosticResult) {
        if (!diagnosticResult) {
            throw new Error('AI diagnostic result is null or undefined');
        }
        const requiredFields = ['diagnoses', 'aiMetadata'];
        for (const field of requiredFields) {
            if (!diagnosticResult[field]) {
                throw new Error(`AI response missing required field: ${field}`);
            }
        }
        if (!Array.isArray(diagnosticResult.diagnoses)) {
            throw new Error('AI response diagnoses must be an array');
        }
        for (const diagnosis of diagnosticResult.diagnoses) {
            if (!diagnosis.condition || typeof diagnosis.condition !== 'string') {
                throw new Error('AI response diagnosis missing or invalid condition');
            }
            if (typeof diagnosis.probability !== 'number' || diagnosis.probability < 0 || diagnosis.probability > 1) {
                throw new Error('AI response diagnosis probability must be a number between 0 and 1');
            }
        }
        if (diagnosticResult.redFlags && Array.isArray(diagnosticResult.redFlags)) {
            for (const flag of diagnosticResult.redFlags) {
                if (!flag.flag || typeof flag.flag !== 'string') {
                    throw new Error('AI response red flag missing or invalid flag description');
                }
                if (!['low', 'medium', 'high', 'critical'].includes(flag.severity)) {
                    throw new Error('AI response red flag invalid severity level');
                }
            }
        }
        if (!diagnosticResult.aiMetadata.confidenceScore ||
            typeof diagnosticResult.aiMetadata.confidenceScore !== 'number' ||
            diagnosticResult.aiMetadata.confidenceScore < 0 ||
            diagnosticResult.aiMetadata.confidenceScore > 1) {
            throw new Error('AI response missing or invalid confidence score');
        }
        logger_1.default.debug('AI response validation passed', {
            diagnosesCount: diagnosticResult.diagnoses.length,
            redFlagsCount: diagnosticResult.redFlags?.length || 0,
            confidenceScore: diagnosticResult.aiMetadata.confidenceScore,
            service: 'manual-lab'
        });
    }
    static async processCriticalAlerts(diagnosticResult, request) {
        try {
            if (!diagnosticResult.redFlags || diagnosticResult.redFlags.length === 0) {
                return;
            }
            const criticalFlags = diagnosticResult.redFlags.filter((flag) => flag.severity === 'critical' || flag.severity === 'high');
            if (criticalFlags.length === 0) {
                return;
            }
            for (const flag of criticalFlags) {
                const alert = {
                    type: 'high_severity_dtp',
                    severity: flag.severity === 'critical' ? 'critical' : 'major',
                    patientId: request.patientId,
                    message: `Critical lab result interpretation: ${flag.flag}`,
                    details: {
                        orderId: request.orderId,
                        labResults: request.labResults.map(result => ({
                            testName: result.testName,
                            value: result.numericValue || result.stringValue,
                            unit: result.unit,
                            abnormal: result.abnormalFlag
                        })),
                        aiInterpretation: flag,
                        recommendedAction: flag.action,
                        confidenceScore: diagnosticResult.aiMetadata?.confidenceScore,
                        source: 'manual_lab_ai_interpretation'
                    },
                    requiresImmediate: flag.severity === 'critical'
                };
                await mtrNotificationService_1.mtrNotificationService.sendCriticalAlert(alert);
                logger_1.default.warn('Critical alert sent for lab results', {
                    orderId: request.orderId,
                    patientId: request.patientId,
                    flagSeverity: flag.severity,
                    flag: flag.flag,
                    action: flag.action,
                    service: 'manual-lab'
                });
            }
            const auditContext = {
                userId: request.requestedBy,
                workplaceId: request.workplaceId,
                userRole: 'pharmacist'
            };
            await auditService_1.default.logActivity(auditContext, {
                action: 'MANUAL_LAB_CRITICAL_ALERTS_TRIGGERED',
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                patientId: request.patientId,
                details: {
                    orderId: request.orderId,
                    criticalFlagsCount: criticalFlags.length,
                    flags: criticalFlags.map((flag) => ({
                        severity: flag.severity,
                        flag: flag.flag,
                        action: flag.action
                    })),
                    alertsSent: criticalFlags.length
                },
                complianceCategory: 'patient_safety',
                riskLevel: 'critical'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to process critical alerts', {
                orderId: request.orderId,
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
        }
    }
    static getValidStatusTransitions(currentStatus) {
        const transitions = {
            'requested': ['sample_collected', 'referred'],
            'sample_collected': ['result_awaited', 'referred'],
            'result_awaited': ['completed', 'referred'],
            'completed': ['referred'],
            'referred': []
        };
        return transitions[currentStatus] || [];
    }
    static generateAutoInterpretations(result, order) {
        for (const value of result.values) {
            const orderedTest = order.tests.find(test => test.code.toUpperCase() === value.testCode);
            if (orderedTest?.refRange && value.numericValue !== undefined) {
                const interpretation = this.interpretNumericValue(value.numericValue, orderedTest.refRange, orderedTest.unit || value.unit);
                result.interpretValue(value.testCode, interpretation.level, interpretation.note);
                const valueIndex = result.values.findIndex(v => v.testCode === value.testCode);
                if (valueIndex >= 0 && result.values[valueIndex]) {
                    result.values[valueIndex].abnormalFlag = interpretation.level !== 'normal';
                }
            }
            else {
                result.interpretValue(value.testCode, 'normal');
            }
        }
    }
    static interpretNumericValue(value, refRange, unit) {
        try {
            const rangeMatch = refRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
            const lessThanMatch = refRange.match(/[<≤]\s*(\d+\.?\d*)/);
            const greaterThanMatch = refRange.match(/[>≥]\s*(\d+\.?\d*)/);
            if (rangeMatch) {
                const [, minStr, maxStr] = rangeMatch;
                const min = parseFloat(minStr || '0');
                const max = parseFloat(maxStr || '0');
                if (value < min) {
                    const percentBelow = ((min - value) / min) * 100;
                    return {
                        level: percentBelow > 50 ? 'critical' : 'low',
                        note: `Below normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                }
                else if (value > max) {
                    const percentAbove = ((value - max) / max) * 100;
                    return {
                        level: percentAbove > 50 ? 'critical' : 'high',
                        note: `Above normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                }
                else {
                    return {
                        level: 'normal',
                        note: `Within normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                }
            }
            else if (lessThanMatch) {
                const threshold = parseFloat(lessThanMatch[1] || '0');
                return {
                    level: value >= threshold ? 'high' : 'normal',
                    note: `Reference: ${refRange}${unit ? ' ' + unit : ''}`
                };
            }
            else if (greaterThanMatch) {
                const threshold = parseFloat(greaterThanMatch[1] || '0');
                return {
                    level: value <= threshold ? 'low' : 'normal',
                    note: `Reference: ${refRange}${unit ? ' ' + unit : ''}`
                };
            }
            return {
                level: 'normal',
                note: `Reference: ${refRange}${unit ? ' ' + unit : ''} (auto-interpretation unavailable)`
            };
        }
        catch (error) {
            logger_1.default.warn('Failed to interpret numeric value', {
                value,
                refRange,
                unit,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            return {
                level: 'normal',
                note: `Reference: ${refRange}${unit ? ' ' + unit : ''} (interpretation error)`
            };
        }
    }
    static async logOrderEvent(orderId, event, userId, workplaceId, details = {}) {
        try {
            const auditContext = {
                userId,
                workplaceId,
                userRole: 'pharmacist'
            };
            await auditService_1.default.logActivity(auditContext, {
                action: event,
                resourceType: 'Patient',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                details: {
                    orderId,
                    ...details
                },
                complianceCategory: 'workflow_compliance',
                riskLevel: 'low'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to log order event', {
                orderId,
                event,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
        }
    }
}
__decorate([
    (0, manualLabPerformanceMiddleware_1.MonitorPerformance)('createOrder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ManualLabService, "createOrder", null);
__decorate([
    (0, manualLabPerformanceMiddleware_1.MonitorPerformance)('addResults'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ManualLabService, "addResults", null);
exports.default = ManualLabService;
//# sourceMappingURL=manualLabService.js.map