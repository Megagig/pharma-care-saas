"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseController = exports.LicenseController = exports.upload = void 0;
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../utils/emailService");
const licenseUploadService_1 = require("../services/licenseUploadService");
Object.defineProperty(exports, "upload", { enumerable: true, get: function () { return licenseUploadService_1.upload; } });
class LicenseController {
    async uploadLicense(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No license document uploaded',
                });
            }
            const fileValidation = licenseUploadService_1.licenseUploadService.validateFile(req.file);
            if (!fileValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: fileValidation.error,
                });
            }
            const { licenseNumber, licenseExpirationDate, pharmacySchool, yearOfGraduation } = req.body;
            const validationErrors = [];
            if (!licenseNumber)
                validationErrors.push('License number is required');
            if (!licenseExpirationDate)
                validationErrors.push('License expiration date is required');
            if (!pharmacySchool)
                validationErrors.push('Pharmacy school is required');
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: validationErrors.join(', '),
                });
            }
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const user = await User_1.default.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const existingUser = await User_1.default.findOne({
                licenseNumber: licenseNumber,
                _id: { $ne: user._id },
                licenseStatus: { $in: ['pending', 'approved'] },
            });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'This license number is already registered by another user',
                });
            }
            if (user.licenseDocument) {
                await licenseUploadService_1.licenseUploadService.deleteLicenseDocument(user.licenseDocument.cloudinaryPublicId, user.licenseDocument.filePath);
            }
            const uploadResult = await licenseUploadService_1.licenseUploadService.uploadLicenseDocument(req.file, user._id.toString());
            user.licenseNumber = licenseNumber;
            user.licenseExpirationDate = new Date(licenseExpirationDate);
            user.pharmacySchool = pharmacySchool;
            if (yearOfGraduation) {
                user.yearOfGraduation = parseInt(yearOfGraduation);
            }
            user.licenseDocument = {
                fileName: req.file.originalname,
                cloudinaryUrl: uploadResult.cloudinaryUrl,
                cloudinaryPublicId: uploadResult.cloudinaryPublicId,
                filePath: uploadResult.localFilePath,
                uploadedAt: new Date(),
                fileSize: uploadResult.fileSize,
                mimeType: uploadResult.mimeType,
                uploadMethod: uploadResult.uploadMethod
            };
            user.licenseStatus = 'pending';
            if (user.licenseRejectionReason) {
                user.licenseRejectionReason = undefined;
            }
            await user.save();
            await emailService_1.emailService.sendLicenseSubmissionNotification({
                userEmail: user.email,
                userName: `${user.firstName} ${user.lastName}`,
                licenseNumber: licenseNumber,
                submittedAt: new Date(),
            });
            res.json({
                success: true,
                message: 'License document uploaded successfully',
                data: {
                    licenseNumber: user.licenseNumber,
                    status: user.licenseStatus,
                    uploadedAt: user.licenseDocument.uploadedAt,
                },
            });
        }
        catch (error) {
            console.error('License upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading license document',
                error: error.message,
            });
        }
    }
    async getLicenseStatus(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const user = await User_1.default.findById(req.user._id)
                .select('licenseNumber licenseStatus licenseDocument licenseVerifiedAt licenseRejectionReason licenseExpirationDate pharmacySchool yearOfGraduation role')
                .populate('licenseVerifiedBy', 'firstName lastName');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const licenseInfo = {
                licenseNumber: user.licenseNumber,
                status: user.licenseStatus,
                hasDocument: !!user.licenseDocument,
                verifiedAt: user.licenseVerifiedAt,
                rejectionReason: user.licenseRejectionReason,
                expirationDate: user.licenseExpirationDate,
                pharmacySchool: user.pharmacySchool,
                yearOfGraduation: user.yearOfGraduation,
                requiresLicense: ['pharmacist', 'intern_pharmacist', 'owner'].includes(user.role),
            };
            if (user.licenseDocument) {
                licenseInfo['documentInfo'] = {
                    fileName: user.licenseDocument.fileName,
                    uploadedAt: user.licenseDocument.uploadedAt,
                    fileSize: user.licenseDocument.fileSize,
                };
            }
            res.json({
                success: true,
                data: licenseInfo,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching license status',
                error: error.message,
            });
        }
    }
    async downloadLicenseDocument(req, res) {
        try {
            const { userId } = req.params;
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            if (req.user.role !== 'super_admin' &&
                req.user._id.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user || !user.licenseDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'License document not found',
                });
            }
            if (user.licenseDocument.cloudinaryUrl) {
                return res.redirect(user.licenseDocument.cloudinaryUrl);
            }
            if (user.licenseDocument.filePath && require('fs').existsSync(user.licenseDocument.filePath)) {
                const fs = require('fs');
                res.setHeader('Content-Type', user.licenseDocument.mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${user.licenseDocument.fileName}"`);
                const fileStream = fs.createReadStream(user.licenseDocument.filePath);
                fileStream.pipe(res);
                return;
            }
            return res.status(404).json({
                success: false,
                message: 'License file not found',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error downloading license document',
                error: error.message,
            });
        }
    }
    async deleteLicenseDocument(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const user = await User_1.default.findById(req.user._id);
            if (!user || !user.licenseDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'No license document found',
                });
            }
            if (!['rejected', 'pending'].includes(user.licenseStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete approved license document',
                });
            }
            await licenseUploadService_1.licenseUploadService.deleteLicenseDocument(user.licenseDocument.cloudinaryPublicId, user.licenseDocument.filePath);
            user.licenseDocument = undefined;
            user.licenseNumber = undefined;
            user.licenseStatus = 'not_required';
            user.licenseRejectionReason = undefined;
            await user.save();
            res.json({
                success: true,
                message: 'License document deleted successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting license document',
                error: error.message,
            });
        }
    }
    async validateLicenseNumber(req, res) {
        try {
            const { licenseNumber } = req.body;
            if (!licenseNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'License number is required',
                });
            }
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const existingUser = await User_1.default.findOne({
                licenseNumber: licenseNumber,
                _id: { $ne: req.user._id },
                licenseStatus: { $in: ['pending', 'approved'] },
            });
            const isAvailable = !existingUser;
            res.json({
                success: true,
                data: {
                    licenseNumber,
                    isAvailable,
                    message: isAvailable
                        ? 'License number is available'
                        : 'This license number is already registered',
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error validating license number',
                error: error.message,
            });
        }
    }
    async bulkProcessLicenses(req, res) {
        try {
            const { actions } = req.body;
            if (!Array.isArray(actions) || actions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Actions array is required',
                });
            }
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const results = [];
            for (const action of actions) {
                try {
                    const user = await User_1.default.findById(action.userId);
                    if (!user) {
                        results.push({
                            userId: action.userId,
                            success: false,
                            message: 'User not found',
                        });
                        continue;
                    }
                    if (action.action === 'approve') {
                        user.licenseStatus = 'approved';
                        user.licenseVerifiedAt = new Date();
                        user.licenseVerifiedBy = req.user._id;
                        user.status = 'active';
                        await user.save();
                        await emailService_1.emailService.sendLicenseApprovalNotification(user.email, {
                            firstName: user.firstName,
                            licenseNumber: user.licenseNumber || '',
                        });
                        results.push({
                            userId: action.userId,
                            success: true,
                            message: 'License approved',
                        });
                    }
                    else if (action.action === 'reject') {
                        if (!action.reason) {
                            results.push({
                                userId: action.userId,
                                success: false,
                                message: 'Rejection reason is required',
                            });
                            continue;
                        }
                        user.licenseStatus = 'rejected';
                        user.licenseRejectionReason = action.reason;
                        user.licenseVerifiedAt = new Date();
                        user.licenseVerifiedBy = req.user._id;
                        user.status = 'license_rejected';
                        await user.save();
                        await emailService_1.emailService.sendLicenseRejectionNotification(user.email, {
                            firstName: user.firstName,
                            reason: action.reason,
                        });
                        results.push({
                            userId: action.userId,
                            success: true,
                            message: 'License rejected',
                        });
                    }
                }
                catch (error) {
                    results.push({
                        userId: action.userId,
                        success: false,
                        message: error.message,
                    });
                }
            }
            res.json({
                success: true,
                message: 'Bulk processing completed',
                data: results,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error processing bulk license actions',
                error: error.message,
            });
        }
    }
}
exports.LicenseController = LicenseController;
exports.licenseController = new LicenseController();
//# sourceMappingURL=licenseController.js.map