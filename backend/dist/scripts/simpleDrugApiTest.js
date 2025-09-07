"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testDrugAPI() {
    try {
        console.log('Testing drug search API...');
        try {
            const response = await axios_1.default.get('http://localhost:5000/api/drugs/search', {
                params: { name: 'aspirin' },
                withCredentials: true,
            });
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            const drugGroup = response.data?.data?.drugGroup || response.data?.drugGroup;
            if (drugGroup) {
                console.log('✅ Received valid drug data with drug group');
                const conceptGroups = drugGroup.conceptGroup || [];
                let totalConcepts = 0;
                conceptGroups.forEach((group) => {
                    const conceptCount = group.conceptProperties?.length || 0;
                    totalConcepts += conceptCount;
                    console.log(`- Group ${group.tty || 'unknown'}: ${conceptCount} concepts`);
                });
                console.log(`Total drug concepts found: ${totalConcepts}`);
            }
            else {
                console.log('❌ Invalid response format - missing drugGroup');
            }
        }
        catch (error) {
            console.error('Error calling API:', error.message);
            if (error.response) {
                console.log('Error response status:', error.response.status);
                console.log('Error data:', error.response.data);
            }
        }
    }
    catch (error) {
        console.error('Test failed:', error);
    }
}
testDrugAPI();
//# sourceMappingURL=simpleDrugApiTest.js.map