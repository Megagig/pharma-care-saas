import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { upload } from '../services/licenseUploadService';
export { upload };
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