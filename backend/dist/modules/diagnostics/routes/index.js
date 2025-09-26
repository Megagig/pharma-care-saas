"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationRoutes = exports.interactionRoutes = exports.labRoutes = exports.diagnosticRoutes = void 0;
var diagnosticRoutes_1 = require("./diagnosticRoutes");
Object.defineProperty(exports, "diagnosticRoutes", { enumerable: true, get: function () { return __importDefault(diagnosticRoutes_1).default; } });
var labRoutes_1 = require("./labRoutes");
Object.defineProperty(exports, "labRoutes", { enumerable: true, get: function () { return __importDefault(labRoutes_1).default; } });
var interactionRoutes_1 = require("./interactionRoutes");
Object.defineProperty(exports, "interactionRoutes", { enumerable: true, get: function () { return __importDefault(interactionRoutes_1).default; } });
var integration_routes_1 = require("./integration.routes");
Object.defineProperty(exports, "integrationRoutes", { enumerable: true, get: function () { return __importDefault(integration_routes_1).default; } });
//# sourceMappingURL=index.js.map