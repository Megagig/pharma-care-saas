"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
class UploadService {
    constructor() {
        this.baseUploadPath = path_1.default.join(process.cwd(), 'uploads');
        this.ensureDirectoryExists(this.baseUploadPath);
    }
    ensureDirectoryExists(dirPath) {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
    }
    generateUniqueFilename(originalName, prefix) {
        const timestamp = Date.now();
        const randomString = crypto_1.default.randomBytes(8).toString('hex');
        const extension = path_1.default.extname(originalName);
        const prefixPart = prefix ? `${prefix}-` : '';
        return `${prefixPart}${timestamp}-${randomString}${extension}`;
    }
    createUploadStorage(subDirectory) {
        return multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = path_1.default.join(this.baseUploadPath, subDirectory);
                this.ensureDirectoryExists(uploadPath);
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = this.generateUniqueFilename(file.originalname, subDirectory.slice(0, 3));
                cb(null, uniqueName);
            },
        });
    }
    createFileFilter(allowedTypes, maxSize) {
        return {
            fileFilter: (req, file, cb) => {
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
                }
            },
            limits: {
                fileSize: maxSize || 5 * 1024 * 1024,
            },
        };
    }
    getLicenseUploadConfig() {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf',
        ];
        return (0, multer_1.default)({
            storage: this.createUploadStorage('licenses'),
            ...this.createFileFilter(allowedTypes, 5 * 1024 * 1024),
        });
    }
    getProfilePictureUploadConfig() {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return (0, multer_1.default)({
            storage: this.createUploadStorage('profiles'),
            ...this.createFileFilter(allowedTypes, 2 * 1024 * 1024),
        });
    }
    getDocumentUploadConfig() {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
        ];
        return (0, multer_1.default)({
            storage: this.createUploadStorage('documents'),
            ...this.createFileFilter(allowedTypes, 10 * 1024 * 1024),
        });
    }
    deleteFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }
    getFileInfo(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                const stats = fs_1.default.statSync(filePath);
                return {
                    exists: true,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                };
            }
            return { exists: false };
        }
        catch (error) {
            console.error('Error getting file info:', error);
            return { exists: false, error: error.message };
        }
    }
    cleanupOldFiles(directory, olderThanDays = 30) {
        try {
            const dirPath = path_1.default.join(this.baseUploadPath, directory);
            if (!fs_1.default.existsSync(dirPath)) {
                return { deleted: 0, errors: [] };
            }
            const files = fs_1.default.readdirSync(dirPath);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            let deleted = 0;
            const errors = [];
            files.forEach((filename) => {
                try {
                    const filePath = path_1.default.join(dirPath, filename);
                    const stats = fs_1.default.statSync(filePath);
                    if (stats.mtime < cutoffDate) {
                        fs_1.default.unlinkSync(filePath);
                        deleted++;
                    }
                }
                catch (error) {
                    errors.push({ filename, error: error.message });
                }
            });
            return { deleted, errors };
        }
        catch (error) {
            console.error('Error during cleanup:', error);
            return {
                deleted: 0,
                errors: [{ directory, error: error.message }],
            };
        }
    }
    validateFileType(filePath, expectedTypes) {
        try {
            const buffer = fs_1.default.readFileSync(filePath);
            const header = buffer.toString('hex', 0, 4);
            const signatures = {
                pdf: '25504446',
                jpeg: 'ffd8ffe0',
                jpeg2: 'ffd8ffe1',
                jpeg3: 'ffd8ffe2',
                png: '89504e47',
                webp: '52494646',
            };
            return expectedTypes.some((type) => {
                const sig = signatures[type.toLowerCase()];
                return sig && header.startsWith(sig);
            });
        }
        catch (error) {
            console.error('Error validating file type:', error);
            return false;
        }
    }
    getFileUrl(filePath) {
        const relativePath = path_1.default.relative(this.baseUploadPath, filePath);
        return `/uploads/${relativePath.replace(/\\\\/g, '/')}`;
    }
    async scanFile(filePath) {
        try {
            const stats = fs_1.default.statSync(filePath);
            if (stats.size > 50 * 1024 * 1024) {
                return { safe: false, threat: 'File too large' };
            }
            const content = fs_1.default.readFileSync(filePath, 'utf8').slice(0, 1000);
            const suspiciousPatterns = [
                /<script[^>]*>/i,
                /javascript:/i,
                /vbscript:/i,
                /on\\w+\\s*=/i,
            ];
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(content)) {
                    return { safe: false, threat: 'Suspicious content detected' };
                }
            }
            return { safe: true };
        }
        catch (error) {
            console.error('Error scanning file:', error);
            return { safe: false, threat: 'Scan failed' };
        }
    }
}
exports.uploadService = new UploadService();
//# sourceMappingURL=uploadService.js.map