"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Patient_1 = __importDefault(require("./models/Patient"));
const Allergy_1 = __importDefault(require("./models/Allergy"));
const Condition_1 = __importDefault(require("./models/Condition"));
const MedicationRecord_1 = __importDefault(require("./models/MedicationRecord"));
const ClinicalAssessment_1 = __importDefault(require("./models/ClinicalAssessment"));
const DrugTherapyProblem_1 = __importDefault(require("./models/DrugTherapyProblem"));
const CarePlan_1 = __importDefault(require("./models/CarePlan"));
const Visit_1 = __importDefault(require("./models/Visit"));
const tenancyGuard_1 = require("./utils/tenancyGuard");
function validatePatientManagementModels() {
    console.log('🔍 Validating Patient Management Models (BIT 1)...');
    const models = [
        { name: 'Patient', model: Patient_1.default },
        { name: 'Allergy', model: Allergy_1.default },
        { name: 'Condition', model: Condition_1.default },
        { name: 'MedicationRecord', model: MedicationRecord_1.default },
        { name: 'ClinicalAssessment', model: ClinicalAssessment_1.default },
        { name: 'DrugTherapyProblem', model: DrugTherapyProblem_1.default },
        { name: 'CarePlan', model: CarePlan_1.default },
        { name: 'Visit', model: Visit_1.default },
    ];
    models.forEach(({ name, model }) => {
        if (model && typeof model === 'function') {
            console.log(`✅ ${name} model: Successfully imported and valid`);
        }
        else {
            console.log(`❌ ${name} model: Import failed or invalid`);
        }
    });
    console.log('\n🔧 Testing utility functions...');
    if (typeof tenancyGuard_1.tenancyGuardPlugin === 'function') {
        console.log('✅ tenancyGuardPlugin: Available and valid');
    }
    else {
        console.log('❌ tenancyGuardPlugin: Not available or invalid');
    }
    if (typeof tenancyGuard_1.addAuditFields === 'function') {
        console.log('✅ addAuditFields: Available and valid');
    }
    else {
        console.log('❌ addAuditFields: Not available or invalid');
    }
    if (typeof tenancyGuard_1.generateMRN === 'function') {
        console.log('✅ generateMRN: Available and valid');
        const testMRN = (0, tenancyGuard_1.generateMRN)('LAG', 1);
        if (testMRN === 'PHM-LAG-00001') {
            console.log('✅ generateMRN: Function works correctly');
        }
        else {
            console.log('❌ generateMRN: Function output incorrect');
        }
    }
    else {
        console.log('❌ generateMRN: Not available or invalid');
    }
    console.log('\n🎉 BIT 1 - Data Models validation complete!');
    console.log('Ready to proceed to BIT 2 - Server: Routes & Controllers');
}
exports.default = validatePatientManagementModels;
if (require.main === module) {
    validatePatientManagementModels();
}
//# sourceMappingURL=validateModels.js.map