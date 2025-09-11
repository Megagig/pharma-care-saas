import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User, { IUser } from '../models/User';
import { emailService } from '../utils/emailService';

interface AuthRequest extends Request {
   user?: IUser;
   subscription?: any;
}

// Configure multer for license document uploads with improved validation
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', 'licenses');
      if (!fs.existsSync(uploadPath)) {
         fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
   },
   filename: (req: AuthRequest, file, cb) => {
      if (!req.user) {
         return cb(new Error('User not authenticated'), '');
      }

      // Use user ID in filename for better organization and security
      const userId = req.user._id;
      const uniqueSuffix = Date.now();
      const extension = path.extname(file.originalname);
      cb(null, `license-${userId}-${uniqueSuffix}${extension}`);
   },
});

const fileFilter = (req: any, file: any, cb: any) => {
   // Allow only specific file types with size validation
   const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'image/webp',
   ];

   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(
         new Error(
            'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'
         ),
         false
      );
   }
};

// Set upload limits for security
const licenseUpload = multer({
   storage,
   fileFilter,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
   },
});

// Export for use in routes
export const upload = multer({
   storage,
   fileFilter,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
   },
});

export class LicenseController {
   async uploadLicense(req: AuthRequest, res: Response): Promise<any> {
      try {
         if (!req.file) {
            return res.status(400).json({
               success: false,
               message: 'No license document uploaded',
            });
         }

         const { licenseNumber } = req.body;

         if (!licenseNumber) {
            // Remove uploaded file if license number is missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
               success: false,
               message: 'License number is required',
            });
         }

