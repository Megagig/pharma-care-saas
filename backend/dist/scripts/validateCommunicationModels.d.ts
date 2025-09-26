declare function validateCommunicationModels(): Promise<{
    success: boolean;
    message: string;
    tests: {
        conversation: boolean;
        message: boolean;
        notification: boolean;
        auditLog: boolean;
        indexes: boolean;
        relationships: boolean;
        encryption: boolean;
        hipaaCompliance: boolean;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: string;
    tests?: undefined;
}>;
export default validateCommunicationModels;
//# sourceMappingURL=validateCommunicationModels.d.ts.map