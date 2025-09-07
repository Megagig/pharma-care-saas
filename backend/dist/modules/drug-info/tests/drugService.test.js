"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxnormService_1 = __importDefault(require("../services/rxnormService"));
const dailymedService_1 = __importDefault(require("../services/dailymedService"));
const openfdaService_1 = __importDefault(require("../services/openfdaService"));
const interactionService_1 = __importDefault(require("../services/interactionService"));
describe('Drug Information Services', () => {
    describe('RxNorm Service', () => {
        test('should search drugs by name', async () => {
            const results = await rxnormService_1.default.searchDrugs('aspirin');
            expect(results).toHaveProperty('drugGroup');
            expect(results.drugGroup).toHaveProperty('name', 'aspirin');
        }, 10000);
        test('should get RxCUI by name', async () => {
            const results = await rxnormService_1.default.getRxCuiByName('aspirin');
            expect(results).toHaveProperty('idGroup');
            expect(results.idGroup).toHaveProperty('name', 'aspirin');
        }, 10000);
        test('should get therapeutic equivalents', async () => {
            const results = await rxnormService_1.default.getTherapeuticEquivalents('1191');
            expect(results).toHaveProperty('relatedGroup');
        }, 10000);
    });
    describe('DailyMed Service', () => {
        test('should search monographs by drug name', async () => {
            const results = await dailymedService_1.default.searchMonographs('aspirin');
            expect(results).toHaveProperty('metadata');
        }, 10000);
        test('should get monograph by set ID', async () => {
            const searchResults = await dailymedService_1.default.searchMonographs('aspirin');
            if (searchResults && searchResults.results && searchResults.results.length > 0) {
                const setId = searchResults.results[0].setid;
                const results = await dailymedService_1.default.getMonographById(setId);
                expect(results).toHaveProperty('SPL');
            }
        }, 15000);
    });
    describe('OpenFDA Service', () => {
        test('should get adverse effects', async () => {
            const results = await openfdaService_1.default.getAdverseEffects('aspirin', 5);
            expect(results).toHaveProperty('results');
        }, 10000);
        test('should get drug labeling', async () => {
            const results = await openfdaService_1.default.getDrugLabeling('aspirin');
            expect(results).toHaveProperty('results');
        }, 10000);
    });
    describe('Interaction Service', () => {
        test('should get interactions for single drug', async () => {
            const results = await interactionService_1.default.getInteractionsForDrug('1191');
            expect(results).toHaveProperty('interactionTypeGroup');
        }, 10000);
        test('should get interactions for multiple drugs', async () => {
            const results = await interactionService_1.default.getInteractionsForMultipleDrugs(['1191', '341248']);
            expect(results).toHaveProperty('fullInteractionTypeGroup');
        }, 10000);
    });
});
//# sourceMappingURL=drugService.test.js.map