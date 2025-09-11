# Clinical Notes Module Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Clinical Notes module in production environments. It covers database migrations, environment configuration, security setup, and monitoring.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **MongoDB**: Version 5.0 or higher
- **Redis**: Version 6.0 or higher (for caching)
- **Storage**: Minimum 10GB for file attachments
- **Memory**: Minimum 4GB RAM
- **CPU**: Minimum 2 cores

### Dependencies

- Express.js application with existing authentication
- MongoDB with existing patient and user collections
- File storage system (local, AWS S3, Azure Blob, or GCP)
- Optional: ClamAV for virus scanning

## Pre-Deployment Checklist

### 1. Database Preparation

```bash
# Backup existing database
mongodump --uri="mongodb://your-connection-string" --out=./backup-$(date +%Y%m%d)

# Verify database connectivity
mongo --eval "db.adminCommand('ping')"

# Check available disk space
df -h
```

### 2. Environment Configuration

```bash
# Copy environment template
cp backend/.env.clinical-notes.example backend/.env.clinical-notes

# Edit configuration file
nano backend/.env.clinical-notes
```

### 3. Security Setup

```bash
# Generate encryption key
openssl rand -hex 32

# Set up file permissions
chmod 600 backend/.env.clinical-notes
chmod 755 backend/uploads/clinical-notes
```

## Deployment Steps

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

Update the following critical environment variables:

```bash
# Required settings
CLINICAL_NOTES_ENABLED=true
CLINICAL_NOTES_ENCRYPTION_KEY=your-32-character-key-here
CLINICAL_NOTES_STORAGE_TYPE=s3  # or local, azure, gcp

# Security settings
CLINICAL_NOTES_VIRUS_SCAN_ENABLED=true
CLINICAL_NOTES_RBAC_ENABLED=true
CLINICAL_NOTES_AUDIT_LOGGING_ENABLED=true

# Performance settings
CLINICAL_NOTES_CACHE_ENABLED=true
CLINICAL_NOTES_RATE_LIMIT_ENABLED=true
```

### Step 3: Database Migration

```bash
# Run migration script
cd backend
npm run migrate:clinical-notes

# Verify migration status
npm run migrate:clinical-notes -- --status
```

### Step 4: File Storage Setup

#### Local Storage

```bash
# Create upload directories
mkdir -p backend/uploads/clinical-notes
mkdir -p backend/temp/clinical-notes

# Set permissions
chmod 755 backend/uploads/clinical-notes
chmod 755 backend/temp/clinical-notes
```

#### AWS S3 Storage

```bash
# Install AWS CLI
aws configure

# Create S3 bucket
aws s3 mb s3://your-clinical-notes-bucket

# Set bucket policy
aws s3api put-bucket-policy --bucket your-clinical-notes-bucket --policy file://s3-policy.json
```

