# SaaS Settings Module - Deployment and Configuration Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Configuration](#application-configuration)
5. [Security Configuration](#security-configuration)
6. [External Service Integration](#external-service-integration)
7. [Deployment Process](#deployment-process)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring and Alerting Setup](#monitoring-and-alerting-setup)
10. [Backup and Recovery Configuration](#backup-and-recovery-configuration)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)

---

## Prerequisites

### System Requirements

#### Minimum Hardware Requirements
- **CPU**: 4 cores (8 recommended for production)
- **RAM**: 8GB (16GB recommended for production)
- **Storage**: 100GB SSD (500GB recommended for production)
- **Network**: 1Gbps connection

#### Software Requirements
- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 14.x or higher
- **Redis**: Version 6.x or higher
- **Nginx**: Version 1.20 or higher (for reverse proxy)

#### Development Tools
- **Docker**: Version 20.10+ (for containerized deployment)
- **Docker Compose**: Version 2.0+
- **Git**: Version 2.30+
- **PM2**: Version 5.0+ (for process management)

### Access Requirements

#### Network Access
- **Inbound**: Ports 80, 443 (HTTP/HTTPS)
- **Outbound**: Ports 80, 443, 587 (SMTP), 5432 (PostgreSQL)
- **Internal**: Ports 3000 (Node.js), 6379 (Redis)

#### External Services
- **Payment Gateway**: Nomba API access
- **Email Service**: SMTP server or SendGrid account
- **SMS Service**: Twilio account (optional)
- **Monitoring**: DataDog or similar service account

---

## Environment Setup

### Production Environment

#### Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14
sudo apt install postgresql-14 postgresql-client-14 -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Docker (optional for containerized deployment)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### User and Directory Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash PharmacyCopilot
sudo usermod -aG sudo PharmacyCopilot

# Create application directories
sudo mkdir -p /opt/PharmacyCopilot/saas-settings
sudo mkdir -p /var/log/PharmacyCopilot
sudo mkdir -p /var/lib/PharmacyCopilot/uploads

# Set ownership
sudo chown -R PharmacyCopilot:PharmacyCopilot /opt/PharmacyCopilot
sudo chown -R PharmacyCopilot:PharmacyCopilot /var/log/PharmacyCopilot
sudo chown -R PharmacyCopilot:PharmacyCopilot /var/lib/PharmacyCopilot
```

### Staging Environment

#### Docker Compose Setup

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://user:password@db:5432/PharmacyCopilot_staging
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/var/log/PharmacyCopilot
      - ./uploads:/var/lib/PharmacyCopilot/uploads

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=PharmacyCopilot_staging
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Development Environment

#### Local Setup

```bash
# Clone repository
git clone https://github.com/PharmacyCopilot/saas-settings.git
cd saas-settings

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start local services with Docker
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run migrate

# Seed development data
npm run seed:dev

# Start development server
npm run dev
```

---

## Database Configuration

### PostgreSQL Setup

#### Installation and Initial Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE PharmacyCopilot_production;
CREATE USER PharmacyCopilot_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE PharmacyCopilot_production TO PharmacyCopilot_user;

-- Create extensions
\c PharmacyCopilot_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Exit psql
\q
```

#### Database Configuration File

```bash
# /etc/postgresql/14/main/postgresql.conf

# Connection settings
listen_addresses = 'localhost'
port = 5432
max_connections = 200

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Database Security

```bash
# /etc/postgresql/14/main/pg_hba.conf

# Local connections
local   all             postgres                                peer
local   all             PharmacyCopilot_user                         md5

# IPv4 local connections
host    all             PharmacyCopilot_user         127.0.0.1/32    md5
host    all             PharmacyCopilot_user         10.0.0.0/8      md5

# Deny all other connections
host    all             all                     0.0.0.0/0       reject
```

### Redis Configuration

#### Redis Setup

```bash
# /etc/redis/redis.conf

# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass secure_redis_password_here

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
tcp-keepalive 300
timeout 0
```

### Database Migrations

#### Migration Scripts

```javascript
// migrations/001_initial_schema.js
exports.up = async function(knex) {
  // Create users table
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('password_hash').notNullable();
    table.string('role').notNullable();
    table.string('status').defaultTo('active');
    table.uuid('workspace_id').references('id').inTable('workspaces');
    table.timestamp('last_login_at');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['workspace_id']);
    table.index(['role']);
    table.index(['status']);
  });

  // Create feature_flags table
  await knex.schema.createTable('feature_flags', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').unique().notNullable();
    table.string('description');
    table.boolean('is_enabled').defaultTo(false);
    table.jsonb('targeting_rules').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index(['name']);
    table.index(['is_enabled']);
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('action').notNullable();
    table.string('resource_type');
    table.string('resource_id');
    table.jsonb('changes').defaultTo('{}');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['action']);
    table.index(['resource_type']);
    table.index(['created_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('feature_flags');
  await knex.schema.dropTableIfExists('users');
};
```

#### Running Migrations

```bash
# Production migration
NODE_ENV=production npm run migrate

# Check migration status
npm run migrate:status

# Rollback if needed
npm run migrate:rollback
```

---

## Application Configuration

### Environment Variables

#### Production Environment File

```bash
# .env.production

# Application
NODE_ENV=production
PORT=3000
APP_NAME="PharmacyCopilot SaaS Settings"
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://PharmacyCopilot_user:secure_password@localhost:5432/PharmacyCopilot_production
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://:secure_redis_password@localhost:6379
REDIS_PREFIX=PharmacyCopilot:saas:

# Security
JWT_SECRET=very_long_random_string_here_minimum_64_characters_recommended
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
SESSION_SECRET=another_very_long_random_string_for_sessions

# CORS
CORS_ORIGIN=https://app.PharmacyCopilot.com,https://admin.PharmacyCopilot.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
UPLOAD_DESTINATION=/var/lib/PharmacyCopilot/uploads

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@PharmacyCopilot.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateway
NOMBA_API_URL=https://api.nomba.com/v1
NOMBA_MERCHANT_ID=your_merchant_id
NOMBA_API_KEY=your_api_key
NOMBA_WEBHOOK_SECRET=your_webhook_secret

# Monitoring
LOG_LEVEL=info
LOG_FORMAT=json
DATADOG_API_KEY=your_datadog_api_key
SENTRY_DSN=your_sentry_dsn

# Feature Flags
FEATURE_FLAGS_CACHE_TTL=300
FEATURE_FLAGS_EVALUATION_TIMEOUT=100

# Analytics
ANALYTICS_BATCH_SIZE=1000
ANALYTICS_FLUSH_INTERVAL=30000
ANALYTICS_RETENTION_DAYS=365
```

### Application Configuration Files

#### Main Configuration

```javascript
// config/index.js
const config = {
  app: {
    name: process.env.APP_NAME || 'PharmacyCopilot SaaS Settings',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX) || 20
    },
    timeout: parseInt(process.env.DATABASE_TIMEOUT) || 30000,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  },

  redis: {
    url: process.env.REDIS_URL,
    prefix: process.env.REDIS_PREFIX || 'PharmacyCopilot:saas:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },

  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    },
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true'
    }
  },

  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760,
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png'],
    destination: process.env.UPLOAD_DESTINATION || './uploads'
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@PharmacyCopilot.com'
  },

  sms: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  },

  payment: {
    nomba: {
      apiUrl: process.env.NOMBA_API_URL,
      merchantId: process.env.NOMBA_MERCHANT_ID,
      apiKey: process.env.NOMBA_API_KEY,
      webhookSecret: process.env.NOMBA_WEBHOOK_SECRET
    }
  },

  monitoring: {
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY
    },
    sentry: {
      dsn: process.env.SENTRY_DSN
    }
  },

  featureFlags: {
    cacheTtl: parseInt(process.env.FEATURE_FLAGS_CACHE_TTL) || 300,
    evaluationTimeout: parseInt(process.env.FEATURE_FLAGS_EVALUATION_TIMEOUT) || 100
  },

  analytics: {
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 1000,
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL) || 30000,
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 365
  }
};

