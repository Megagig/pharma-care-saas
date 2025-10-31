# Redis Configuration Guide

## Overview
This guide explains how Redis is configured in the PharmaCare SaaS application and how to set it up for deployment on Render or other cloud platforms.

## What Was Changed

### Files Updated
1. **backend/src/config/queue.ts** - Bull queue Redis configuration
2. **backend/src/server.ts** - Socket.io presence tracking Redis
3. **backend/src/services/RedisCacheService.ts** - Report caching Redis
4. **backend/src/utils/performanceOptimization.ts** - Performance cache Redis
5. **backend/.env.production.example** - Production environment template

### Configuration Pattern
All Redis connections now support two configuration methods:

**Method 1: Using REDIS_URL (Recommended for Cloud Platforms)**
```env
REDIS_URL=redis://red-xxxxx:6379
```

**Method 2: Using Individual Parameters (Legacy)**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

## Setup Instructions

### For Render Deployment

1. **Create Redis Instance on Render**
   - Go to Render Dashboard
   - Click "New +" → "Redis"
   - Choose a name (e.g., "pharmacare-redis")
   - Select a plan (Free tier available)
   - Click "Create Redis"

2. **Get Redis Connection URL**
   - Once created, copy the "Internal Redis URL"
   - Format: `redis://red-xxxxx:6379`

3. **Add to Backend Environment Variables**
   - Go to your backend service on Render
   - Navigate to "Environment" tab
   - Add environment variable:
     ```
     REDIS_URL=redis://red-d42bv0n5r7bs73djp8cg:6379
     ```
   - Save changes (this will trigger a redeploy)

4. **Verify Connection**
   - Check logs after deployment
   - Look for: "Queue Redis client connected" or "Redis cache connected successfully"
   - No more "ECONNREFUSED" errors should appear

### For Other Cloud Platforms

#### Heroku
```bash
# Heroku automatically sets REDIS_URL when you add Redis addon
heroku addons:create heroku-redis:mini
```

#### Railway
```bash
# Railway provides REDIS_URL automatically when you add Redis service
# Just add Redis from the Railway dashboard
```

#### AWS/DigitalOcean/Custom
```env
# Use your Redis instance URL
REDIS_URL=redis://your-redis-host:6379
# Or with password
REDIS_URL=redis://:password@your-redis-host:6379
```

## Redis Usage in the Application

### 1. Job Queues (Bull/BullMQ)
- **Location**: `backend/src/config/queue.ts`
- **Purpose**: Background jobs for appointments, reminders, follow-ups
- **Queues**:
  - appointment-reminder
  - follow-up-monitor
  - medication-reminder
  - adherence-check
  - appointment-status

### 2. Caching
- **Location**: `backend/src/services/RedisCacheService.ts`
- **Purpose**: Cache reports, analytics, and frequently accessed data
- **TTL**: Configurable per data type (5-30 minutes)

### 3. Real-time Presence
- **Location**: `backend/src/server.ts`
- **Purpose**: Track online users for chat/messaging features
- **Data**: User presence status, last seen, custom status

### 4. Performance Optimization
- **Location**: `backend/src/utils/performanceOptimization.ts`
- **Purpose**: Cache database queries and API responses
- **Benefits**: Reduced database load, faster response times

## Troubleshooting

### Error: ECONNREFUSED 127.0.0.1:6379
**Cause**: Application trying to connect to localhost Redis, but Redis is not available

**Solution**:
1. Ensure `REDIS_URL` environment variable is set on Render
2. Verify the Redis URL is correct
3. Check Redis instance is running on Render dashboard
4. Redeploy the backend service

### Error: Connection timeout
**Cause**: Network issues or incorrect Redis URL

**Solution**:
1. Use "Internal Redis URL" from Render (not External)
2. Ensure backend and Redis are in the same region
3. Check firewall/security group settings

### Redis Not Connecting After Deployment
**Solution**:
1. Check Render logs: `View Logs` on your backend service
2. Verify environment variable is set: Check "Environment" tab
3. Ensure Redis instance is active: Check Redis dashboard
4. Try manual redeploy: Click "Manual Deploy" → "Deploy latest commit"

## Optional: Making Redis Optional

If you want the application to work without Redis (not recommended for production):

1. **Update .env**:
```env
CACHE_PROVIDER=memory
DISABLE_BACKGROUND_JOBS=true
```

2. **Graceful Degradation**:
- CacheManager and PerformanceCacheService already handle Redis unavailability
- They fall back to in-memory caching
- Background jobs will be disabled

## Performance Considerations

### Redis Memory Usage
- **Free Tier**: 25 MB (sufficient for small apps)
- **Paid Tiers**: Scale as needed
- **Monitoring**: Check Redis dashboard for memory usage

### Connection Pooling
- Application uses connection pooling automatically
- Max retries: 3 attempts
- Retry strategy: Exponential backoff

### Data Persistence
- Render Redis includes persistence by default
- Data survives restarts
- Regular backups recommended for production

## Security Best Practices

1. **Use Internal URLs**: Always use Internal Redis URL on Render
2. **No Password in Code**: Use environment variables only
3. **TLS/SSL**: Enable for production (Render handles this)
4. **Access Control**: Limit Redis access to backend service only

## Monitoring

### Key Metrics to Watch
- Connection count
- Memory usage
- Command latency
- Hit/miss ratio (for caching)

### Render Dashboard
- View Redis metrics in Render dashboard
- Set up alerts for high memory usage
- Monitor connection errors

## Cost Optimization

### Free Tier Limits
- 25 MB memory
- Suitable for development/testing
- May need upgrade for production

### When to Upgrade
- Memory usage > 80%
- Frequent evictions
- High latency
- Multiple concurrent users

## Support

For issues:
1. Check Render documentation: https://render.com/docs/redis
2. Review application logs
3. Contact Render support
4. Check this guide's troubleshooting section

## Summary

Your Redis configuration is now cloud-ready! The application will:
- ✅ Connect to Render Redis using `REDIS_URL`
- ✅ Fall back to individual parameters if needed
- ✅ Handle connection errors gracefully
- ✅ Support all Redis-dependent features (queues, caching, presence)

After setting `REDIS_URL` on Render, the "ECONNREFUSED" errors will disappear permanently.
