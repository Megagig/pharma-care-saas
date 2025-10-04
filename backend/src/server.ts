import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { config } from 'dotenv';
import { performanceCollector } from './utils/performanceMonitoring';
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

  // Start memory optimization
  if (process.env.NODE_ENV === 'production') {
    // Force garbage collection every 5 minutes in production
    setInterval(() => {
      if (global.gc) {
        global.gc();
        console.log('Garbage collection triggered');
      }
    }, 5 * 60 * 1000);
  }
});

// Set server timeout to 5 minutes to handle long AI processing
server.timeout = 300000; // 5 minutes

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Import cleanup functions
    const { cleanupAuditLogging } = await import('./middlewares/auditLogging');
    const { cleanupSessionManagement } = await import('./middlewares/communicationSessionManagement');
    
    // Stop all intervals and cleanup
    cleanupAuditLogging();
    cleanupSessionManagement();
    
    // Close server
    server.close(() => {
      console.log('Server closed successfully');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error, promise) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  console.log('Promise:', promise);
  
  // Don't shutdown for headers errors - just log them
  if (err.message.includes('Cannot set headers after they are sent')) {
    console.warn('Headers already sent error - this is likely a timing issue with async operations');
    return;
  }
  
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
