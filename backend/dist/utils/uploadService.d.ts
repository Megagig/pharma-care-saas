import multer from 'multer';
declare class UploadService {
    private baseUploadPath;
    constructor();
    private ensureDirectoryExists;
    generateUniqueFilename(originalName: string, prefix?: string): string;
    createUploadStorage(subDirectory: string): multer.StorageEngine;
    createFileFilter(allowedTypes: string[], maxSize?: number): {
        fileFilter: (req: any, file: any, cb: any) => void;
        limits: {
            fileSize: number;
        };
    };
    getLicenseUploadConfig(): multer.Multer;
    getProfilePictureUploadConfig(): multer.Multer;
    getDocumentUploadConfig(): multer.Multer;
    deleteFile(filePath: string): boolean;
    getFileInfo(filePath: string): {
        exists: boolean;
        size: number;
        createdAt: Date;
        modifiedAt: Date;
        isFile: boolean;
        isDirectory: boolean;
        error?: undefined;
    } | {
        exists: boolean;
        size?: undefined;
        createdAt?: undefined;
        modifiedAt?: undefined;
        isFile?: undefined;
        isDirectory?: undefined;
        error?: undefined;
    } | {
        exists: boolean;
        error: string;
        size?: undefined;
        createdAt?: undefined;
        modifiedAt?: undefined;
        isFile?: undefined;
        isDirectory?: undefined;
    };
    cleanupOldFiles(directory: string, olderThanDays?: number): {
        deleted: number;
        errors: {
            filename: string;
            error: string;
        }[];
    } | {
        deleted: number;
        errors: {
            directory: string;
            error: string;
        }[];
    };
    validateFileType(filePath: string, expectedTypes: string[]): boolean;
    getFileUrl(filePath: string): string;
    scanFile(filePath: string): Promise<{
        safe: boolean;
        threat?: string;
    }>;
}
export declare const uploadService: UploadService;
export {};
//# sourceMappingURL=uploadService.d.ts.map