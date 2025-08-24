import { Request, Response } from 'express';
import multer from 'multer';
import { IUser } from '../models/User';
interface AuthRequest extends Request {
    user?: IUser;
    subscription?: any;
}
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
export {};
//# sourceMappingURL=licenseController.d.ts.map