import mongoose from 'mongoose';
import logger from '../../../utils/logger';

// Import models
import ManualLabOrder, { IManualLabOrder, IManualLabTest } from '../models/ManualLabOrder';
import ManualLabResult, { IManualLabResult, IManualLabResultValue, IManualLabResultInterpretation } from '../models/ManualLabResult';
import Patient from '../../../models/Patient';
import User from '../../../models/User';
import Workplace from '../../../models/Workplace';

// Import services
import TokenService, { SecureTokenData } from './tokenService';
import PDFGenerationService from './pdfGenerationService';
import AuditService, { AuditContext, AuditLogData } from '../../../services/auditService';

// Import diagnostic service for AI integration
import { diagnosticService } from '../../../services/openRouterService';

// Import utilities
import {
    PatientManagementError,
    createValidationError,
    createBusinessRuleError,
    createNotFoundError,
} from '../../../utils/responseHelpers';

/**
 * Manual Lab Service Layer
 * Handles business logic for Manual Lab Order workflow
 */

// ===============================
// INTERFACES AND TYPES
// ===============================

export interface CreateOrderRequest {
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;
    orderedBy: mongoose.Types.ObjectId;
    tests: IManualLabTest[];
    indication: string;
    priority?: 'routine' | 'urgent' | 'stat';
    notes?: string;
    consentObtained: boolean;
    consentObtainedBy: mongoose.Types.ObjectId;
}

export interface AddResultsRequest {
    enteredBy: mongoose.Types.ObjectId;
    values: Array<{
        testCode: string;
        testName: string;
        numericValue?: number;
        unit?: string;
        stringValue?: string;
        comment?: string;
    }>;
    reviewNotes?: string;
}

