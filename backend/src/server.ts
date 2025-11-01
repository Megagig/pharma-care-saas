// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { performanceCollector } from './utils/performanceMonitoring';
import { invitationCronService } from './services/InvitationCronService';
import WorkspaceStatsCronService from './services/WorkspaceStatsCronService';
import UsageAlertCronService from './services/UsageAlertCronService';
import { emailDeliveryCronService } from './services/EmailDeliveryCronService';
import CommunicationSocketService from './services/communicationSocketService';
import SocketNotificationService from './services/socketNotificationService';
import AppointmentSocketService from './services/AppointmentSocketService';
// QueueService removed - background jobs disabled

// Import models to ensure they are registered with Mongoose
import './models/Medication';
import './models/Conversation';
import './models/Message';

// Environment variables already loaded at the top

const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Async function to initialize server
async function initializeServer() {
  try {
    // Connect to MongoDB first
    await connectDB();
    console.log('✅ Database connected successfully');

    // Seed sample workspaces if none exist
    try {
      const seedWorkspaces = (await import('./scripts/seedWorkspaces')).default;
      await seedWorkspaces();
    } catch (error) {
      console.error('⚠️ Error seeding workspaces:', error);
    }

    // Start performance monitoring after DB is connected
    performanceCollector.startSystemMetricsCollection();

    // Initialize Upstash Redis (REST API)
    try {
      const { initializeUpstashRedis, testUpstashRedisConnection } = await import('./config/upstashRedis');
      initializeUpstashRedis();
      const isConnected = await testUpstashRedisConnection();
      if (isConnected) {
        console.log('✅ Upstash Redis (REST API) connected successfully');
      } else {
        console.log('ℹ️ Upstash Redis not available, using fallback cache');
      }
    } catch (error) {
      console.log('ℹ️ Upstash Redis initialization skipped:', error);
    }

    // Queue Service and Job Workers DISABLED
    // Background jobs (reminders, follow-ups) are disabled to avoid Redis dependency
    // The application functions normally without them
    console.log('ℹ️ Queue Service and Job Workers disabled (not required for core functionality)');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Create HTTP server
  const httpServer = createServer(app);

  // Configure Socket.IO CORS origins
  const socketCorsOrigins = [
    'http://localhost:3000', // Create React App dev server
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:5173', // Alternative Vite URL
    'http://192.168.8.167:5173', // Local network Vite URL
    'https://PharmaPilot-nttq.onrender.com', // Production frontend
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ];

  // Add additional origins from environment variable
  if (process.env.CORS_ORIGINS) {
    socketCorsOrigins.push(...process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()));
  }

  // Setup Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: socketCorsOrigins,
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
  const appointmentSocketService = new AppointmentSocketService(io);

  // Initialize new Chat Socket Service
  const { initializeChatSocketService } = await import('./services/chat/ChatSocketService');
  const { initializePresenceModel } = await import('./models/chat/Presence');
  const Redis = (await import('ioredis')).default;

  // Initialize Redis for presence tracking (only if REDIS_URL is explicitly set)
  let redisClient: any = null;
  
  if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
    redisClient = new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL.includes('upstash.io') 
        ? { rejectUnauthorized: false } 
        : undefined,
      family: process.env.REDIS_URL.includes('upstash.io') ? 6 : 4,
      connectTimeout: 30000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  } else {
    console.log('ℹ️ Redis presence tracking disabled (no REDIS_URL configured)');
  }

  if (redisClient) {
    redisClient.on('connect', () => {
      console.log('✅ Redis connected for presence tracking');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    // Initialize presence model
    initializePresenceModel(redisClient);
  }

  // Initialize chat socket service
  const chatSocketService = initializeChatSocketService(io);

  // Make socket services available globally for other services
  app.set('communicationSocket', communicationSocketService);
  app.set('socketNotification', socketNotificationService);
  app.set('appointmentSocket', appointmentSocketService);
  app.set('chatSocket', chatSocketService);

  const server = httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
    );
    console.log(`📡 Socket.IO server initialized for real-time communication`);

    // Start cron services with delays to reduce memory spike
    if (process.env.NODE_ENV !== 'test') {
      invitationCronService.start();

      // Stagger the other services to reduce memory pressure
      setTimeout(() => WorkspaceStatsCronService.start(), 1000);
      setTimeout(() => UsageAlertCronService.start(), 2000);
      setTimeout(() => emailDeliveryCronService.start(), 3000);
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

    // Trigger initial garbage collection after startup
    setTimeout(() => {
      if (global.gc) {
        global.gc();
        console.log('Initial garbage collection after startup');
      }
    }, 10000); // 10 seconds after startup
  });

  return server;
}

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
      });
    }

    // Queue Service removed - no cleanup needed
    console.log('ℹ️ Queue Service not active (disabled)');

    // Close database connection
    const mongoose = require('mongoose');
    mongoose.connection.close();
    console.log('Database connection closed');

    // Exit after cleanup
    setTimeout(() => {
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

// Initialize server
let server: any;
initializeServer()
  .then((serverInstance) => {
    server = serverInstance;
  })
  .catch((error) => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  });

export default server;