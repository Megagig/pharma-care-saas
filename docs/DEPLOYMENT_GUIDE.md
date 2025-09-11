# Clinical Interventions Module - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Clinical Interventions module to production environments. The deployment process includes database migrations, feature flag configuration, performance optimization, and monitoring setup.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **MongoDB**: Version 5.0 or higher
- **Redis**: Version 6.0 or higher (optional, for caching)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available space

### Environment Setup

1. **Production Server Configuration**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2

   # Install MongoDB (if not using cloud service)
   wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Environment Variables**

   ```bash
   # Create production environment file
   sudo nano /etc/environment

   # Add the following variables:
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://username:password@host:port/database
   JWT_SECRET=your-super-secure-jwt-secret
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   FRONTEND_URL=https://your-domain.com
   ```

## Pre-Deployment Checklist

### 1. Code Preparation

- [ ] All tests passing (`npm test`)
- [ ] Code linting passed (`npm run lint`)
- [ ] Security audit completed (`npm audit`)
- [ ] Dependencies updated to latest stable versions
- [ ] Build process successful (`npm run build`)

### 2. Database Preparation

- [ ] Database backup created
- [ ] Migration scripts tested in staging
- [ ] Index optimization completed
- [ ] Connection pooling configured

### 3. Configuration Validation

- [ ] Environment variables set correctly
- [ ] Feature flags configured
- [ ] Security settings reviewed
- [ ] Performance settings optimized

### 4. Monitoring Setup

- [ ] Health check endpoints configured
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Log aggregation setup

## Deployment Process

### Step 1: Backup Current System

```bash
# Create database backup
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/$(date +%Y%m%d_%H%M%S)

# Backup application files
tar -czf /backup/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/application

# Backup configuration files
cp -r /etc/nginx/sites-available /backup/nginx_$(date +%Y%m%d_%H%M%S)
```

### Step 2: Deploy Application Code

```bash
# Navigate to application directory
cd /var/www/pharmatech-api

# Stop current application
pm2 stop pharmatech-api

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Run database migrations
npm run migrate

# Validate deployment
npm run validate-deployment
```

### Step 3: Database Migrations

```bash
# Check migration status
npm run migration:status

# Apply pending migrations
npm run migration:up

# Validate migration integrity
npm run migration:validate

# Create post-migration backup
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/post_migration_$(date +%Y%m%d_%H%M%S)
```

### Step 4: Feature Flag Configuration

```bash
# Initialize default feature flags
npm run feature-flags:init

# Configure gradual rollout
npm run feature-flags:set clinical_interventions_enabled --rollout 10
npm run feature-flags:set advanced_reporting_enabled --rollout 25
npm run feature-flags:set bulk_operations_enabled --rollout 0

# Verify feature flag configuration
npm run feature-flags:status
```

### Step 5: Performance Optimization

```bash
# Initialize performance monitoring
npm run performance:init

# Create database indexes
npm run db:optimize-indexes

# Configure caching
npm run cache:init

# Validate performance settings
npm run performance:validate
```

### Step 6: Start Application

```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Verify application is running
pm2 status
pm2 logs pharmatech-api --lines 50
```

### Step 7: Health Checks

```bash
# Check application health
curl -f http://localhost:5000/api/health || exit 1

# Check database connectivity
curl -f http://localhost:5000/api/health/database || exit 1

# Check Redis connectivity (if enabled)
curl -f http://localhost:5000/api/health/redis || exit 1

# Verify Clinical Interventions endpoints
curl -f http://localhost:5000/api/clinical-interventions/health || exit 1
```

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Run smoke tests
npm run test:smoke

# Test critical user journeys
npm run test:e2e:critical

# Verify API endpoints
npm run test:api:health
```

### 2. Performance Validation

```bash
# Check response times
npm run performance:check

# Validate database performance
npm run db:performance:check

# Monitor memory usage
npm run monitoring:memory

# Check error rates
npm run monitoring:errors
```

### 3. Feature Flag Validation

```bash
# Test feature flag evaluation
npm run feature-flags:test

# Verify rollout percentages
npm run feature-flags:verify-rollout

