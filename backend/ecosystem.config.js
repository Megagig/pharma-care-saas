module.exports = {
  apps: [
    {
      name: 'pharmacare-api',
      script: 'dist/server.js',
      cwd: '/opt/pharmacare/backend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pharmacare/api-error.log',
      out_file: '/var/log/pharmacare/api-out.log',
      log_file: '/var/log/pharmacare/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      reload_delay: 1000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'invitation-cron',
      script: 'dist/services/InvitationCronService.js',
      cwd: '/opt/pharmacare/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      env: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pharmacare/invitation-cron-error.log',
      out_file: '/var/log/pharmacare/invitation-cron-out.log',
      log_file: '/var/log/pharmacare/invitation-cron-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
    },
    {
      name: 'workspace-stats-cron',
      script: 'dist/services/WorkspaceStatsCronService.js',
      cwd: '/opt/pharmacare/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      env: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pharmacare/workspace-stats-error.log',
      out_file: '/var/log/pharmacare/workspace-stats-out.log',
      log_file: '/var/log/pharmacare/workspace-stats-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
    },
    {
      name: 'email-delivery-cron',
      script: 'dist/services/EmailDeliveryCronService.js',
      cwd: '/opt/pharmacare/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cron_restart: '0 */2 * * *', // Restart every 2 hours
      env: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pharmacare/email-delivery-error.log',
      out_file: '/var/log/pharmacare/email-delivery-out.log',
      log_file: '/var/log/pharmacare/email-delivery-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
    },
    {
      name: 'usage-alert-cron',
      script: 'dist/services/UsageAlertCronService.js',
      cwd: '/opt/pharmacare/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cron_restart: '0 8 * * *', // Restart daily at 8 AM
      env: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pharmacare/usage-alert-error.log',
      out_file: '/var/log/pharmacare/usage-alert-out.log',
      log_file: '/var/log/pharmacare/usage-alert-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/pharmacare-saas.git',
      path: '/opt/pharmacare',
      'pre-deploy-local': '',
      'post-deploy':
        'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup':
        'mkdir -p /var/log/pharmacare && mkdir -p /var/backups/pharmacare',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/pharmacare-saas.git',
      path: '/opt/pharmacare-staging',
      'post-deploy':
        'npm ci && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup':
        'mkdir -p /var/log/pharmacare && mkdir -p /var/backups/pharmacare',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
