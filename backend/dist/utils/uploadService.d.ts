import multer from 'multer';
export declare const upload: multer.Multer;
export declare const deleteFile: (filePath: string) => Promise<void>;
export declare const getFileUrl: (filename: string) => string;
export declare const validateFileExists: (filePath: string) => boolean;
declare const _default: {
    upload: multer.Multer;
    deleteFile: (filePath: string) => Promise<void>;
    getFileUrl: (filename: string) => string;
    validateFileExists: (filePath: string) => boolean;
};
export default _default;
//# sourceMappingURL=uploadService.d.ts.map