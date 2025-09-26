import mongoose from 'mongoose';
declare global {
    namespace NodeJS {
        interface Global {
            testUtils: {
                createObjectId: () => mongoose.Types.ObjectId;
                waitFor: (ms: number) => Promise<void>;
                mockExternalAPI: (service: string, response: any) => void;
                createTestWorkplace: () => any;
                createTestUser: (workplaceId: mongoose.Types.ObjectId) => any;
                createTestPatient: (workplaceId: mongoose.Types.ObjectId, createdBy: mongoose.Types.ObjectId) => any;
                createTestDiagnosticRequest: (patientId: mongoose.Types.ObjectId, pharmacistId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => any;
            };
        }
    }
}
export {};
//# sourceMappingURL=setup.d.ts.map