# Test conditional flags
npm run feature-flags:test-conditions
```

## Gradual Rollout Strategy

### Phase 1: Limited Rollout (0-10%)

1. **Enable for test workplaces only**

   ```bash
   npm run feature-flags:set clinical_interventions_enabled --workplaces "test-workplace-1,test-workplace-2"
   ```

2. **Monitor key metrics**
   - Response times
   - Error rates
   - Database performance
   - User feedback

3. **Success criteria**
   - < 500ms average response time
   - < 1% error rate
   - No critical issues reported

### Phase 2: Expanded Rollout (10-50%)

1. **Increase rollout percentage**

   ```bash
   npm run feature-flags:set clinical_interventions_enabled --rollout 25
   ```

2. **Enable additional features**

   ```bash
   npm run feature-flags:set advanced_reporting_enabled --rollout 10
   npm run feature-flags:set mtr_integration_enabled --rollout 15
   ```

3. **Monitor performance impact**
   - Database query performance
   - Memory usage
   - Cache hit rates

### Phase 3: Full Rollout (50-100%)

1. **Complete rollout**

   ```bash
   npm run feature-flags:set clinical_interventions_enabled --rollout 100
   npm run feature-flags:set advanced_reporting_enabled --rollout 100
   ```

2. **Enable all features**
   ```bash
   npm run feature-flags:set bulk_operations_enabled --rollout 100
   npm run feature-flags:set export_features_enabled --rollout 100
   ```

## Monitoring and Alerting

### 1. Application Monitoring

```bash
# Setup performance monitoring
pm2 install pm2-server-monit

# Configure custom metrics
npm run monitoring:setup-custom-metrics

# Setup alerting rules
npm run monitoring:setup-alerts
```

### 2. Database Monitoring

```bash
# Monitor database performance
npm run db:monitor:setup

# Setup slow query alerts
npm run db:alerts:slow-queries

# Monitor index usage
npm run db:monitor:indexes
```

### 3. Error Tracking

```bash
# Setup error tracking
npm run error-tracking:setup

# Configure error alerts
npm run error-tracking:alerts

# Setup error reporting
npm run error-tracking:reporting
```

## Rollback Procedures

### Emergency Rollback

```bash
# Stop current application
pm2 stop pharmatech-api

# Revert to previous version
git checkout previous-stable-tag

# Restore dependencies
npm ci --production

# Rollback database migrations (if necessary)
npm run migration:down <version>

# Restart application
pm2 start pharmatech-api

# Verify rollback
curl -f http://localhost:5000/api/health
```

### Feature Flag Rollback

```bash
# Disable problematic features
npm run feature-flags:set clinical_interventions_enabled --enabled false

# Reduce rollout percentage
npm run feature-flags:set advanced_reporting_enabled --rollout 0

# Verify feature is disabled
npm run feature-flags:verify clinical_interventions_enabled
```

### Database Rollback

```bash
# Stop application
pm2 stop pharmatech-api

# Restore database from backup
mongorestore --uri="mongodb://username:password@host:port/database" --drop /backup/backup_directory

# Rollback migrations
npm run migration:down <target-version>

# Restart application
pm2 start pharmatech-api
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**

   ```bash
   # Check memory usage
   pm2 monit

   # Restart application if needed
   pm2 restart pharmatech-api

   # Check for memory leaks
   npm run performance:memory-profile
   ```

2. **Slow Database Queries**

   ```bash
   # Check slow queries
   npm run db:slow-queries

   # Analyze query performance
   npm run db:explain-queries

   # Optimize indexes
   npm run db:optimize-indexes
   ```

3. **Feature Flag Issues**

   ```bash
   # Check feature flag status
   npm run feature-flags:status

   # Clear feature flag cache
   npm run feature-flags:clear-cache

   # Validate feature flag configuration
   npm run feature-flags:validate
   ```

### Performance Issues

1. **High Response Times**

   ```bash
   # Check application performance
   npm run performance:profile

   # Analyze database performance
   npm run db:performance:analyze

   # Check cache performance
   npm run cache:performance
   ```

2. **Database Connection Issues**

   ```bash
   # Check database connectivity
   npm run db:health-check

   # Monitor connection pool
   npm run db:monitor:connections

   # Restart database connections
   npm run db:restart-connections
   ```

## Security Considerations

### 1. Environment Security

- Use strong, unique passwords for all services
- Enable SSL/TLS for all connections
- Configure firewall rules appropriately
- Regular security updates

### 2. Application Security

- JWT secrets must be cryptographically secure
- Enable rate limiting
- Configure CORS properly
- Regular dependency security audits

### 3. Database Security

- Use authentication and authorization
- Enable encryption at rest and in transit
- Regular backup encryption
- Monitor for suspicious activity

## Maintenance

### Daily Tasks

- [ ] Check application health
- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Check disk space usage

### Weekly Tasks

- [ ] Review security logs
- [ ] Update dependencies
- [ ] Performance optimization review
- [ ] Backup verification

### Monthly Tasks

- [ ] Security audit
- [ ] Performance analysis
- [ ] Capacity planning review
- [ ] Disaster recovery testing

## Support and Escalation

### Contact Information

- **Development Team**: dev-team@pharmatech.com
- **DevOps Team**: devops@pharmatech.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Escalation Procedures

1. **Level 1**: Application issues, feature flags
2. **Level 2**: Database issues, performance problems
3. **Level 3**: Security incidents, data corruption

### Documentation

- **API Documentation**: `/docs/api`
- **Database Schema**: `/docs/database`
- **Architecture Overview**: `/docs/architecture`
- **Troubleshooting Guide**: `/docs/troubleshooting`
