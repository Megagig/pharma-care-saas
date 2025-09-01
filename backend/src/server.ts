import app from './app';
import connectDB from './config/db';
import { config } from 'dotenv';
import { invitationCronService } from './services/InvitationCronService';
import WorkspaceStatsCronService from './services/WorkspaceStatsCronService';
import UsageAlertCronService from './services/UsageAlertCronService';
import { emailDeliveryCronService } from './services/EmailDeliveryCronService';

// Load environment variables
config();

// Connect to MongoDB
connectDB();

const PORT: number = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);

  // Start cron services
  if (process.env.NODE_ENV !== 'test') {
    invitationCronService.start();
    WorkspaceStatsCronService.start();
    UsageAlertCronService.start();
    emailDeliveryCronService.start();
  }
});

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