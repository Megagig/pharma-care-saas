import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

class UploadService {
  private baseUploadPath: string;

  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.baseUploadPath);
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  generateUniqueFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const prefixPart = prefix ? `${prefix}-` : '';

    return `${prefixPart}${timestamp}-${randomString}${extension}`;
  }

  createUploadStorage(subDirectory: string) {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.baseUploadPath, subDirectory);
        this.ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(
          file.originalname,
          subDirectory.slice(0, 3)
        );
        cb(null, uniqueName);
      },
    });
  }

  createFileFilter(allowedTypes: string[], maxSize?: number) {
    return {
      fileFilter: (req: any, file: any, cb: any) => {
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            ),
            false
          );
        }
      },
      limits: {
        fileSize: maxSize || 5 * 1024 * 1024, // Default 5MB
      },
    };
  }

  // License document upload configuration
  getLicenseUploadConfig() {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    return multer({
      storage: this.createUploadStorage('licenses'),
      ...this.createFileFilter(allowedTypes, 5 * 1024 * 1024), // 5MB
    });
  }

  // Profile picture upload configuration
  getProfilePictureUploadConfig() {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    return multer({
      storage: this.createUploadStorage('profiles'),
      ...this.createFileFilter(allowedTypes, 2 * 1024 * 1024), // 2MB
    });
  }

  // Document upload configuration (general)
  getDocumentUploadConfig() {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    return multer({
      storage: this.createUploadStorage('documents'),
      ...this.createFileFilter(allowedTypes, 10 * 1024 * 1024), // 10MB
    });
  }

  // Delete file helper
  deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file info
  getFileInfo(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
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
    } catch (error) {
      console.error('Error getting file info:', error);
      return { exists: false, error: (error as Error).message };
    }
  }

  // Clean up old files (utility for cron jobs)
  cleanupOldFiles(directory: string, olderThanDays: number = 30) {
    try {
      const dirPath = path.join(this.baseUploadPath, directory);
      if (!fs.existsSync(dirPath)) {
        return { deleted: 0, errors: [] };
      }

      const files = fs.readdirSync(dirPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let deleted = 0;
      const errors: Array<{ filename: string; error: string }> = [];

      files.forEach((filename) => {
        try {
          const filePath = path.join(dirPath, filename);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        } catch (error) {
          errors.push({ filename, error: (error as Error).message });
        }
      });

      return { deleted, errors };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return {
        deleted: 0,
        errors: [{ directory, error: (error as Error).message }],
      };
    }
  }

  // Validate file type by reading file header (more secure than relying on mimetype)
  validateFileType(filePath: string, expectedTypes: string[]): boolean {
    try {
      const buffer = fs.readFileSync(filePath);
      const header = buffer.toString('hex', 0, 4);

      const signatures = {
        pdf: '25504446', // %PDF
        jpeg: 'ffd8ffe0',
        jpeg2: 'ffd8ffe1',
        jpeg3: 'ffd8ffe2',
        png: '89504e47',
        webp: '52494646', // RIFF (WebP container)
      };

      return expectedTypes.some((type) => {
        const sig = (signatures as any)[type.toLowerCase()];
        return sig && header.startsWith(sig);
      });
    } catch (error) {
      console.error('Error validating file type:', error);
      return false;
    }
  }

  // Get file URL for client access
  getFileUrl(filePath: string): string {
    const relativePath = path.relative(this.baseUploadPath, filePath);
    return `/uploads/${relativePath.replace(/\\\\/g, '/')}`;
  }

  // Scan for malware (placeholder - integrate with actual antivirus)
  async scanFile(
    filePath: string
  ): Promise<{ safe: boolean; threat?: string }> {
    // This is a placeholder. In production, integrate with services like:
    // - ClamAV
    // - VirusTotal API
    // - AWS GuardDuty
    // - Azure Security Center

    try {
      // Basic file size check
      const stats = fs.statSync(filePath);
      if (stats.size > 50 * 1024 * 1024) {
        // 50MB
        return { safe: false, threat: 'File too large' };
      }

      // Check for suspicious file extensions in content
      const content = fs.readFileSync(filePath, 'utf8').slice(0, 1000);
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
    } catch (error) {
      console.error('Error scanning file:', error);
      return { safe: false, threat: 'Scan failed' };
    }
  }
}

export const uploadService = new UploadService();
