/**
 * PM2 Ecosystem Configuration for Clinical Interventions Module
 * Handles process management for different environments
 */

module.exports = {
   apps: [
      {
         name: 'pharmatech-api',
         script: './dist/server.js',
         cwd: '/var/www/pharmatech-api',

         // Instance configuration
         instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
         exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

         // Environment variables
         env: {
            NODE_ENV: 'development',
            PORT: 5000,
            INSTANCE_ID: 0,
         },

         env_staging: {
            NODE_ENV: 'staging',
            PORT: 5000,
            INSTANCE_ID: 0,
         },

         env_production: {
            NODE_ENV: 'production',
            PORT: 5000,
            INSTANCE_ID: 0,
         },

         // Performance and reliability
         max_memory_restart: '1G',
         min_uptime: '10s',
         max_restarts: 10,
         restart_delay: 4000,

         // Logging
         log_file: '/var/log/pharmatech/combined.log',
         out_file: '/var/log/pharmatech/out.log',
         error_file: '/var/log/pharmatech/error.log',
         log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
         merge_logs: true,

         // Monitoring
         pmx: true,
         monitoring: true,

         // Advanced options
         kill_timeout: 5000,
         listen_timeout: 3000,
         shutdown_with_message: true,

         // Health check
         health_check_grace_period: 3000,

         // Source map support
         source_map_support: true,

         // Graceful shutdown
         kill_retry_time: 100,

         // Watch options (disabled in production)
         watch: process.env.NODE_ENV === 'development',
         watch_delay: 1000,
         ignore_watch: ['node_modules', 'logs', '*.log', 'dist', '.git'],

         // Cron restart (daily at 3 AM in production)
         cron_restart:
            process.env.NODE_ENV === 'production' ? '0 3 * * *' : undefined,

         // Auto restart on file changes (development only)
         autorestart: true,

         // Node.js options
         node_args: ['--max-old-space-size=2048', '--optimize-for-size'],

         // Additional environment-specific configurations
         ...(process.env.NODE_ENV === 'production' && {
            // Production-specific settings
            instances: 'max',
            exec_mode: 'cluster',
            max_memory_restart: '2G',
            node_args: [
               '--max-old-space-size=4096',
               '--optimize-for-size',
               '--gc-interval=100',
            ],
         }),

         ...(process.env.NODE_ENV === 'development' && {
            // Development-specific settings
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '500M',
            watch: true,
            ignore_watch: [
               'node_modules',
               'logs',
               '*.log',
               'dist',
               '.git',
               'coverage',
               'test',
            ],
         }),
      },

      // Clinical Interventions Background Worker (if needed)
      {
         name: 'clinical-interventions-worker',
         script: './dist/workers/clinicalInterventionsWorker.js',
         cwd: '/var/www/pharmatech-api',

         // Worker configuration
         instances: 1,
         exec_mode: 'fork',

         // Environment
         env: {
            NODE_ENV: 'development',
            WORKER_TYPE: 'clinical_interventions',
         },

         env_staging: {
            NODE_ENV: 'staging',
            WORKER_TYPE: 'clinical_interventions',
         },

         env_production: {
            NODE_ENV: 'production',
            WORKER_TYPE: 'clinical_interventions',
         },

         // Performance
         max_memory_restart: '512M',
         min_uptime: '10s',
         max_restarts: 5,
         restart_delay: 5000,

         // Logging
         log_file: '/var/log/pharmatech/worker-combined.log',
         out_file: '/var/log/pharmatech/worker-out.log',
         error_file: '/var/log/pharmatech/worker-error.log',
         log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

         // Monitoring
         pmx: true,
         monitoring: true,

         // Cron restart (daily at 2 AM)
         cron_restart:
            process.env.NODE_ENV === 'production' ? '0 2 * * *' : undefined,

         // Only run in production and staging
         ...(process.env.NODE_ENV === 'development' && {
            instances: 0, // Disable in development
         }),
      },

      // Performance Monitoring Service
      {
         name: 'performance-monitor',
         script: './dist/services/performanceMonitorService.js',
         cwd: '/var/www/pharmatech-api',

         // Monitor configuration
         instances: 1,
         exec_mode: 'fork',

         // Environment
         env: {
            NODE_ENV: 'development',
            SERVICE_TYPE: 'performance_monitor',
         },

         env_staging: {
            NODE_ENV: 'staging',
            SERVICE_TYPE: 'performance_monitor',
         },

         env_production: {
            NODE_ENV: 'production',
            SERVICE_TYPE: 'performance_monitor',
         },

         // Performance
         max_memory_restart: '256M',
         min_uptime: '30s',
         max_restarts: 3,
         restart_delay: 10000,

         // Logging
         log_file: '/var/log/pharmatech/monitor-combined.log',
         out_file: '/var/log/pharmatech/monitor-out.log',
         error_file: '/var/log/pharmatech/monitor-error.log',

         // Monitoring
         pmx: true,
         monitoring: true,

         // Only run if performance monitoring is enabled
         ...(process.env.ENABLE_PERFORMANCE_MONITORING !== 'true' && {
            instances: 0,
         }),
      },
   ],

   // Deployment configuration
   deploy: {
      production: {
         user: 'deploy',
         host: ['production-server-1', 'production-server-2'],
         ref: 'origin/main',
         repo: 'git@github.com:your-org/pharmatech-api.git',
         path: '/var/www/pharmatech-api',

         // Pre-deployment
         'pre-deploy-local': 'echo "Starting deployment to production"',

         // Post-receive
         'post-deploy': [
            'npm ci --production',
            'npm run build',
            'npm run migration:up',
            'npm run feature-flags:init',
            'pm2 reload ecosystem.config.js --env production',
            'pm2 save',
         ].join(' && '),

         // Pre-setup
         'pre-setup': 'echo "Setting up production environment"',

         // Post-setup
         'post-setup': [
            'ls -la',
            'npm install',
            'npm run build',
            'pm2 save',
         ].join(' && '),

         // Environment variables
         env: {
            NODE_ENV: 'production',
         },
      },

      staging: {
         user: 'deploy',
         host: 'staging-server',
         ref: 'origin/develop',
         repo: 'git@github.com:your-org/pharmatech-api.git',
         path: '/var/www/pharmatech-api-staging',

         // Post-deployment
         'post-deploy': [
            'npm ci',
            'npm run build',
            'npm run migration:up',
            'npm run test:smoke',
            'pm2 reload ecosystem.config.js --env staging',
            'pm2 save',
         ].join(' && '),

         // Environment
         env: {
            NODE_ENV: 'staging',
         },
      },
   },
};
