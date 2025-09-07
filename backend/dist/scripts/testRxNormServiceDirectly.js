"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxnormService_1 = __importDefault(require("../modules/drug-info/services/rxnormService"));
async function testDirectlyWithRxNormService() {
    try {
        console.log('Testing RxNorm service directly for "aspirin"');
        const results = await rxnormService_1.default.searchDrugs('aspirin');
        if (results && results.drugGroup && results.drugGroup.conceptGroup) {
            console.log(`Found ${results.drugGroup.conceptGroup.length} concept groups`);
            results.drugGroup.conceptGroup.forEach((group, index) => {
                console.log(`Group ${index + 1} (${group.tty}): ${group.conceptProperties?.length || 0} concepts`);
                if (group.conceptProperties && group.conceptProperties.length > 0) {
                    group.conceptProperties.slice(0, 3).forEach((drug) => {
                        console.log(`  - ${drug.name} (${drug.rxcui})`);
                    });
                    if (group.conceptProperties.length > 3) {
                        console.log(`  - ... and ${group.conceptProperties.length - 3} more`);
                    }
                }
            });
        }
        else {
            console.log('No results or invalid structure received');
            console.log('Raw results:', JSON.stringify(results, null, 2));
        }
    }
    catch (error) {
        console.error('Error calling RxNorm service directly:', error);
    }
}
testDirectlyWithRxNormService();
//# sourceMappingURL=testRxNormServiceDirectly.js.map