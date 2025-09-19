import { Request, Response } from 'express';
export declare class PatientMTRIntegrationController {
    getPatientMTRSummary: (req: Request, res: Response, next: Function) => void;
    getPatientDataForMTR: (req: Request, res: Response, next: Function) => void;
    getPatientDashboardMTRData: (req: Request, res: Response, next: Function) => void;
    syncMedicationsWithMTR: (req: Request, res: Response, next: Function) => void;
    searchPatientsWithMTR: (req: Request, res: Response, next: Function) => void;
}
export declare const patientMTRIntegrationController: PatientMTRIntegrationController;
//# sourceMappingURL=patientMTRIntegrationController.d.ts.map