module.exports = config;
```

---

## Security Configuration

### SSL/TLS Configuration

#### Nginx SSL Configuration

```nginx
# /etc/nginx/sites-available/PharmacyCopilot-saas
server {
    listen 80;
    server_name admin.PharmacyCopilot.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.PharmacyCopilot.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/PharmacyCopilot.crt;
    ssl_certificate_key /etc/nginx/ssl/PharmacyCopilot.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.PharmacyCopilot.com;" always;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static Files
    location /static/ {
        alias /opt/PharmacyCopilot/saas-settings/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File Uploads
    location /uploads/ {
        alias /var/lib/PharmacyCopilot/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Firewall Configuration

#### UFW Setup

```bash
# Enable UFW
sudo ufw enable

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH access
sudo ufw allow ssh

# HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Database (only from application server)
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Redis (only from application server)
sudo ufw allow from 10.0.0.0/8 to any port 6379

# Check status
sudo ufw status verbose
```

### Application Security Middleware

#### Security Headers Middleware

```javascript
// middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

// Security middleware
const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.PharmacyCopilot.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting
  createRateLimit(
    config.security.rateLimit.windowMs,
    config.security.rateLimit.max,
    'Too many requests from this IP'
  ),

  // API-specific rate limiting
  createRateLimit(60000, 20, 'Too many API requests'), // 20 per minute for API endpoints

  // Authentication rate limiting
  createRateLimit(900000, 5, 'Too many authentication attempts') // 5 per 15 minutes for auth endpoints
];

module.exports = securityMiddleware;
```

---

## External Service Integration

### Payment Gateway Integration

#### Nomba Configuration

```javascript
// services/nombaService.js
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class NombaService {
  constructor() {
    this.apiUrl = config.payment.nomba.apiUrl;
    this.merchantId = config.payment.nomba.merchantId;
    this.apiKey = config.payment.nomba.apiKey;
    this.webhookSecret = config.payment.nomba.webhookSecret;
  }

  async createPayment(paymentData) {
    try {
      const response = await axios.post(`${this.apiUrl}/payments`, {
        merchant_id: this.merchantId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        reference: paymentData.reference,
        customer: paymentData.customer,
        callback_url: paymentData.callbackUrl,
        metadata: paymentData.metadata
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Nomba payment creation failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new NombaService();
```

### Email Service Integration

#### SendGrid Configuration

```javascript
// services/emailService.js
const sgMail = require('@sendgrid/mail');
const config = require('../config');

class EmailService {
  constructor() {
    sgMail.setApiKey(config.email.smtp.pass);
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const msg = {
        to,
        from: config.email.from,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await sgMail.send(msg);
      return result;
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendBulkEmail(recipients, subject, html, text = null) {
    try {
      const msg = {
        personalizations: recipients.map(recipient => ({
          to: [{ email: recipient.email, name: recipient.name }],
          substitutions: recipient.substitutions || {}
        })),
        from: config.email.from,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await sgMail.sendMultiple(msg);
      return result;
    } catch (error) {
      throw new Error(`Bulk email sending failed: ${error.message}`);
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();
```

### SMS Service Integration

#### Twilio Configuration

```javascript
// services/smsService.js
const twilio = require('twilio');
const config = require('../config');

class SMSService {
  constructor() {
    this.client = twilio(
      config.sms.twilio.accountSid,
      config.sms.twilio.authToken
    );
    this.phoneNumber = config.sms.twilio.phoneNumber;
  }

  async sendSMS(to, message) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      return result;
    } catch (error) {
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  async sendBulkSMS(recipients, message) {
    try {
      const promises = recipients.map(recipient => 
        this.sendSMS(recipient.phoneNumber, message.replace(/\{\{name\}\}/g, recipient.name))
      );

      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      throw new Error(`Bulk SMS sending failed: ${error.message}`);
    }
  }
}

module.exports = new SMSService();
```

---

## Deployment Process

### Production Deployment

#### Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
APP_NAME="PharmacyCopilot-saas-settings"
APP_DIR="/opt/PharmacyCopilot/saas-settings"
BACKUP_DIR="/opt/PharmacyCopilot/backups"
USER="PharmacyCopilot"
NODE_ENV="production"

echo "Starting deployment of $APP_NAME..."

# Create backup
echo "Creating backup..."
sudo -u $USER mkdir -p $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)
sudo -u $USER cp -r $APP_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/

# Stop application
echo "Stopping application..."
sudo -u $USER pm2 stop $APP_NAME || true

# Update code
echo "Updating code..."
cd $APP_DIR
sudo -u $USER git fetch origin
sudo -u $USER git checkout main
sudo -u $USER git pull origin main

# Install dependencies
echo "Installing dependencies..."
sudo -u $USER npm ci --production

# Run database migrations
echo "Running database migrations..."
sudo -u $USER NODE_ENV=$NODE_ENV npm run migrate

# Build application
echo "Building application..."
sudo -u $USER NODE_ENV=$NODE_ENV npm run build

# Update PM2 configuration
echo "Updating PM2 configuration..."
sudo -u $USER pm2 delete $APP_NAME || true
sudo -u $USER pm2 start ecosystem.config.js --env production

# Verify deployment
echo "Verifying deployment..."
sleep 10
if sudo -u $USER pm2 list | grep -q "$APP_NAME.*online"; then
    echo "Deployment successful!"
else
    echo "Deployment failed! Rolling back..."
    # Rollback logic here
    exit 1
fi

# Save PM2 configuration
sudo -u $USER pm2 save
sudo -u $USER pm2 startup

echo "Deployment completed successfully!"
```

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'PharmacyCopilot-saas-settings',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/PharmacyCopilot/err.log',
    out_file: '/var/log/PharmacyCopilot/out.log',
    log_file: '/var/log/PharmacyCopilot/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S PharmacyCopilot -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=PharmacyCopilot:nodejs /app/dist ./dist
COPY --from=builder --chown=PharmacyCopilot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=PharmacyCopilot:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /var/log/PharmacyCopilot /var/lib/PharmacyCopilot/uploads
RUN chown -R PharmacyCopilot:nodejs /var/log/PharmacyCopilot /var/lib/PharmacyCopilot

# Switch to app user
USER PharmacyCopilot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/var/log/PharmacyCopilot
      - ./uploads:/var/lib/PharmacyCopilot/uploads
    networks:
      - PharmacyCopilot-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:14
    restart: unless-stopped
    environment:
      - POSTGRES_DB=PharmacyCopilot_production
      - POSTGRES_USER=PharmacyCopilot_user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - PharmacyCopilot-network
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G

  redis:
    image: redis:6-alpine
    restart: unless-stopped
    command: redis-server --requirepass-file /run/secrets/redis_password
    secrets:
      - redis_password
    volumes:
      - redis_data:/data
    networks:
      - PharmacyCopilot-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - PharmacyCopilot-network

volumes:
  postgres_data:
  redis_data:

networks:
  PharmacyCopilot-network:
    driver: bridge

secrets:
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
```

---

## Post-Deployment Verification

### Health Checks

#### Application Health Check

```javascript
// healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

#### Database Health Check

```bash
#!/bin/bash
# check_database.sh

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="PharmacyCopilot_production"
DB_USER="PharmacyCopilot_user"

# Test database connection
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database connection: OK"
else
    echo "Database connection: FAILED"
    exit 1
fi

# Check critical tables
TABLES=("users" "feature_flags" "audit_logs" "subscriptions")
for table in "${TABLES[@]}"; do
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM $table;" > /dev/null 2>&1; then
        echo "Table $table: OK"
    else
        echo "Table $table: FAILED"
        exit 1
    fi
done

echo "Database health check: PASSED"
```

### Functional Testing

#### API Endpoint Testing

```bash
#!/bin/bash
# test_endpoints.sh

BASE_URL="https://admin.PharmacyCopilot.com"
API_KEY="your_test_api_key"

# Test health endpoint
echo "Testing health endpoint..."
if curl -f -s "$BASE_URL/health" > /dev/null; then
    echo "Health endpoint: OK"
else
    echo "Health endpoint: FAILED"
    exit 1
fi

# Test authentication
echo "Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@PharmacyCopilot.com","password":"testpassword"}')

if echo "$AUTH_RESPONSE" | grep -q "token"; then
    echo "Authentication: OK"
    TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.token')
else
    echo "Authentication: FAILED"
    exit 1
fi

# Test protected endpoint
echo "Testing protected endpoint..."
if curl -f -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/admin/saas/overview/metrics" > /dev/null; then
    echo "Protected endpoint: OK"
else
    echo "Protected endpoint: FAILED"
    exit 1
fi

echo "API endpoint testing: PASSED"
```

### Performance Testing

#### Load Testing Script

```javascript
// loadtest.js
const autocannon = require('autocannon');

const instance = autocannon({
  url: 'https://admin.PharmacyCopilot.com',
  connections: 10,
  pipelining: 1,
  duration: 30,
  headers: {
    'Authorization': 'Bearer your_test_token'
  }
}, (err, result) => {
  if (err) {
    console.error('Load test failed:', err);
    process.exit(1);
  }

  console.log('Load test results:');
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency: ${result.latency.average}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);

  // Check if performance meets requirements
  if (result.requests.average < 100) {
    console.error('Performance below threshold');
    process.exit(1);
  }

  console.log('Performance test: PASSED');
});
```

---

## Monitoring and Alerting Setup

### Application Monitoring

#### DataDog Integration

```javascript
// monitoring/datadog.js
const StatsD = require('hot-shots');
const config = require('../config');

