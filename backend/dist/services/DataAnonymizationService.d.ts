export interface AnonymizationOptions {
    method: 'hash' | 'mask' | 'generalize' | 'suppress' | 'pseudonymize';
    preserveFormat?: boolean;
    salt?: string;
    maskChar?: string;
    generalizationLevel?: number;
}
export interface AnonymizationResult {
    originalValue: any;
    anonymizedValue: any;
    method: string;
    reversible: boolean;
    metadata?: Record<string, any>;
}
declare class DataAnonymizationService {
    private static instance;
    private readonly defaultSalt;
    private readonly pseudonymMap;
    private constructor();
    static getInstance(): DataAnonymizationService;
    anonymizePatientId(patientId: string, options?: AnonymizationOptions): AnonymizationResult;
    anonymizeName(name: string, options?: AnonymizationOptions): AnonymizationResult;
    anonymizeAge(age: number, options?: AnonymizationOptions): AnonymizationResult;
    anonymizeLocation(location: string, options?: AnonymizationOptions): AnonymizationResult;
    anonymizeFinancialData(amount: number, options?: AnonymizationOptions): AnonymizationResult;
    anonymizeReportData(data: any[], sensitiveFields: string[], options?: Record<string, AnonymizationOptions>): any[];
    shouldAnonymizeData(userPermissions: string[], dataType: string, reportType: string): boolean;
    generateAnonymizationSummary(originalData: any[], anonymizedData: any[], sensitiveFields: string[]): any;
    private hashValue;
    private maskValue;
    private maskName;
    private generalizeName;
    private generalizeLocation;
    private pseudonymizeValue;
    private generatePseudonym;
    private anonymizeValue;
    private getUsedMethods;
    private validateDataIntegrity;
}
export default DataAnonymizationService;
//# sourceMappingURL=DataAnonymizationService.d.ts.map