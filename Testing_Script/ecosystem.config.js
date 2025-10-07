// PM2 Ecosystem Configuration for PharmacyCopilot SaaS Settings Module
module.exports = {
  apps: [
    {
      name: 'PharmacyCopilot-saas-settings',
      script: './backend/dist/server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      
      // Environment configurations
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'warn'
      },
      
      // Logging configuration
      error_file: '/var/log/PharmacyCopilot/saas-settings-error.log',
      out_file: '/var/log/PharmacyCopilot/saas-settings-out.log',
      log_file: '/var/log/PharmacyCopilot/saas-settings-combined.log',
      time: true,
      
      // Performance and reliability settings
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Auto-restart on file changes (development only)
      watch: process.env.NODE_ENV === 'development',
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced settings
      merge_logs: true,
      combine_logs: true,
      force: true,
      
      // Environment variables
      env_file: '.env',
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Source map support
      source_map_support: true,
      
      // Instance variables for cluster mode
      instance_var: 'INSTANCE_ID',
      
      // Cron restart (daily at 2 AM in production)
      cron_restart: process.env.NODE_ENV === 'production' ? '0 2 * * *' : null,
      
      // Autorestart configuration
      autorestart: true,
      
      // Maximum number of unstable restarts
      max_restarts: 15,
      
      // Minimum uptime before considering stable
      min_uptime: '1m'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'PharmacyCopilot',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:PharmacyCopilot/saas-settings.git',
      path: '/opt/PharmacyCopilot/saas-settings',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    
    staging: {
      user: 'PharmacyCopilot',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:PharmacyCopilot/saas-settings.git',
      path: '/opt/PharmacyCopilot/saas-settings-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};