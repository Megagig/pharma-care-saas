"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExists = exports.getFileUrl = exports.deleteFile = exports.uploadMiddleware = exports.FileUploadService = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
class FileUploadService {
    static initializeUploadDirectory() {
        if (!fs_1.default.existsSync(this.UPLOAD_DIR)) {
            fs_1.default.mkdirSync(this.UPLOAD_DIR, { recursive: true });
            logger_1.default.info('Created upload directory', { path: this.UPLOAD_DIR });
        }
    }
    static generateSecureFilename(originalName) {
        const ext = path_1.default.extname(originalName).toLowerCase();
        const timestamp = Date.now();
        const randomBytes = crypto_1.default.randomBytes(16).toString('hex');
        return `${timestamp}-${randomBytes}${ext}`;
    }
    static validateFile(file) {
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                isValid: false,
                error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
            };
        }
        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return {
                isValid: false,
                error: `File type ${file.mimetype} is not allowed`
            };
        }
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
            return {
                isValid: false,
                error: `File extension ${ext} is not allowed for security reasons`
            };
        }
        if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
            return {
                isValid: false,
                error: 'Invalid characters in filename'
            };
        }
        return { isValid: true };
    }
    static async scanFileContent(filePath) {
        try {
            const buffer = Buffer.alloc(512);
            const fd = fs_1.default.openSync(filePath, 'r');
            fs_1.default.readSync(fd, buffer, 0, 512, 0);
            fs_1.default.closeSync(fd);
            const signatures = [
                Buffer.from([0x4D, 0x5A]),
                Buffer.from([0x7F, 0x45, 0x4C, 0x46]),
                Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]),
                Buffer.from([0x50, 0x4B, 0x03, 0x04]),
            ];
            for (const signature of signatures) {
                if (buffer.subarray(0, signature.length).equals(signature)) {
                    if (signature.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
                        const filePath_lower = filePath.toLowerCase();
                        if (filePath_lower.endsWith('.docx') || filePath_lower.endsWith('.xlsx') ||
                            filePath_lower.endsWith('.pptx')) {
                            continue;
                        }
                    }
                    return {
                        isSafe: false,
                        error: 'File appears to contain executable content'
                    };
                }
            }
            return { isSafe: true };
        }
        catch (error) {
            logger_1.default.error('Error scanning file content', { filePath, error });
            return {
                isSafe: false,
                error: 'Unable to scan file content'
            };
        }
    }
    static createStorage() {
        return multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                this.initializeUploadDirectory();
                cb(null, this.UPLOAD_DIR);
            },
            filename: (req, file, cb) => {
                const secureFilename = this.generateSecureFilename(file.originalname);
                cb(null, secureFilename);
            }
        });
    }
    static createFileFilter() {
        return (req, file, cb) => {
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                cb(new Error(validation.error || 'Invalid file'));
                return;
            }
            cb(null, true);
        };
    }
    static createUploadMiddleware() {
        return (0, multer_1.default)({
            storage: this.createStorage(),
            fileFilter: this.createFileFilter(),
            limits: {
                fileSize: this.MAX_FILE_SIZE,
                files: 5,
                fieldSize: 1024 * 1024,
            }
        });
    }
    static async processUploadedFile(file) {
        try {
            const filePath = file.path;
            const scanResult = await this.scanFileContent(filePath);
            if (!scanResult.isSafe) {
                await this.deleteFile(filePath);
                return {
                    success: false,
                    error: scanResult.error || 'File failed security scan'
                };
            }
            const fileUrl = this.getFileUrl(file.filename);
            return {
                success: true,
                fileData: {
                    fileName: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: fileUrl,
                    uploadedAt: new Date()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error processing uploaded file', {
                filename: file.filename,
                error: error.message
            });
            if (file.path && fs_1.default.existsSync(file.path)) {
                await this.deleteFile(file.path);
            }
            return {
                success: false,
                error: 'Failed to process uploaded file'
            };
        }
    }
    static async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    logger_1.default.error('Error deleting file', { filePath, error: err.message });
                    reject(err);
                }
                else {
                    logger_1.default.info('File deleted successfully', { filePath });
                    resolve();
                }
            });
        });
    }
    static getFileUrl(filename) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/clinical-notes/${filename}`;
    }
    static fileExists(filename) {
        const filePath = path_1.default.join(this.UPLOAD_DIR, filename);
        return fs_1.default.existsSync(filePath);
    }
    static getFilePath(filename) {
        return path_1.default.join(this.UPLOAD_DIR, filename);
    }
    static getFileStats(filename) {
        try {
            const filePath = this.getFilePath(filename);
            return fs_1.default.statSync(filePath);
        }
        catch (error) {
            return null;
        }
    }
    static async cleanupOldFiles(daysOld = 30) {
        try {
            const files = fs_1.default.readdirSync(this.UPLOAD_DIR);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            let deletedCount = 0;
            for (const file of files) {
                const filePath = path_1.default.join(this.UPLOAD_DIR, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtime < cutoffDate) {
                    await this.deleteFile(filePath);
                    deletedCount++;
                }
            }
            logger_1.default.info('Cleanup completed', { deletedCount, daysOld });
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Error during file cleanup', { error: error.message });
            throw error;
        }
    }
    static getDirectorySize() {
        try {
            const files = fs_1.default.readdirSync(this.UPLOAD_DIR);
            let totalSize = 0;
            for (const file of files) {
                const filePath = path_1.default.join(this.UPLOAD_DIR, file);
                const stats = fs_1.default.statSync(filePath);
                totalSize += stats.size;
            }
            return {
                size: totalSize,
                fileCount: files.length
            };
        }
        catch (error) {
            return { size: 0, fileCount: 0 };
        }
    }
}
exports.FileUploadService = FileUploadService;
FileUploadService.UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads', 'clinical-notes');
FileUploadService.MAX_FILE_SIZE = 10 * 1024 * 1024;
FileUploadService.ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
];
FileUploadService.DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py', '.rb'
];
exports.uploadMiddleware = FileUploadService.createUploadMiddleware();
exports.deleteFile = FileUploadService.deleteFile.bind(FileUploadService);
exports.getFileUrl = FileUploadService.getFileUrl.bind(FileUploadService);
exports.fileExists = FileUploadService.fileExists.bind(FileUploadService);
exports.default = FileUploadService;
//# sourceMappingURL=fileUploadService.js.map