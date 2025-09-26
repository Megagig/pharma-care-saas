"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rxnormService_1 = __importDefault(require("../modules/drug-info/services/rxnormService"));
const dailymedService_1 = __importDefault(require("../modules/drug-info/services/dailymedService"));
const openfdaService_1 = __importDefault(require("../modules/drug-info/services/openfdaService"));
const interactionService_1 = __importDefault(require("../modules/drug-info/services/interactionService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.get('/drug-search', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Drug name is required',
            });
        }
        const results = await rxnormService_1.default.searchDrugs(name);
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug search error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error searching for drugs',
            message: error.message,
        });
    }
});
router.get('/drug-monograph/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug id is required',
            });
        }
        const monograph = await dailymedService_1.default.getMonographById(id);
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: monograph,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug monograph error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error retrieving drug monograph',
            message: error.message,
        });
    }
});
router.get('/drug-indications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug id is required',
            });
        }
        const indications = await openfdaService_1.default.getDrugIndications(id);
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: indications,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug indications error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error retrieving drug indications',
            message: error.message,
        });
    }
});
router.post('/drug-interactions', async (req, res) => {
    try {
        const { rxcui, rxcuis } = req.body;
        let results;
        if (rxcui) {
            results = await interactionService_1.default.getInteractionsForDrug(rxcui);
        }
        else if (rxcuis && Array.isArray(rxcuis)) {
            results = await interactionService_1.default.getInteractionsForMultipleDrugs(rxcuis);
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Either rxcui or rxcuis array is required',
            });
        }
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug interactions error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error checking drug interactions',
            message: error.message,
        });
    }
});
router.get('/drug-adverse-effects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug id is required',
            });
        }
        let drugName = id;
        try {
            const rxCuiData = await rxnormService_1.default.getRxCuiByName(id);
            if (rxCuiData &&
                rxCuiData.idGroup &&
                rxCuiData.idGroup.rxnormId &&
                rxCuiData.idGroup.rxnormId.length > 0) {
                const firstRxCui = rxCuiData.idGroup.rxnormId[0];
                if (firstRxCui) {
                    drugName = firstRxCui;
                }
            }
        }
        catch (e) {
            logger_1.default.info('Could not resolve RxCUI, using provided ID as name');
        }
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const adverseEffects = await openfdaService_1.default.getAdverseEffects(drugName, limitNum);
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: adverseEffects,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug adverse effects error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error retrieving adverse effects',
            message: error.message,
        });
    }
});
router.get('/drug-formulary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug id is required',
            });
        }
        const equivalents = await rxnormService_1.default.getTherapeuticEquivalents(id);
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            data: equivalents,
        });
    }
    catch (error) {
        logger_1.default.error('Public drug formulary error:', error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            success: false,
            error: 'Error retrieving formulary information',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=publicApiRoutes.js.map