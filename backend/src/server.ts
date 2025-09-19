import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { config } from 'dotenv';
import { invitationCronService } from './services/InvitationCronService';
import WorkspaceStatsCronService from './services/WorkspaceStatsCronService';
import UsageAlertCronService from './services/UsageAlertCronService';
import { emailDeliveryCronService } from './services/EmailDeliveryCronService';
import CommunicationSocketService from './services/communicationSocketService';
import SocketNotificationService from './services/socketNotificationService';

// Import models to ensure they are registered with Mongoose
import './models/Medication';
import './models/Conversation';
import './models/Message';

// Load environment variables
config();

// Connect to MongoDB
connectDB();

const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000', // Create React App dev server
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173', // Alternative Vite URL
      'http://192.168.8.167:5173', // Local network Vite URL
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Socket.IO services
const communicationSocketService = new CommunicationSocketService(io);
const socketNotificationService = new SocketNotificationService(io);

// Make socket services available globally for other services
app.set('communicationSocket', communicationSocketService);
app.set('socketNotification', socketNotificationService);

const server = httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  console.log(`📡 Socket.IO server initialized for real-time communication`);

  // Start cron services
  if (process.env.NODE_ENV !== 'test') {
    invitationCronService.start();
    WorkspaceStatsCronService.start();
    UsageAlertCronService.start();
    emailDeliveryCronService.start();
  }
});

// Set server timeout to 90 seconds to handle long AI processing
server.timeout = 90000; // 90 seconds

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default server;
