"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const performanceMonitoring_1 = require("./utils/performanceMonitoring");
const InvitationCronService_1 = require("./services/InvitationCronService");
const WorkspaceStatsCronService_1 = __importDefault(require("./services/WorkspaceStatsCronService"));
const UsageAlertCronService_1 = __importDefault(require("./services/UsageAlertCronService"));
const EmailDeliveryCronService_1 = require("./services/EmailDeliveryCronService");
const communicationSocketService_1 = __importDefault(require("./services/communicationSocketService"));
const socketNotificationService_1 = __importDefault(require("./services/socketNotificationService"));
const AppointmentSocketService_1 = __importDefault(require("./services/AppointmentSocketService"));
const QueueService_1 = require("./services/QueueService");
const workers_1 = require("./jobs/workers");
require("./models/Medication");
require("./models/Conversation");
require("./models/Message");
const PORT = parseInt(process.env.PORT || '5000', 10);
let server;
let redisClient = null;
async function initializeServer() {
    try {
        await (0, db_1.default)();
        console.log('✅ Database connected successfully');
        try {
            const seedWorkspaces = (await Promise.resolve().then(() => __importStar(require('./scripts/seedWorkspaces')))).default;
            await seedWorkspaces();
        }
        catch (error) {
            console.error('⚠️ Error seeding workspaces:', error);
        }
        performanceMonitoring_1.performanceCollector.startSystemMetricsCollection();
        try {
            const queueService = QueueService_1.QueueService.getInstance();
            await queueService.initialize();
            await (0, workers_1.initializeWorkers)();
            console.log('✅ Queue Service and Job Workers initialized successfully');
        }
        catch (error) {
            console.error('⚠️ Queue Service initialization failed:', error);
            console.log('ℹ️ Continuing without background jobs');
        }
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
    const httpServer = (0, http_1.createServer)(app_1.default);
    const socketCorsOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.8.167:5173',
        'https://PharmaPilot-nttq.onrender.com',
        process.env.FRONTEND_URL || 'http://localhost:3000',
    ];
    if (process.env.CORS_ORIGINS) {
        socketCorsOrigins.push(...process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()));
    }
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: socketCorsOrigins,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    const communicationSocketService = new communicationSocketService_1.default(io);
    const socketNotificationService = new socketNotificationService_1.default(io);
    const appointmentSocketService = new AppointmentSocketService_1.default(io);
    const { initializeChatSocketService } = await Promise.resolve().then(() => __importStar(require('./services/chat/ChatSocketService')));
    const { initializePresenceModel } = await Promise.resolve().then(() => __importStar(require('./models/chat/Presence')));
    const Redis = (await Promise.resolve().then(() => __importStar(require('ioredis')))).default;
    if (process.env.REDIS_URL) {
        try {
            redisClient = new Redis(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                connectTimeout: 10000,
                commandTimeout: 5000,
                enableOfflineQueue: false,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 200, 2000);
                    if (times > 10) {
                        console.log('❌ Redis presence tracking: Max retry attempts reached');
                        return null;
                    }
                    return delay;
                },
                reconnectOnError: (err) => {
                    console.log('Redis presence tracking: Reconnect attempt:', err.message);
                    return true;
                },
            });
            redisClient.on('connect', () => {
                console.log('✅ Redis connected for presence tracking');
            });
            redisClient.on('error', (err) => {
                console.error('❌ Redis presence tracking error:', err.message);
            });
            redisClient.on('close', () => {
                console.log('Redis presence tracking connection closed');
            });
            redisClient.on('end', () => {
                console.log('Redis presence tracking connection ended');
            });
            initializePresenceModel(redisClient);
        }
        catch (error) {
            console.error('❌ Failed to initialize Redis presence tracking:', error);
            redisClient = null;
        }
    }
    else {
        console.log('ℹ️ Redis presence tracking disabled (no REDIS_URL configured)');
    }
    const chatSocketService = initializeChatSocketService(io);
    app_1.default.set('communicationSocket', communicationSocketService);
    app_1.default.set('socketNotification', socketNotificationService);
    app_1.default.set('appointmentSocket', appointmentSocketService);
    app_1.default.set('chatSocket', chatSocketService);
    const server = httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        console.log(`📡 Socket.IO server initialized for real-time communication`);
        if (process.env.NODE_ENV !== 'test') {
            InvitationCronService_1.invitationCronService.start();
            setTimeout(() => WorkspaceStatsCronService_1.default.start(), 1000);
            setTimeout(() => UsageAlertCronService_1.default.start(), 2000);
            setTimeout(() => EmailDeliveryCronService_1.emailDeliveryCronService.start(), 3000);
        }
        if (process.env.NODE_ENV === 'production') {
            setInterval(() => {
                if (global.gc) {
                    global.gc();
                    console.log('Garbage collection triggered');
                }
            }, 5 * 60 * 1000);
        }
        setTimeout(() => {
            if (global.gc) {
                global.gc();
                console.log('Initial garbage collection after startup');
            }
        }, 10000);
    });
    return server;
}
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    try {
        if (server) {
            server.close(() => {
                console.log('HTTP server closed');
            });
        }
        if (redisClient) {
            try {
                await redisClient.quit();
                console.log('✅ Redis presence tracking closed');
            }
            catch (error) {
                console.error('Error closing Redis presence tracking:', error);
                redisClient.disconnect();
            }
        }
        try {
            const PerformanceCacheService = (await Promise.resolve().then(() => __importStar(require('./services/PerformanceCacheService')))).default;
            await PerformanceCacheService.getInstance().close();
            console.log('✅ Performance cache service shut down');
        }
        catch (error) {
            console.log('ℹ️ Performance cache service not active or already shut down');
        }
        try {
            const CacheManager = (await Promise.resolve().then(() => __importStar(require('./services/CacheManager')))).default;
            await CacheManager.getInstance().close();
            console.log('✅ Cache manager shut down');
        }
        catch (error) {
            console.log('ℹ️ Cache manager not active or already shut down');
        }
        try {
            const RedisCacheService = (await Promise.resolve().then(() => __importStar(require('./services/RedisCacheService')))).default;
            await RedisCacheService.close();
            console.log('✅ Redis cache service shut down');
        }
        catch (error) {
            console.log('ℹ️ Redis cache service not active or already shut down');
        }
        try {
            const { shutdownRedisCache } = await Promise.resolve().then(() => __importStar(require('./utils/performanceOptimization')));
            await shutdownRedisCache();
            console.log('✅ Performance optimization cache shut down');
        }
        catch (error) {
            console.log('ℹ️ Performance optimization cache not active or already shut down');
        }
        try {
            const { QueueService } = await Promise.resolve().then(() => __importStar(require('./services/QueueService')));
            const queueService = QueueService.getInstance();
            await queueService.closeAll();
            console.log('✅ Queue Service shut down successfully');
        }
        catch (error) {
            console.log('ℹ️ Queue Service not active or already shut down');
        }
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        console.log('✅ Server closed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection: ${err.message}`);
    console.log('Promise:', promise);
    if (err.message.includes('Cannot set headers after they are sent')) {
        console.warn('⚠️ Headers already sent error - this is likely a timing issue with async operations');
        return;
    }
    if (err.message.includes('Reached the max retries per request limit') ||
        err.message.includes('MaxRetriesPerRequestError') ||
        err.message.includes('Connection is closed')) {
        console.error('❌ Redis connection error detected:', err.message);
        console.log('ℹ️ Application will continue without Redis caching');
        return;
    }
    gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
    console.log(`Uncaught Exception: ${err.message}`);
    console.error('Stack trace:', err.stack);
    if (err.message && (err.message.includes('Reached the max retries per request limit') ||
        err.message.includes('MaxRetriesPerRequestError') ||
        err.message.includes('Connection is closed') ||
        err.message.includes('Redis'))) {
        console.error('❌ Redis-related uncaught exception:', err.message);
        console.log('ℹ️ Application will continue without Redis caching');
        return;
    }
    gracefulShutdown('uncaughtException');
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
initializeServer()
    .then((serverInstance) => {
    server = serverInstance;
})
    .catch((error) => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map