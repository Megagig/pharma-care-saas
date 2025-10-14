import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Multer upload configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Upload profile picture and return URL
export const uploadProfilePicture = async (file: Express.Multer.File): Promise<string> => {
    // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return relative path
    const relativePath = `/uploads/avatars/${file.filename}`;
    return relativePath;
};

// Delete old profile picture
export const deleteProfilePicture = async (avatarUrl: string): Promise<void> => {
    try {
        if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
            const filePath = path.join(__dirname, '../..', avatarUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        // Don't throw error, just log it
    }
};