class DataDogMonitoring {
  constructor() {
    this.client = new StatsD({
      host: 'localhost',
      port: 8125,
      prefix: 'PharmacyCopilot.saas.',
      globalTags: {
        env: config.app.env,
        service: 'saas-settings'
      }
    });
  }

  // Custom metrics
  recordUserLogin(userId, success = true) {
    this.client.increment('user.login', 1, {
      success: success.toString(),
      user_id: userId
    });
  }

  recordAPICall(endpoint, method, statusCode, duration) {
    this.client.increment('api.requests', 1, {
      endpoint,
      method,
      status_code: statusCode.toString()
    });

    this.client.timing('api.response_time', duration, {
      endpoint,
      method
    });
  }

  recordFeatureFlagEvaluation(flagName, result) {
    this.client.increment('feature_flags.evaluations', 1, {
      flag_name: flagName,
      result: result.toString()
    });
  }

  recordDatabaseQuery(query, duration, success = true) {
    this.client.timing('database.query_time', duration, {
      query_type: query,
      success: success.toString()
    });
  }
}

module.exports = new DataDogMonitoring();
```

#### Prometheus Metrics

```javascript
// monitoring/prometheus.js
const prometheus = require('prom-client');

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const featureFlagEvaluations = new prometheus.Counter({
  name: 'feature_flag_evaluations_total',
  help: 'Total number of feature flag evaluations',
  labelNames: ['flag_name', 'result']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeUsers);
register.registerMetric(featureFlagEvaluations);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeUsers,
  featureFlagEvaluations
};
```

### Alerting Configuration

#### Alert Rules

```yaml
# alerts.yml
groups:
  - name: PharmacyCopilot-saas-settings
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "PostgreSQL database is not responding"

      - alert: RedisConnectionFailure
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis connection failure"
          description: "Redis cache is not responding"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Disk usage is {{ $value | humanizePercentage }}"
```

---

This completes the first part of the deployment guide. The documentation covers prerequisites, environment setup, database configuration, application configuration, security setup, external service integration, and the deployment process with comprehensive monitoring and alerting setup.

<function_calls>
<invoke name="taskStatus">
<parameter name="taskFilePath">.kiro/specs/saas-settings-module/tasks.md