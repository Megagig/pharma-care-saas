"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxnormService_1 = __importDefault(require("../services/rxnormService"));
const dailymedService_1 = __importDefault(require("../services/dailymedService"));
const openfdaService_1 = __importDefault(require("../services/openfdaService"));
const interactionService_1 = __importDefault(require("../services/interactionService"));
const drugCacheModel_1 = require("../models/drugCacheModel");
const logger_1 = __importDefault(require("../../../utils/logger"));
class DrugController {
    async searchDrugs(req, res, next) {
        try {
            const { name } = req.query;
            if (!name || typeof name !== 'string') {
                res.status(400).json({ error: 'Drug name is required' });
                return;
            }
            const results = await rxnormService_1.default.searchDrugs(name);
            if (req.user && req.user._id) {
                await drugCacheModel_1.DrugSearchHistory.create({
                    userId: req.user._id,
                    searchTerm: name,
                    searchResults: results
                });
            }
            res.json(results);
        }
        catch (error) {
            logger_1.default.error('Drug search error:', error);
            next(error);
        }
    }
    async getMonograph(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: 'Monograph ID is required' });
                return;
            }
            const monograph = await dailymedService_1.default.getMonographById(id);
            res.json(monograph);
        }
        catch (error) {
            logger_1.default.error('Monograph fetch error:', error);
            next(error);
        }
    }
    async checkInteractions(req, res, next) {
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
                res.status(400).json({ error: 'Either rxcui or rxcuis array is required' });
                return;
            }
            res.json(results);
        }
        catch (error) {
            logger_1.default.error('Interaction check error:', error);
            next(error);
        }
    }
    async getAdverseEffects(req, res, next) {
        try {
            const { id } = req.params;
            const { limit } = req.query;
            if (!id) {
                res.status(400).json({ error: 'Drug identifier is required' });
                return;
            }
            let drugName = id;
            try {
                const rxCuiData = await rxnormService_1.default.getRxCuiByName(id);
                if (rxCuiData && rxCuiData.idGroup && rxCuiData.idGroup.rxnormId && rxCuiData.idGroup.rxnormId.length > 0) {
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
            res.json(adverseEffects);
        }
        catch (error) {
            logger_1.default.error('Adverse effects fetch error:', error);
            next(error);
        }
    }
    async getFormulary(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: 'Drug identifier is required' });
                return;
            }
            const equivalents = await rxnormService_1.default.getTherapeuticEquivalents(id);
            res.json(equivalents);
        }
        catch (error) {
            logger_1.default.error('Formulary fetch error:', error);
            next(error);
        }
    }
    async createTherapyPlan(req, res, next) {
        try {
            const { planName, drugs, guidelines } = req.body;
            if (!planName || !drugs) {
                res.status(400).json({ error: 'Plan name and drugs are required' });
                return;
            }
            const therapyPlan = await drugCacheModel_1.TherapyPlan.create({
                userId: req.user?._id,
                planName,
                drugs,
                guidelines
            });
            res.status(201).json(therapyPlan);
        }
        catch (error) {
            logger_1.default.error('Therapy plan creation error:', error);
            next(error);
        }
    }
    async getTherapyPlans(req, res, next) {
        try {
            const therapyPlans = await drugCacheModel_1.TherapyPlan.find({ userId: req.user?._id })
                .sort({ createdAt: -1 });
            res.json(therapyPlans);
        }
        catch (error) {
            logger_1.default.error('Therapy plans fetch error:', error);
            next(error);
        }
    }
    async getTherapyPlanById(req, res, next) {
        try {
            const { id } = req.params;
            const therapyPlan = await drugCacheModel_1.TherapyPlan.findOne({
                _id: id,
                userId: req.user?._id
            });
            if (!therapyPlan) {
                res.status(404).json({ error: 'Therapy plan not found' });
                return;
            }
            res.json(therapyPlan);
        }
        catch (error) {
            logger_1.default.error('Therapy plan fetch error:', error);
            next(error);
        }
    }
    async updateTherapyPlan(req, res, next) {
        try {
            const { id } = req.params;
            const { planName, drugs, guidelines } = req.body;
            const therapyPlan = await drugCacheModel_1.TherapyPlan.findOneAndUpdate({
                _id: id,
                userId: req.user?._id
            }, {
                planName,
                drugs,
                guidelines,
                updatedAt: new Date()
            }, { new: true });
            if (!therapyPlan) {
                res.status(404).json({ error: 'Therapy plan not found' });
                return;
            }
            res.json(therapyPlan);
        }
        catch (error) {
            logger_1.default.error('Therapy plan update error:', error);
            next(error);
        }
    }
    async deleteTherapyPlan(req, res, next) {
        try {
            const { id } = req.params;
            const therapyPlan = await drugCacheModel_1.TherapyPlan.findOneAndDelete({
                _id: id,
                userId: req.user?._id
            });
            if (!therapyPlan) {
                res.status(404).json({ error: 'Therapy plan not found' });
                return;
            }
            res.json({ message: 'Therapy plan deleted successfully' });
        }
        catch (error) {
            logger_1.default.error('Therapy plan delete error:', error);
            next(error);
        }
    }
}
exports.default = new DrugController();
//# sourceMappingURL=drugController.js.map