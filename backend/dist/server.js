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
require("./models/Medication");
require("./models/Conversation");
require("./models/Message");
const PORT = parseInt(process.env.PORT || '5000', 10);
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
            const { initializeUpstashRedis, testUpstashRedisConnection } = await Promise.resolve().then(() => __importStar(require('./config/upstashRedis')));
            initializeUpstashRedis();
            const isConnected = await testUpstashRedisConnection();
            if (isConnected) {
                console.log('✅ Upstash Redis (REST API) connected successfully');
            }
            else {
                console.log('ℹ️ Upstash Redis not available, using fallback cache');
            }
        }
        catch (error) {
            console.log('ℹ️ Upstash Redis initialization skipped:', error);
        }
        console.log('ℹ️ Queue Service and Job Workers disabled (not required for core functionality)');
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
    let redisClient = null;
    if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        redisClient.on('connect', () => {
            console.log('✅ Redis connected for presence tracking');
        });
        redisClient.on('error', (err) => {
            console.error('❌ Redis connection error:', err);
        });
        initializePresenceModel(redisClient);
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
        console.log('ℹ️ Queue Service not active (disabled)');
        const mongoose = require('mongoose');
        mongoose.connection.close();
        console.log('Database connection closed');
        setTimeout(() => {
            console.log('Server closed successfully');
            process.exit(0);
        });
        setTimeout(() => {
            console.log('Forcing exit...');
            process.exit(1);
        }, 10000);
    }
    catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection: ${err.message}`);
    console.log('Promise:', promise);
    if (err.message.includes('Cannot set headers after they are sent')) {
        console.warn('Headers already sent error - this is likely a timing issue with async operations');
        return;
    }
    gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
    console.log(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
let server;
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