         if (!req.user) {
            fs.unlinkSync(req.file.path);
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         const user = await User.findById(req.user._id);
         if (!user) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         // Check if license number is already used by another user
         const existingUser = await User.findOne({
            licenseNumber: licenseNumber,
            _id: { $ne: user._id },
            licenseStatus: { $in: ['pending', 'approved'] },
         });

         if (existingUser) {
            fs.unlinkSync(req.file.path);
            return res.status(409).json({
               success: false,
               message:
                  'This license number is already registered by another user',
            });
         }

         // Remove old license document if exists
         if (user.licenseDocument && user.licenseDocument.filePath) {
            try {
               if (fs.existsSync(user.licenseDocument.filePath)) {
                  fs.unlinkSync(user.licenseDocument.filePath);
               }
            } catch (error) {
               console.error('Error removing old license document:', error);
            }
         }

         // Update user with new license information
         user.licenseNumber = licenseNumber;
         user.licenseDocument = {
            fileName: req.file.originalname,
            filePath: req.file.path,
            uploadedAt: new Date(),
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
         };
         user.licenseStatus = 'pending';

         // If user was previously rejected, reset rejection reason
         if (user.licenseRejectionReason) {
            user.licenseRejectionReason = undefined;
         }

         await user.save();

         // Send notification to admins about new license submission
         await emailService.sendLicenseSubmissionNotification({
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`,
            licenseNumber: licenseNumber,
            submittedAt: new Date(),
         });

         res.json({
            success: true,
            message: 'License document uploaded successfully',
            data: {
               licenseNumber: user.licenseNumber,
               status: user.licenseStatus,
               uploadedAt: user.licenseDocument.uploadedAt,
            },
         });
      } catch (error) {
         // Clean up uploaded file on error
         if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
         }

         res.status(500).json({
            success: false,
            message: 'Error uploading license document',
            error: (error as Error).message,
         });
      }
   }

   async getLicenseStatus(req: AuthRequest, res: Response): Promise<any> {
      try {
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         const user = await User.findById(req.user._id)
            .select(
               'licenseNumber licenseStatus licenseDocument licenseVerifiedAt licenseRejectionReason'
            )
            .populate('licenseVerifiedBy', 'firstName lastName');

         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'User not found',
            });
         }

         const licenseInfo = {
            licenseNumber: user.licenseNumber,
            status: user.licenseStatus,
            hasDocument: !!user.licenseDocument,
            verifiedAt: user.licenseVerifiedAt,
            rejectionReason: user.licenseRejectionReason,
            requiresLicense: ['pharmacist', 'intern_pharmacist'].includes(
               user.role
            ),
         };

         if (user.licenseDocument) {
            (licenseInfo as any)['documentInfo'] = {
               fileName: user.licenseDocument.fileName,
               uploadedAt: user.licenseDocument.uploadedAt,
               fileSize: user.licenseDocument.fileSize,
            };
         }

         res.json({
            success: true,
            data: licenseInfo,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error fetching license status',
            error: (error as Error).message,
         });
      }
   }

   async downloadLicenseDocument(
      req: AuthRequest,
      res: Response
   ): Promise<any> {
      try {
         const { userId } = req.params;

         // Check if user is authenticated
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         // Check if current user is admin or the license owner
         if (
            req.user.role !== 'super_admin' &&
            req.user._id.toString() !== userId
         ) {
            return res.status(403).json({
               success: false,
               message: 'Access denied',
            });
         }

         const user = await User.findById(userId);
         if (!user || !user.licenseDocument) {
            return res.status(404).json({
               success: false,
               message: 'License document not found',
            });
         }

         const filePath = user.licenseDocument.filePath;
         if (!fs.existsSync(filePath)) {
            return res.status(404).json({
               success: false,
               message: 'License file not found on server',
            });
         }

         // Set appropriate headers for file download
         res.setHeader('Content-Type', user.licenseDocument.mimeType);
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="${user.licenseDocument.fileName}"`
         );

         // Stream the file
         const fileStream = fs.createReadStream(filePath);
         fileStream.pipe(res);
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error downloading license document',
            error: (error as Error).message,
         });
      }
   }

   async deleteLicenseDocument(req: AuthRequest, res: Response): Promise<any> {
      try {
         // Check if user is authenticated
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         const user = await User.findById(req.user._id);
         if (!user || !user.licenseDocument) {
            return res.status(404).json({
               success: false,
               message: 'No license document found',
            });
         }

         // Only allow deletion if status is rejected or pending
         if (!['rejected', 'pending'].includes(user.licenseStatus)) {
            return res.status(400).json({
               success: false,
               message: 'Cannot delete approved license document',
            });
         }

         // Remove file from filesystem
         try {
            if (fs.existsSync(user.licenseDocument.filePath)) {
               fs.unlinkSync(user.licenseDocument.filePath);
            }
         } catch (error) {
            console.error('Error removing license file:', error);
         }

         // Clear license information
         user.licenseDocument = undefined;
         user.licenseNumber = undefined;
         user.licenseStatus = 'not_required';
         user.licenseRejectionReason = undefined;

         await user.save();

         res.json({
            success: true,
            message: 'License document deleted successfully',
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error deleting license document',
            error: (error as Error).message,
         });
      }
   }

   async validateLicenseNumber(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { licenseNumber } = req.body;

         if (!licenseNumber) {
            return res.status(400).json({
               success: false,
               message: 'License number is required',
            });
         }

         // Check if user is authenticated
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         // Check if license number is already registered
         const existingUser = await User.findOne({
            licenseNumber: licenseNumber,
            _id: { $ne: req.user._id },
            licenseStatus: { $in: ['pending', 'approved'] },
         });

         const isAvailable = !existingUser;

         res.json({
            success: true,
            data: {
               licenseNumber,
               isAvailable,
               message: isAvailable
                  ? 'License number is available'
                  : 'This license number is already registered',
            },
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error validating license number',
            error: (error as Error).message,
         });
      }
   }

   // Admin-only method to bulk process licenses
   async bulkProcessLicenses(req: AuthRequest, res: Response): Promise<any> {
      try {
         const { actions } = req.body; // Array of { userId, action: 'approve'|'reject', reason? }

         if (!Array.isArray(actions) || actions.length === 0) {
            return res.status(400).json({
               success: false,
               message: 'Actions array is required',
            });
         }

         // Check if user is authenticated
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required',
            });
         }

         const results = [];

         for (const action of actions) {
            try {
               const user = await User.findById(action.userId);
               if (!user) {
                  results.push({
                     userId: action.userId,
                     success: false,
                     message: 'User not found',
                  });
                  continue;
               }

               if (action.action === 'approve') {
                  user.licenseStatus = 'approved';
                  user.licenseVerifiedAt = new Date();
                  user.licenseVerifiedBy = req.user._id;
                  user.status = 'active';

                  await user.save();

                  // Send approval email
                  await emailService.sendLicenseApprovalNotification(
                     user.email,
                     {
                        firstName: user.firstName,
                        licenseNumber: user.licenseNumber || '',
                     }
                  );

                  results.push({
                     userId: action.userId,
                     success: true,
                     message: 'License approved',
                  });
               } else if (action.action === 'reject') {
                  if (!action.reason) {
                     results.push({
                        userId: action.userId,
                        success: false,
                        message: 'Rejection reason is required',
                     });
                     continue;
                  }

                  user.licenseStatus = 'rejected';
                  user.licenseRejectionReason = action.reason;
                  user.licenseVerifiedAt = new Date();
                  user.licenseVerifiedBy = req.user._id;
                  user.status = 'license_rejected';

                  await user.save();

                  // Send rejection email
                  await emailService.sendLicenseRejectionNotification(
                     user.email,
                     {
                        firstName: user.firstName,
                        reason: action.reason,
                     }
                  );

                  results.push({
                     userId: action.userId,
                     success: true,
                     message: 'License rejected',
                  });
               }
            } catch (error) {
               results.push({
                  userId: action.userId,
                  success: false,
                  message: (error as Error).message,
               });
            }
         }

         res.json({
            success: true,
            message: 'Bulk processing completed',
            data: results,
         });
      } catch (error) {
         res.status(500).json({
            success: false,
            message: 'Error processing bulk license actions',
            error: (error as Error).message,
         });
      }
   }
}

export const licenseController = new LicenseController();
