"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rxnormService_1 = __importDefault(require("../modules/drug-info/services/rxnormService"));
const dailymedService_1 = __importDefault(require("../modules/drug-info/services/dailymedService"));
const interactionService_1 = __importDefault(require("../modules/drug-info/services/interactionService"));
const openfdaService_1 = __importDefault(require("../modules/drug-info/services/openfdaService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.get('/monograph/:id', async (req, res) => {
    console.log('=== PUBLIC MONOGRAPH API CALLED ===');
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Monograph ID is required',
            });
        }
        const monograph = await dailymedService_1.default.getMonographById(id);
        return res.json({
            success: true,
            data: monograph,
        });
    }
    catch (error) {
        logger_1.default.error('Public monograph fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error fetching monograph',
            message: error.message,
        });
    }
});
router.post('/interactions', async (req, res) => {
    console.log('=== PUBLIC INTERACTIONS API CALLED ===');
    try {
        const { rxcui, rxcuis } = req.body;
        if (!rxcui && (!rxcuis || !Array.isArray(rxcuis))) {
            return res.status(400).json({
                success: false,
                error: 'Valid rxcui or rxcuis array is required',
            });
        }
        let results;
        if (rxcui) {
            results = await interactionService_1.default.getInteractionsForDrug(rxcui);
        }
        else if (rxcuis && Array.isArray(rxcuis)) {
            results = await interactionService_1.default.getInteractionsForMultipleDrugs(rxcuis);
        }
        return res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        logger_1.default.error('Public interaction check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error checking interactions',
            message: error.message,
        });
    }
});
router.get('/adverse-effects/:id', async (req, res) => {
    console.log('=== PUBLIC ADVERSE EFFECTS API CALLED ===');
    try {
        const { id } = req.params;
        const { limit } = req.query;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug identifier is required',
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
        return res.json({
            success: true,
            data: adverseEffects,
        });
    }
    catch (error) {
        logger_1.default.error('Public adverse effects fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error fetching adverse effects',
            message: error.message,
        });
    }
});
router.get('/formulary/:id', async (req, res) => {
    console.log('=== PUBLIC FORMULARY API CALLED ===');
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Drug identifier is required',
            });
        }
        try {
            const equivalents = await rxnormService_1.default.getTherapeuticEquivalents(id);
            return res.json({
                success: true,
                data: equivalents,
            });
        }
        catch (error) {
            if (error.message && error.message.includes('404')) {
                return res.json({
                    success: true,
                    data: {
                        relatedGroup: {
                            rxcui: id,
                            name: 'Unknown drug',
                            conceptGroup: [],
                        },
                    },
                });
            }
            throw error;
        }
    }
    catch (error) {
        logger_1.default.error('Public formulary fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error fetching formulary',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=publicDrugDetailsRoutes.js.map