"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
(0, db_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
const server = app_1.default.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
process.on('unhandledRejection', (err) => {
    console.log(`Unhandled Rejection: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    console.log(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map