import { IManualLabOrder } from '../models/ManualLabOrder';
import { IPatient } from '../../../models/Patient';
import { IWorkplace } from '../../../models/Workplace';
import { IUser } from '../../../models/User';
export interface RequisitionTemplateData {
    orderId: string;
    orderDate: string;
    orderTime: string;
    priority: string;
    indication: string;
    patientName: string;
    patientDOB: string;
    patientGender: string;
    patientPhone: string;
    patientAddress: string;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    pharmacyEmail: string;
    pharmacistName: string;
    tests: Array<{
        name: string;
        code: string;
        specimenType: string;
        category: string;
        refRange: string;
    }>;
    qrCodeDataUrl: string;
    barcodeDataUrl: string;
    securityToken: string;
    generatedAt: string;
}
export interface PDFGenerationResult {
    pdfBuffer: Buffer;
    fileName: string;
    url: string;
    metadata: {
        orderId: string;
        generatedAt: Date;
        fileSize: number;
        securityHash: string;
    };
}
export declare class PDFGenerationService {
    private browser;
    private templatePath;
    constructor();
    private initializeBrowser;
    private generateQRCode;
    private generateBarcode;
    private renderTemplate;
    private generateSecurityHash;
    private formatPatientAddress;
    private formatPharmacyAddress;
    generateRequisitionPDF(order: IManualLabOrder, patient: IPatient, workplace: IWorkplace, pharmacist: IUser): Promise<PDFGenerationResult>;
    addWatermark(pdfBuffer: Buffer, watermarkText: string, opacity?: number): Promise<Buffer>;
    validateGenerationRequirements(order: IManualLabOrder, patient: IPatient, workplace: IWorkplace, pharmacist: IUser): void;
    cleanup(): Promise<void>;
    getBrowserStatus(): Promise<{
        isConnected: boolean;
        version?: string;
    }>;
}
export declare const pdfGenerationService: PDFGenerationService;
//# sourceMappingURL=pdfGenerationService.d.ts.map