Example S3 policy (`s3-policy.json`):

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Sid": "ClinicalNotesAccess",
         "Effect": "Allow",
         "Principal": {
            "AWS": "arn:aws:iam::YOUR-ACCOUNT:user/clinical-notes-user"
         },
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::your-clinical-notes-bucket/*"
      }
   ]
}
```

### Step 5: Security Configuration

#### Virus Scanning Setup (ClamAV)

```bash
# Install ClamAV
sudo apt-get install clamav clamav-daemon

# Update virus definitions
sudo freshclam

# Start ClamAV daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon
```

#### SSL/TLS Configuration

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d your-domain.com

# Or use existing certificates
cp your-cert.pem /etc/ssl/certs/
cp your-key.pem /etc/ssl/private/
```

### Step 6: Application Deployment

#### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cp ecosystem.config.js.example ecosystem.config.js

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

Example `ecosystem.config.js`:

```javascript
module.exports = {
   apps: [
      {
         name: 'clinical-notes-api',
         script: './backend/dist/server.js',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
            NODE_ENV: 'production',
            PORT: 3000,
         },
         error_file: './logs/clinical-notes-error.log',
         out_file: './logs/clinical-notes-out.log',
         log_file: './logs/clinical-notes-combined.log',
         time: true,
      },
   ],
};
```

#### Using Docker

```bash
# Build Docker image
docker build -t clinical-notes-app .

# Run container
docker run -d \
  --name clinical-notes \
  -p 3000:3000 \
  -v ./uploads:/app/uploads \
  -v ./logs:/app/logs \
  --env-file .env.clinical-notes \
  clinical-notes-app
```

Example `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci && npm run build

# Copy application code
COPY backend ./backend
COPY frontend/dist ./frontend/dist

# Create upload directories
RUN mkdir -p uploads/clinical-notes temp/clinical-notes logs

# Set permissions
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
```

### Step 7: Frontend Deployment

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    # Frontend static files
    location / {
        root /var/www/clinical-notes/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # File upload size limit
        client_max_body_size 10M;
    }

    # File downloads
    location /uploads/ {
        alias /var/www/clinical-notes/uploads/;

        # Security: Only allow authenticated access
        auth_request /auth;

        # File type restrictions
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # Authentication endpoint for file access
    location = /auth {
        internal;
        proxy_pass http://localhost:3000/api/auth/verify;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
    }
}
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health check
curl -f http://localhost:3000/api/health

# Database connectivity
curl -f http://localhost:3000/api/health/db

# File storage check
curl -f http://localhost:3000/api/health/storage
```

### 2. Functional Testing

```bash
# Run integration tests
cd backend
npm run test:integration

# Run E2E tests
cd ../frontend
npm run test:e2e
```

### 3. Performance Testing

```bash
# Load testing with Artillery
npm install -g artillery
artillery run load-test-config.yml
```

Example `load-test-config.yml`:

```yaml
config:
   target: 'https://your-domain.com'
   phases:
      - duration: 60
        arrivalRate: 10
   defaults:
      headers:
         Authorization: 'Bearer YOUR_TEST_TOKEN'

scenarios:
   - name: 'Clinical Notes API'
     requests:
        - get:
             url: '/api/notes'
        - post:
             url: '/api/notes'
             json:
                patient: 'test-patient-id'
                type: 'consultation'
                title: 'Load Test Note'
                content:
                   subjective: 'Test content'
```

## Monitoring and Maintenance

### 1. Application Monitoring

#### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs clinical-notes-api

# Restart application
pm2 restart clinical-notes-api
```

#### Health Check Endpoint

```javascript
// Add to your Express app
app.get('/api/health/clinical-notes', async (req, res) => {
   try {
      // Check database connectivity
      await mongoose.connection.db.admin().ping();

      // Check file storage
      const storageHealthy = await checkStorageHealth();

      // Check cache
      const cacheHealthy = await checkCacheHealth();

      res.json({
         status: 'healthy',
         timestamp: new Date().toISOString(),
         services: {
            database: 'healthy',
            storage: storageHealthy ? 'healthy' : 'unhealthy',
            cache: cacheHealthy ? 'healthy' : 'unhealthy',
         },
      });
   } catch (error) {
      res.status(503).json({
         status: 'unhealthy',
         error: error.message,
      });
   }
});
```

### 2. Log Management

#### Log Rotation

```bash
# Install logrotate
sudo apt-get install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/clinical-notes
```

Example logrotate configuration:

```
/var/log/clinical-notes/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Centralized Logging

```bash
# Install and configure Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-amd64.deb
sudo dpkg -i filebeat-8.0.0-amd64.deb

# Configure Filebeat
sudo nano /etc/filebeat/filebeat.yml
```

### 3. Database Maintenance

#### Regular Backups

```bash
# Create backup script
cat > backup-clinical-notes.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/clinical-notes"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --collection=clinicalnotes --out="$BACKUP_DIR/db_$DATE"

# Backup file uploads
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" uploads/clinical-notes/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "db_*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

chmod +x backup-clinical-notes.sh

# Schedule with cron
echo "0 2 * * * /path/to/backup-clinical-notes.sh" | crontab -
```

#### Index Optimization

```bash
# Run monthly index optimization
cat > optimize-indexes.js << 'EOF'
db.clinicalnotes.reIndex();
db.clinicalnotes.getIndexes().forEach(function(index) {
    if (index.name !== '_id_') {
        print('Index: ' + index.name + ' - Size: ' + db.clinicalnotes.totalIndexSize());
    }
});
EOF

# Schedule optimization
echo "0 3 1 * * mongo your-database optimize-indexes.js" | crontab -
```

## Security Hardening

### 1. Network Security

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct API access
sudo ufw enable
```

### 2. Application Security

#### Rate Limiting

```javascript
// Enhanced rate limiting configuration
const rateLimit = require('express-rate-limit');

const clinicalNotesLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // limit each IP to 100 requests per windowMs
   message: 'Too many requests from this IP',
   standardHeaders: true,
   legacyHeaders: false,
});

app.use('/api/notes', clinicalNotesLimiter);
```

#### Input Validation

```javascript
// Comprehensive input validation
const { body, validationResult } = require('express-validator');

const validateClinicalNote = [
   body('title').isLength({ min: 1, max: 200 }).trim().escape(),
   body('content.subjective').optional().isLength({ max: 5000 }).trim(),
   body('content.objective').optional().isLength({ max: 5000 }).trim(),
   body('content.assessment').optional().isLength({ max: 5000 }).trim(),
   body('content.plan').optional().isLength({ max: 5000 }).trim(),
   body('type').isIn([
      'consultation',
      'medication_review',
      'follow_up',
      'adverse_event',
      'other',
   ]),
   body('priority').isIn(['low', 'medium', 'high']),
   body('isConfidential').isBoolean(),
   (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }
      next();
   },
];
```

### 3. Data Encryption

```javascript
// File encryption for sensitive attachments
const crypto = require('crypto');

const encryptFile = (buffer, key) => {
   const algorithm = 'aes-256-gcm';
   const iv = crypto.randomBytes(16);
   const cipher = crypto.createCipher(algorithm, key, iv);

   let encrypted = cipher.update(buffer);
   encrypted = Buffer.concat([encrypted, cipher.final()]);

   const authTag = cipher.getAuthTag();

   return {
      encrypted,
      iv,
      authTag,
   };
};
```

## Troubleshooting

### Common Issues

#### 1. Migration Failures

```bash
# Check migration status
npm run migrate:clinical-notes -- --status

# Rollback if needed
npm run migrate:clinical-notes -- --rollback

# Re-run with force flag
npm run migrate:clinical-notes -- --force
```

#### 2. File Upload Issues

```bash
# Check disk space
df -h

# Check permissions
ls -la uploads/clinical-notes/

# Check virus scanner
sudo systemctl status clamav-daemon

# Test file upload
curl -X POST -F "files=@test.pdf" http://localhost:3000/api/notes/test-id/attachments
```

#### 3. Performance Issues

```bash
# Check MongoDB performance
mongo --eval "db.clinicalnotes.getIndexes()"
mongo --eval "db.clinicalnotes.stats()"

# Check application metrics
pm2 monit

# Analyze slow queries
tail -f logs/clinical-notes.log | grep "slow query"
```

### Emergency Procedures

#### 1. Service Recovery

```bash
# Quick restart
pm2 restart clinical-notes-api

# Full service restart
sudo systemctl restart nginx
sudo systemctl restart mongodb
pm2 restart all
```

#### 2. Data Recovery

```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --drop backup/db_YYYYMMDD/

# Restore files
tar -xzf backup/files_YYYYMMDD.tar.gz -C /
```

## Support and Maintenance

### Regular Maintenance Tasks

#### Weekly

- Review application logs
- Check disk space usage
- Monitor performance metrics
- Verify backup integrity

#### Monthly

- Update dependencies
- Optimize database indexes
- Review security logs
- Performance testing

#### Quarterly

- Security audit
- Dependency vulnerability scan
- Disaster recovery testing
- Documentation updates

### Support Contacts

- **Technical Support**: support@byterover.com
- **Security Issues**: security@byterover.com
- **Emergency**: +1-800-BYTEROVER
- **Documentation**: docs.byterover.com

---

_This deployment guide is maintained by the Byterover development team._
_Last updated: [Current Date]_
