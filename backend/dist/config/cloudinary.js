"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
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
//# sourceMappingURL=cloudinary.js.map