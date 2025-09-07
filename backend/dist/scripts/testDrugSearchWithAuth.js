"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_URL = 'http://localhost:5000';
const DRUG_NAME = 'aspirin';
async function testDrugSearch() {
    try {
        const loginResponse = await axios_1.default.post(`${API_URL}/api/users/login`, {
            email: process.env.TEST_USER_EMAIL || 'admin@example.com',
            password: process.env.TEST_USER_PASSWORD || 'password123',
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Login response status:', loginResponse.status);
        const cookies = loginResponse.headers['set-cookie'];
        console.log('Cookies received:', cookies);
        const searchResponse = await axios_1.default.get(`${API_URL}/api/drugs/search`, {
            params: { name: DRUG_NAME },
            withCredentials: true,
            headers: {
                Cookie: cookies,
                'Content-Type': 'application/json',
            },
        });
        console.log(`Drug search results for "${DRUG_NAME}":`);
        const data = searchResponse.data;
        if (data.success) {
            const drugGroups = data.data?.drugGroup?.conceptGroup || [];
            console.log(`Found ${drugGroups.length} concept groups`);
            drugGroups.forEach((group, i) => {
                const concepts = group.conceptProperties || [];
                console.log(`Group ${i + 1} (${group.tty}): ${concepts.length} concepts`);
                concepts.slice(0, 3).forEach((concept) => {
                    console.log(`  - ${concept.name} (${concept.rxcui})`);
                });
                if (concepts.length > 3) {
                    console.log(`  - ... and ${concepts.length - 3} more`);
                }
            });
        }
        else {
            console.log('API returned error:', data.error);
        }
    }
    catch (error) {
        console.error('Error making API request:');
        if (axios_1.default.isAxiosError(error)) {
            console.error('Status:', error.response?.status);
            console.error('Response data:', error.response?.data);
        }
        else {
            console.error(error);
        }
    }
}
testDrugSearch();
//# sourceMappingURL=testDrugSearchWithAuth.js.map