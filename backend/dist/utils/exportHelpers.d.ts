interface ReportData {
    reportType: string;
    workplaceId: string;
    filters: any;
    data: any[];
    generatedAt: Date;
    [key: string]: any;
}
interface ExportOptions {
    includeCharts?: boolean;
    includeRawData?: boolean;
    customTemplate?: string;
    [key: string]: any;
}
export declare const generatePDFReport: (data: ReportData, fileName: string, options?: ExportOptions) => Promise<string>;
export declare const generateExcelReport: (data: ReportData, fileName: string, options?: ExportOptions) => Promise<string>;
export declare const generateCSVReport: (data: ReportData, fileName: string, options?: ExportOptions) => Promise<string>;
export declare const cleanupOldExports: (daysOld?: number) => Promise<void>;
export declare const getExportStats: () => Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
}>;
export declare const isValidExportFileName: (fileName: string) => boolean;
export declare const sanitizeExportFileName: (fileName: string) => string;
export {};
//# sourceMappingURL=exportHelpers.d.ts.map