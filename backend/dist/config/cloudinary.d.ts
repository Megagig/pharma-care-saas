import { v2 as cloudinary } from 'cloudinary';
export declare const validateCloudinaryConfig: () => boolean;
export declare const testCloudinaryConnection: () => Promise<boolean>;
export declare const uploadImage: (file: string, folder?: string) => Promise<import("cloudinary").UploadApiResponse>;
export declare const uploadDocument: (file: string, folder?: string, publicId?: string) => Promise<import("cloudinary").UploadApiResponse>;
export declare const deleteDocument: (publicId: string) => Promise<any>;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map