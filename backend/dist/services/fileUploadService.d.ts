import multer from 'multer';
import fs from 'fs';
export declare class FileUploadService {
    private static readonly UPLOAD_DIR;
    private static readonly MAX_FILE_SIZE;
    private static readonly ALLOWED_MIME_TYPES;
    private static readonly DANGEROUS_EXTENSIONS;
    static initializeUploadDirectory(): void;
    private static generateSecureFilename;
    private static validateFile;
    private static scanFileContent;
    static createStorage(): multer.StorageEngine;
    static createFileFilter(): multer.Options['fileFilter'];
    static createUploadMiddleware(): multer.Multer;
    static processUploadedFile(file: Express.Multer.File): Promise<{
        success: boolean;
        fileData?: any;
        error?: string;
    }>;
    static deleteFile(filePath: string): Promise<void>;
    static getFileUrl(filename: string): string;
    static fileExists(filename: string): boolean;
    static getFilePath(filename: string): string;
    static getFileStats(filename: string): fs.Stats | null;
    static cleanupOldFiles(daysOld?: number): Promise<number>;
    static getDirectorySize(): {
        size: number;
        fileCount: number;
    };
}
export declare const uploadMiddleware: multer.Multer;
export declare const deleteFile: typeof FileUploadService.deleteFile;
export declare const getFileUrl: typeof FileUploadService.getFileUrl;
export declare const fileExists: typeof FileUploadService.fileExists;
export default FileUploadService;
//# sourceMappingURL=fileUploadService.d.ts.map