"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseController = exports.LicenseController = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../utils/emailService");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'licenses');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `license-${uniqueSuffix}${extension}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
        'image/webp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
class LicenseController {
    async uploadLicense(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No license document uploaded',
                });
            }
            const { licenseNumber } = req.body;
            if (!licenseNumber) {
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'License number is required',
                });
            }
            const user = await User_1.default.findById(req.user._id);
            if (!user) {
                fs_1.default.unlinkSync(req.file.path);
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
                fs_1.default.unlinkSync(req.file.path);
                return res.status(409).json({
                    success: false,
                    message: 'This license number is already registered by another user',
                });
            }
            if (user.licenseDocument && user.licenseDocument.filePath) {
                try {
                    if (fs_1.default.existsSync(user.licenseDocument.filePath)) {
                        fs_1.default.unlinkSync(user.licenseDocument.filePath);
                    }
                }
                catch (error) {
                    console.error('Error removing old license document:', error);
                }
            }
            user.licenseNumber = licenseNumber;
            user.licenseDocument = {
                fileName: req.file.originalname,
                filePath: req.file.path,
                uploadedAt: new Date(),
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
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
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: 'Error uploading license document',
                error: error.message,
            });
        }
    }
    async getLicenseStatus(req, res) {
        try {
            const user = await User_1.default.findById(req.user._id)
                .select('licenseNumber licenseStatus licenseDocument licenseVerifiedAt licenseRejectionReason')
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
                requiresLicense: ['pharmacist', 'intern_pharmacist'].includes(user.role),
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
            const filePath = user.licenseDocument.filePath;
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'License file not found on server',
                });
            }
            res.setHeader('Content-Type', user.licenseDocument.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${user.licenseDocument.fileName}"`);
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
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
            try {
                if (fs_1.default.existsSync(user.licenseDocument.filePath)) {
                    fs_1.default.unlinkSync(user.licenseDocument.filePath);
                }
            }
            catch (error) {
                console.error('Error removing license file:', error);
            }
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