"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const mockDrugData = {
    success: true,
    data: {
        drugGroup: {
            name: 'aspirin',
            conceptGroup: [
                {
                    tty: 'SCD',
                    conceptProperties: [
                        {
                            rxcui: '123456',
                            name: 'Aspirin 81mg Tablet',
                            synonym: 'ASA 81mg',
                            tty: 'SCD',
                            language: 'ENG',
                            suppress: 'N',
                            umlscui: 'C123456',
                        },
                        {
                            rxcui: '234567',
                            name: 'Aspirin 325mg Tablet',
                            synonym: 'ASA 325mg',
                            tty: 'SCD',
                            language: 'ENG',
                            suppress: 'N',
                            umlscui: 'C234567',
                        },
                    ],
                },
            ],
        },
    },
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get('/api/drugs/search', (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res
            .status(400)
            .json({ success: false, error: 'Drug name is required' });
    }
    console.log(`Received drug search request for: ${name}`);
    return res.json(mockDrugData);
});
const PORT = 3333;
const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    testAPIClient();
});
async function testAPIClient() {
    try {
        console.log('Testing API client with axios...');
        const axiosResponse = await axios_1.default.get(`http://localhost:${PORT}/api/drugs/search`, {
            params: { name: 'aspirin' },
        });
        console.log('Axios response status:', axiosResponse.status);
        console.log('Axios data structure:', Object.keys(axiosResponse.data));
        console.log('Response has drugGroup:', !!axiosResponse.data.data?.drugGroup);
        console.log('\nTesting API client with fetch...');
        const fetchResponse = await fetch(`http://localhost:${PORT}/api/drugs/search?name=aspirin`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        console.log('Fetch response status:', fetchResponse.status);
        const fetchData = await fetchResponse.json();
        if (fetchData && typeof fetchData === 'object') {
            console.log('Fetch data structure:', Object.keys(fetchData));
            console.log('Response has drugGroup:', !!fetchData.data?.drugGroup);
        }
        server.close(() => {
            console.log('Test completed, server shut down.');
        });
    }
    catch (error) {
        console.error('API test error:', error);
        server.close();
    }
}
//# sourceMappingURL=testDrugAPIIntegration.js.map