"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const disableProfiling = process.env.DISABLE_PROFILING === 'true';
        const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10');
        const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2');
        const maxIdleTimeMS = parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000');
        const serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000');
        const options = {
            maxPoolSize,
            minPoolSize,
            maxIdleTimeMS,
            serverSelectionTimeoutMS,
            autoIndex: false,
            bufferCommands: false,
        };
        if (!disableProfiling) {
            logger_1.default.info('MongoDB profiling enabled');
        }
        else {
            logger_1.default.info('MongoDB profiling disabled for Atlas compatibility');
        }
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI, options);
        logger_1.default.info(`MongoDB Connected: ${conn.connection.host}`);
        logger_1.default.info(`MongoDB Connection Pool: ${minPoolSize}-${maxPoolSize} connections`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.default.error('Database connection failed:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map