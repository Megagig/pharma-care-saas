import { Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../types/auth';
export declare const upload: multer.Multer;
export declare class LicenseController {
    uploadLicense(req: AuthRequest, res: Response): Promise<any>;
    getLicenseStatus(req: AuthRequest, res: Response): Promise<any>;
    downloadLicenseDocument(req: AuthRequest, res: Response): Promise<any>;
    deleteLicenseDocument(req: AuthRequest, res: Response): Promise<any>;
    validateLicenseNumber(req: AuthRequest, res: Response): Promise<any>;
    bulkProcessLicenses(req: AuthRequest, res: Response): Promise<any>;
}
export declare const licenseController: LicenseController;
//# sourceMappingURL=licenseController.d.ts.map