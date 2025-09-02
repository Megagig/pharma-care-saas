import mongoose from 'mongoose';
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidObjectId(): R;
        }
    }
    var testUtils: {
        createObjectId: () => mongoose.Types.ObjectId;
        createMockUser: () => any;
        createMockWorkplace: () => any;
        createMockPatient: () => any;
    };
}
//# sourceMappingURL=setup.d.ts.map