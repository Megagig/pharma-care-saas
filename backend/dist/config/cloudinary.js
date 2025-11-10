"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.deleteDocument = exports.uploadDocument = exports.uploadImage = exports.testCloudinaryConnection = exports.validateCloudinaryConfig = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const validateCloudinaryConfig = () => {
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.warn(`⚠️ Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
        return false;
    }
    console.log('✅ Cloudinary configuration validated');
    return true;
};
exports.validateCloudinaryConfig = validateCloudinaryConfig;
const testCloudinaryConnection = async () => {
    try {
        await cloudinary_1.v2.api.ping();
        console.log('✅ Cloudinary connection successful');
        return true;
    }
    catch (error) {
        console.warn('⚠️ Cloudinary connection failed:', error);
        return false;
    }
};
exports.testCloudinaryConnection = testCloudinaryConnection;
const uploadImage = async (file, folder = 'pharma-care') => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(file, {
            folder,
            transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
            ]
        });
        return result;
    }
    catch (error) {
        throw new Error('Image upload failed');
    }
};
exports.uploadImage = uploadImage;
const uploadDocument = async (file, folder = 'licenses', publicId) => {
    try {
        const uploadOptions = {
            folder,
            resource_type: 'auto',
            quality: 'auto',
        };
        if (publicId) {
            uploadOptions.public_id = publicId;
        }
        const result = await cloudinary_1.v2.uploader.upload(file, uploadOptions);
        return result;
    }
    catch (error) {
        throw new Error('Document upload failed');
    }
};
exports.uploadDocument = uploadDocument;
const deleteDocument = async (publicId) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: 'auto'
        });
        return result;
    }
    catch (error) {
        throw new Error('Document deletion failed');
    }
};
exports.deleteDocument = deleteDocument;
(0, exports.validateCloudinaryConfig)();
//# sourceMappingURL=cloudinary.js.map