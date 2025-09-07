"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapyPlan = exports.DrugSearchHistory = exports.interactionService = exports.openfdaService = exports.dailymedService = exports.rxnormService = exports.drugRoutes = exports.drugController = void 0;
const drugController_1 = __importDefault(require("../controllers/drugController"));
exports.drugController = drugController_1.default;
const drugRoutes_1 = __importDefault(require("../routes/drugRoutes"));
exports.drugRoutes = drugRoutes_1.default;
const rxnormService_1 = __importDefault(require("../services/rxnormService"));
exports.rxnormService = rxnormService_1.default;
const dailymedService_1 = __importDefault(require("../services/dailymedService"));
exports.dailymedService = dailymedService_1.default;
const openfdaService_1 = __importDefault(require("../services/openfdaService"));
exports.openfdaService = openfdaService_1.default;
const interactionService_1 = __importDefault(require("../services/interactionService"));
exports.interactionService = interactionService_1.default;
const drugCacheModel_1 = require("../models/drugCacheModel");
Object.defineProperty(exports, "DrugSearchHistory", { enumerable: true, get: function () { return drugCacheModel_1.DrugSearchHistory; } });
Object.defineProperty(exports, "TherapyPlan", { enumerable: true, get: function () { return drugCacheModel_1.TherapyPlan; } });
console.log('Drug Information Center module imports successfully!');
console.log('All components are properly typed and compiled.');
//# sourceMappingURL=simpleTest.js.map