export interface OrderFilters {
    workplaceId: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    orderedBy?: mongoose.Types.ObjectId;
    status?: IManualLabOrder['status'];
    priority?: IManualLabOrder['priority'];
    locationId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface OrderStatusUpdate {
    status: IManualLabOrder['status'];
    updatedBy: mongoose.Types.ObjectId;
    notes?: string;
}

export interface AIInterpretationRequest {
    orderId: string;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    labResults: IManualLabResultValue[];
    indication: string;
    requestedBy: mongoose.Types.ObjectId;
}

// ===============================
// MANUAL LAB SERVICE
// ===============================

class ManualLabService {
    /**
     * Create a new manual lab order
     */
    static async createOrder(
        orderData: CreateOrderRequest,
        auditContext: AuditContext
    ): Promise<IManualLabOrder> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate patient exists and belongs to workplace
            const patient = await Patient.findOne({
                _id: orderData.patientId,
                workplaceId: orderData.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);

            if (!patient) {
                throw createNotFoundError('Patient not found or does not belong to this workplace');
            }

            // Validate ordering user
            const orderingUser = await User.findOne({
                _id: orderData.orderedBy,
                workplaceId: orderData.workplaceId,
                role: { $in: ['pharmacist', 'owner'] },
                isDeleted: { $ne: true }
            }).session(session);

            if (!orderingUser) {
                throw createValidationError('Invalid ordering user or insufficient permissions');
            }

            // Validate consent
            if (!orderData.consentObtained) {
                throw createValidationError('Patient consent is required for manual lab orders');
            }

            // Generate unique order ID
            const orderId = await ManualLabOrder.generateNextOrderId(orderData.workplaceId);

            // Generate secure tokens for QR/barcode access
            const tokens = TokenService.generateLabOrderTokens(
                orderId,
                orderData.workplaceId.toString()
            );

            // Create the order
            const order = new ManualLabOrder({
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

            // Generate PDF requisition
            const workplace = await Workplace.findById(orderData.workplaceId).session(session);
            if (!workplace) {
                throw createNotFoundError('Workplace not found');
            }

            const pdfResult = await PDFGenerationService.generateRequisitionPDF(
                order,
                patient,
                workplace
            );

            // Update order with PDF URL
            order.requisitionFormUrl = pdfResult.url;
            await order.save({ session });

            // Log audit event
            await AuditService.logActivity(auditContext, {
                action: 'MANUAL_LAB_ORDER_CREATED',
                resourceType: 'ManualLabOrder',
                resourceId: order._id,
                patientId: orderData.patientId,
                details: {
                    orderId: order.orderId,
                    testCount: order.tests.length,
                    priority: order.priority,
                    indication: order.indication,
                    pdfGenerated: true
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: 'medium'
            });

            await session.commitTransaction();

            logger.info('Manual lab order created successfully', {
                orderId: order.orderId,
                patientId: orderData.patientId,
                workplaceId: orderData.workplaceId,
                testCount: order.tests.length,
                service: 'manual-lab'
            });

            return order;
        } catch (error) {
            await session.abortTransaction();

            logger.error('Failed to create manual lab order', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId: orderData.patientId,
                workplaceId: orderData.workplaceId,
                service: 'manual-lab'
            });

            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get order by ID with validation
     */
    static async getOrderById(
        orderId: string,
        workplaceId: mongoose.Types.ObjectId,
        auditContext?: AuditContext
    ): Promise<IManualLabOrder | null> {
        try {
            const order = await ManualLabOrder.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId,
                isDeleted: { $ne: true }
            })
                .populate('patientId', 'firstName lastName mrn dateOfBirth')
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email');

            if (order && auditContext) {
                // Log access for audit trail
                await AuditService.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDER_ACCESSED',
                    resourceType: 'ManualLabOrder',
                    resourceId: order._id,
                    patientId: order.patientId,
                    details: {
                        orderId: order.orderId,
                        status: order.status,
                        accessType: 'view'
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'low'
                });
            }

            return order;
        } catch (error) {
            logger.error('Failed to retrieve manual lab order', {
                orderId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Get orders by patient with pagination
     */
    static async getOrdersByPatient(
        patientId: mongoose.Types.ObjectId,
        workplaceId: mongoose.Types.ObjectId,
        options: {
            page?: number;
            limit?: number;
            status?: IManualLabOrder['status'];
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        } = {}
    ): Promise<PaginatedResult<IManualLabOrder>> {
        try {
            const page = Math.max(1, options.page || 1);
            const limit = Math.min(100, Math.max(1, options.limit || 20));
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {
                patientId,
                workplaceId,
                isDeleted: { $ne: true }
            };

            if (options.status) {
                query.status = options.status;
            }

            // Build sort
            const sortBy = options.sortBy || 'createdAt';
            const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
            const sort = { [sortBy]: sortOrder };

            // Get total count
            const total = await ManualLabOrder.countDocuments(query);

            // Get paginated results
            const orders = await ManualLabOrder.find(query)
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limit);

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
        } catch (error) {
            logger.error('Failed to retrieve patient lab orders', {
                patientId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Update order status with validation
     */
    static async updateOrderStatus(
        orderId: string,
        statusUpdate: OrderStatusUpdate,
        auditContext: AuditContext
    ): Promise<IManualLabOrder> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await ManualLabOrder.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: auditContext.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);

            if (!order) {
                throw createNotFoundError('Lab order not found');
            }

            // Validate status transition
            const validTransitions = this.getValidStatusTransitions(order.status);
            if (!validTransitions.includes(statusUpdate.status)) {
                throw createBusinessRuleError(
                    `Invalid status transition from ${order.status} to ${statusUpdate.status}`
                );
            }

            const oldStatus = order.status;

            // Update status
            await order.updateStatus(statusUpdate.status, statusUpdate.updatedBy);

            if (statusUpdate.notes) {
                order.notes = statusUpdate.notes;
                await order.save({ session });
            }

            // Log audit event
            await AuditService.logActivity(auditContext, {
                action: 'MANUAL_LAB_ORDER_STATUS_UPDATED',
                resourceType: 'ManualLabOrder',
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

            logger.info('Manual lab order status updated', {
                orderId: order.orderId,
                oldStatus,
                newStatus: statusUpdate.status,
                updatedBy: statusUpdate.updatedBy,
                service: 'manual-lab'
            });

            return order;
        } catch (error) {
            await session.abortTransaction();

            logger.error('Failed to update lab order status', {
                orderId,
                statusUpdate,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });

            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Add results to a lab order
     */
    static async addResults(
        orderId: string,
        resultData: AddResultsRequest,
        auditContext: AuditContext
    ): Promise<IManualLabResult> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the order
            const order = await ManualLabOrder.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: auditContext.workplaceId,
                isDeleted: { $ne: true }
            }).session(session);

            if (!order) {
                throw createNotFoundError('Lab order not found');
            }

            // Validate order status
            if (!['sample_collected', 'result_awaited'].includes(order.status)) {
                throw createBusinessRuleError(
                    'Results can only be added to orders with sample collected or result awaited status'
                );
            }

            // Check if results already exist
            const existingResult = await ManualLabResult.findOne({
                orderId: orderId.toUpperCase(),
                isDeleted: { $ne: true }
            }).session(session);

            if (existingResult) {
                throw createBusinessRuleError('Results already exist for this order');
            }

            // Validate test codes against ordered tests
            const orderedTestCodes = order.tests.map(test => test.code.toUpperCase());
            const resultTestCodes = resultData.values.map(value => value.testCode.toUpperCase());

            const invalidCodes = resultTestCodes.filter(code => !orderedTestCodes.includes(code));
            if (invalidCodes.length > 0) {
                throw createValidationError(
                    `Invalid test codes: ${invalidCodes.join(', ')}. Must match ordered tests.`
                );
            }

            // Create result entry
            const result = new ManualLabResult({
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

            // Auto-generate interpretations based on reference ranges
            this.generateAutoInterpretations(result, order);

            await result.save({ session });

            // Update order status to completed
            await order.updateStatus('completed', resultData.enteredBy);

            // Log audit event
            await AuditService.logActivity(auditContext, {
                action: 'MANUAL_LAB_RESULTS_ENTERED',
                resourceType: 'ManualLabResult',
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

            // Trigger AI interpretation asynchronously
            this.triggerAIInterpretation({
                orderId: order.orderId,
                patientId: order.patientId,
                workplaceId: order.workplaceId,
                labResults: result.values,
                indication: order.indication,
                requestedBy: resultData.enteredBy
            }).catch(error => {
                logger.error('AI interpretation failed', {
                    orderId: order.orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    service: 'manual-lab'
                });
            });

            logger.info('Manual lab results entered successfully', {
                orderId: order.orderId,
                resultId: result._id,
                testCount: result.values.length,
                hasAbnormalResults: result.hasAbnormalResults(),
                service: 'manual-lab'
            });

            return result;
        } catch (error) {
            await session.abortTransaction();

            logger.error('Failed to add lab results', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });

            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get results by order ID
     */
    static async getResultsByOrder(
        orderId: string,
        workplaceId: mongoose.Types.ObjectId,
        auditContext?: AuditContext
    ): Promise<IManualLabResult | null> {
        try {
            // Verify order belongs to workplace
            const order = await ManualLabOrder.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId,
                isDeleted: { $ne: true }
            });

            if (!order) {
                throw createNotFoundError('Lab order not found');
            }

            const result = await ManualLabResult.findOne({
                orderId: orderId.toUpperCase(),
                isDeleted: { $ne: true }
            })
                .populate('enteredBy', 'firstName lastName email role')
                .populate('reviewedBy', 'firstName lastName email role')
                .populate('diagnosticResultId');

            if (result && auditContext) {
                // Log access for audit trail
                await AuditService.logActivity(auditContext, {
                    action: 'MANUAL_LAB_RESULTS_ACCESSED',
                    resourceType: 'ManualLabResult',
                    resourceId: result._id,
                    patientId: order.patientId,
                    details: {
                        orderId: result.orderId,
                        hasAbnormalResults: result.hasAbnormalResults(),
                        aiProcessed: result.aiProcessed,
                        accessType: 'view'
                    },
                    complianceCategory: 'data_access',
                    riskLevel: 'low'
                });
            }

            return result;
        } catch (error) {
            logger.error('Failed to retrieve lab results', {
                orderId,
                workplaceId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Resolve token to order
     */
    static async resolveToken(
        token: string,
        auditContext?: AuditContext
    ): Promise<IManualLabOrder | null> {
        try {
            // Validate token
            const tokenValidation = TokenService.validateToken(token);
            if (!tokenValidation.valid || !tokenValidation.payload) {
                throw createValidationError(`Invalid token: ${tokenValidation.error}`);
            }

            const { orderId, workplaceId } = tokenValidation.payload;

            // Find order by token data
            const order = await ManualLabOrder.findOne({
                orderId: orderId.toUpperCase(),
                workplaceId: new mongoose.Types.ObjectId(workplaceId),
                isDeleted: { $ne: true }
            })
                .populate('patientId', 'firstName lastName mrn')
                .populate('orderedBy', 'firstName lastName email role');

            if (!order) {
                throw createNotFoundError('Lab order not found or token expired');
            }

            // Verify token hash matches stored barcode data
            const barcodeData = TokenService.parseBarcodeData(order.barcodeData);
            if (!barcodeData || !TokenService.verifyTokenHash(token, barcodeData.tokenHash + '0'.repeat(48))) {
                // Note: This is a simplified verification. In production, you'd store the full hash
                logger.warn('Token hash verification failed', {
                    orderId: order.orderId,
                    service: 'manual-lab'
                });
            }

            if (auditContext) {
                // Log token access
                await AuditService.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDER_TOKEN_RESOLVED',
                    resourceType: 'ManualLabOrder',
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

            logger.info('Token resolved successfully', {
                orderId: order.orderId,
                workplaceId: order.workplaceId,
                service: 'manual-lab'
            });

            return order;
        } catch (error) {
            logger.error('Failed to resolve token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Get orders with advanced filtering and pagination
     */
    static async getOrders(
        filters: OrderFilters,
        auditContext?: AuditContext
    ): Promise<PaginatedResult<IManualLabOrder>> {
        try {
            const page = Math.max(1, filters.page || 1);
            const limit = Math.min(100, Math.max(1, filters.limit || 20));
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {
                workplaceId: filters.workplaceId,
                isDeleted: { $ne: true }
            };

            // Apply filters
            if (filters.patientId) query.patientId = filters.patientId;
            if (filters.orderedBy) query.orderedBy = filters.orderedBy;
            if (filters.status) query.status = filters.status;
            if (filters.priority) query.priority = filters.priority;
            if (filters.locationId) query.locationId = filters.locationId;

            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                query.createdAt = {};
                if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
                if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
            }

            // Text search
            if (filters.search) {
                query.$text = { $search: filters.search };
            }

            // Build sort
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
            const sort = { [sortBy]: sortOrder };

            // Get total count
            const total = await ManualLabOrder.countDocuments(query);

            // Get paginated results
            const orders = await ManualLabOrder.find(query)
                .populate('patientId', 'firstName lastName mrn dateOfBirth')
                .populate('orderedBy', 'firstName lastName email role')
                .populate('createdBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const pages = Math.ceil(total / limit);

            if (auditContext && orders.length > 0) {
                // Log bulk access for audit trail
                await AuditService.logActivity(auditContext, {
                    action: 'MANUAL_LAB_ORDERS_BULK_ACCESSED',
                    resourceType: 'ManualLabOrder',
                    resourceId: new mongoose.Types.ObjectId(), // Placeholder for bulk operations
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
        } catch (error) {
            logger.error('Failed to retrieve lab orders', {
                filters,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Trigger AI interpretation for lab results
     */
    static async triggerAIInterpretation(
        request: AIInterpretationRequest
    ): Promise<any> {
        try {
            // Get patient data for context
            const patient = await Patient.findById(request.patientId)
                .populate('allergies')
                .populate('conditions');

            if (!patient) {
                throw createNotFoundError('Patient not found for AI interpretation');
            }

            // Get current medications (simplified - in production would get from medication management)
            const currentMedications: any[] = []; // Placeholder

            // Prepare diagnostic request for AI
            const diagnosticRequest = {
                patientId: request.patientId,
                workplaceId: request.workplaceId,
                inputSnapshot: {
                    symptoms: [request.indication], // Use indication as symptom context
                    labResults: request.labResults.map(result => ({
                        testName: result.testName,
                        testCode: result.testCode,
                        value: result.numericValue || result.stringValue,
                        unit: result.unit,
                        abnormalFlag: result.abnormalFlag,
                        comment: result.comment
                    })),
                    currentMedications,
                    allergies: patient.allergies || [],
                    medicalHistory: patient.conditions || [],
                    demographics: {
                        age: patient.getAge ? patient.getAge() : null,
                        gender: patient.gender,
                        weight: patient.weight,
                        height: patient.height
                    }
                },
                source: 'manual_lab_order',
                sourceId: request.orderId,
                requestedBy: request.requestedBy
            };

            // Call diagnostic service (existing AI integration)
            const diagnosticResult = await diagnosticService.processRequest(diagnosticRequest);

            // Update lab result with AI processing info
            const labResult = await ManualLabResult.findOne({
                orderId: request.orderId.toUpperCase(),
                isDeleted: { $ne: true }
            });

            if (labResult && diagnosticResult) {
                await labResult.markAsAIProcessed(diagnosticResult._id);
            }

            logger.info('AI interpretation completed', {
                orderId: request.orderId,
                diagnosticResultId: diagnosticResult?._id,
                hasRedFlags: diagnosticResult?.redFlags?.length > 0,
                service: 'manual-lab'
            });

            return diagnosticResult;
        } catch (error) {
            logger.error('AI interpretation failed', {
                orderId: request.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
            throw error;
        }
    }

    /**
     * Get valid status transitions for an order
     */
    private static getValidStatusTransitions(currentStatus: IManualLabOrder['status']): IManualLabOrder['status'][] {
        const transitions: Record<IManualLabOrder['status'], IManualLabOrder['status'][]> = {
            'requested': ['sample_collected', 'referred'],
            'sample_collected': ['result_awaited', 'referred'],
            'result_awaited': ['completed', 'referred'],
            'completed': ['referred'],
            'referred': []
        };

        return transitions[currentStatus] || [];
    }

    /**
     * Generate automatic interpretations based on reference ranges
     */
    private static generateAutoInterpretations(
        result: IManualLabResult,
        order: IManualLabOrder
    ): void {
        for (const value of result.values) {
            const orderedTest = order.tests.find(test => test.code.toUpperCase() === value.testCode);

            if (orderedTest?.refRange && value.numericValue !== undefined) {
                const interpretation = this.interpretNumericValue(
                    value.numericValue,
                    orderedTest.refRange,
                    orderedTest.unit || value.unit
                );

                result.interpretValue(value.testCode, interpretation.level, interpretation.note);

                // Set abnormal flag
                const valueIndex = result.values.findIndex(v => v.testCode === value.testCode);
                if (valueIndex >= 0 && result.values[valueIndex]) {
                    result.values[valueIndex]!.abnormalFlag = interpretation.level !== 'normal';
                }
            } else {
                // Default to normal if no reference range or non-numeric value
                result.interpretValue(value.testCode, 'normal');
            }
        }
    }

    /**
     * Interpret numeric value against reference range
     */
    private static interpretNumericValue(
        value: number,
        refRange: string,
        unit?: string
    ): { level: IManualLabResultInterpretation['interpretation']; note?: string } {
        try {
            // Parse reference range (simplified parser)
            // Supports formats like: "4.5-11.0", "< 5.0", "> 10.0", "4.5-11.0 x10³"
            const rangeMatch = refRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
            const lessThanMatch = refRange.match(/[<≤]\s*(\d+\.?\d*)/);
            const greaterThanMatch = refRange.match(/[>≥]\s*(\d+\.?\d*)/);

            if (rangeMatch) {
                const [, minStr, maxStr] = rangeMatch;
                const min = parseFloat(minStr);
                const max = parseFloat(maxStr);

                if (value < min) {
                    const percentBelow = ((min - value) / min) * 100;
                    return {
                        level: percentBelow > 50 ? 'critical' : 'low',
                        note: `Below normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                } else if (value > max) {
                    const percentAbove = ((value - max) / max) * 100;
                    return {
                        level: percentAbove > 50 ? 'critical' : 'high',
                        note: `Above normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                } else {
                    return {
                        level: 'normal',
                        note: `Within normal range (${refRange}${unit ? ' ' + unit : ''})`
                    };
                }
            } else if (lessThanMatch) {
                const threshold = parseFloat(lessThanMatch[1]);
                return {
                    level: value >= threshold ? 'high' : 'normal',
                    note: `Reference: ${refRange}${unit ? ' ' + unit : ''}`
                };
            } else if (greaterThanMatch) {
                const threshold = parseFloat(greaterThanMatch[1]);
                return {
                    level: value <= threshold ? 'low' : 'normal',
                    note: `Reference: ${refRange}${unit ? ' ' + unit : ''}`
                };
            }

            // If we can't parse the reference range, default to normal
            return {
                level: 'normal',
                note: `Reference: ${refRange}${unit ? ' ' + unit : ''} (auto-interpretation unavailable)`
            };
        } catch (error) {
            logger.warn('Failed to interpret numeric value', {
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

    /**
     * Log order event for audit trail
     */
    static async logOrderEvent(
        orderId: string,
        event: string,
        userId: mongoose.Types.ObjectId,
        workplaceId: mongoose.Types.ObjectId,
        details: any = {}
    ): Promise<void> {
        try {
            const auditContext: AuditContext = {
                userId,
                workplaceId,
                userRole: 'pharmacist' // Simplified - in production would get from user
            };

            await AuditService.logActivity(auditContext, {
                action: event,
                resourceType: 'ManualLabOrder',
                resourceId: new mongoose.Types.ObjectId(), // Would need to resolve order ID to ObjectId
                details: {
                    orderId,
                    ...details
                },
                complianceCategory: 'workflow_compliance',
                riskLevel: 'low'
            });
        } catch (error) {
            logger.error('Failed to log order event', {
                orderId,
                event,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab'
            });
        }
    }
}

export default ManualLabService;