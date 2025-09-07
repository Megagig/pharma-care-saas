"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxnormService_1 = __importDefault(require("../modules/drug-info/services/rxnormService"));
async function testDrugSearch() {
    try {
        console.log('Testing RxNorm drug search service...');
        const searchTerm = process.argv[2] || 'aspirin';
        console.log(`Searching for drug: ${searchTerm}`);
        const results = await rxnormService_1.default.searchDrugs(searchTerm);
        console.log('Search Results:');
        console.log(JSON.stringify(results, null, 2));
        if (results.drugGroup && results.drugGroup.conceptGroup) {
            const conceptGroups = results.drugGroup.conceptGroup;
            console.log(`Found ${conceptGroups.length} concept groups`);
            conceptGroups.forEach((group, index) => {
                if (group.conceptProperties) {
                    console.log(`Group ${index + 1} (${group.tty}): ${group.conceptProperties.length} concepts`);
                    group.conceptProperties.slice(0, 3).forEach((prop) => {
                        console.log(`  - ${prop.name} (${prop.rxcui})`);
                    });
                    if (group.conceptProperties.length > 3) {
                        console.log(`  - ... and ${group.conceptProperties.length - 3} more`);
                    }
                }
            });
        }
        else {
            console.log('No concept groups found in response');
        }
    }
    catch (error) {
        console.error('Error testing drug search:', error);
    }
}
testDrugSearch();
//# sourceMappingURL=testDrugSearch.js.map