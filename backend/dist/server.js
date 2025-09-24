"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = require("dotenv");
const InvitationCronService_1 = require("./services/InvitationCronService");
const WorkspaceStatsCronService_1 = __importDefault(require("./services/WorkspaceStatsCronService"));
const UsageAlertCronService_1 = __importDefault(require("./services/UsageAlertCronService"));
const EmailDeliveryCronService_1 = require("./services/EmailDeliveryCronService");
const communicationSocketService_1 = __importDefault(require("./services/communicationSocketService"));
const socketNotificationService_1 = __importDefault(require("./services/socketNotificationService"));
require("./models/Medication");
require("./models/Conversation");
require("./models/Message");
(0, dotenv_1.config)();
(0, db_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://192.168.8.167:5173',
            process.env.FRONTEND_URL || 'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
});
const communicationSocketService = new communicationSocketService_1.default(io);
const socketNotificationService = new socketNotificationService_1.default(io);
app_1.default.set('communicationSocket', communicationSocketService);
app_1.default.set('socketNotification', socketNotificationService);
const server = httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Socket.IO server initialized for real-time communication`);
    if (process.env.NODE_ENV !== 'test') {
        InvitationCronService_1.invitationCronService.start();
        WorkspaceStatsCronService_1.default.start();
        UsageAlertCronService_1.default.start();
        EmailDeliveryCronService_1.emailDeliveryCronService.start();
    }
    if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
            if (global.gc) {
                global.gc();
                console.log('Garbage collection triggered');
            }
        }, 5 * 60 * 1000);
    }
});
server.timeout = 90000;
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