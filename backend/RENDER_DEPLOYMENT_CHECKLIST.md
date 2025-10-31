# Render Deployment Checklist

## ✅ Pre-Deployment

- [x] Code updated to support `REDIS_URL` environment variable
- [x] All Redis connections updated in:
  - [x] `src/config/queue.ts`
  - [x] `src/server.ts`
  - [x] `src/services/RedisCacheService.ts`
  - [x] `src/utils/performanceOptimization.ts`
- [x] `.env.production.example` updated with Redis configuration

## 🚀 Deployment Steps

### 1. Create Redis Instance on Render

- [ ] Go to Render Dashboard: https://dashboard.render.com
- [ ] Click "New +" button
- [ ] Select "Redis"
- [ ] Configure:
  - Name: `pharmacare-redis` (or your preferred name)
  - Plan: Free (or paid as needed)
  - Region: Same as your backend service
- [ ] Click "Create Redis"
- [ ] Wait for Redis to be created (usually < 1 minute)

### 2. Get Redis Connection URL

- [ ] Click on your newly created Redis instance
- [ ] Copy the "Internal Redis URL"
  - Format: `redis://red-xxxxx:6379`
  - Example: `redis://red-d42bv0n5r7bs73djp8cg:6379`

### 3. Update Backend Environment Variables

- [ ] Go to your backend service on Render
- [ ] Click "Environment" in the left sidebar
- [ ] Add new environment variable:
  - **Key**: `REDIS_URL`
  - **Value**: `redis://red-d42bv0n5r7bs73djp8cg:6379` (your actual URL)
- [ ] Click "Save Changes"

### 4. Deploy/Redeploy Backend

- [ ] Render will automatically redeploy after saving environment variables
- [ ] Or manually trigger: Click "Manual Deploy" → "Deploy latest commit"
- [ ] Wait for deployment to complete

### 5. Verify Deployment

- [ ] Check deployment logs:
  - [ ] Look for: "Queue Redis client connected"
  - [ ] Look for: "Redis cache connected successfully"
  - [ ] Verify NO "ECONNREFUSED" errors
- [ ] Test application functionality:
  - [ ] Background jobs working
  - [ ] Caching working
  - [ ] Real-time features working

## 🔍 Verification Commands

### Check Redis Connection in Logs
```
# Look for these success messages:
✓ Queue Redis client connected
✓ Redis cache connected successfully
✓ Redis cache manager connected

# Should NOT see:
✗ Redis connection error: Error: connect ECONNREFUSED
```

### Test Application Features
- [ ] Create an appointment (tests queue jobs)
- [ ] View analytics/reports (tests caching)
- [ ] Use chat/messaging (tests presence tracking)

## 🐛 Troubleshooting

### If you still see ECONNREFUSED errors:

1. **Verify REDIS_URL is set**
   ```
   Render Dashboard → Backend Service → Environment → Check REDIS_URL exists
   ```

2. **Check Redis instance is running**
   ```
   Render Dashboard → Redis Instance → Status should be "Available"
   ```

3. **Verify URL format**
   ```
   Should be: redis://red-xxxxx:6379
   NOT: redis://localhost:6379
   ```

4. **Force redeploy**
   ```
   Render Dashboard → Backend Service → Manual Deploy → Deploy latest commit
   ```

5. **Check logs for specific errors**
   ```
   Render Dashboard → Backend Service → Logs
   ```

## 📊 Monitoring

### Redis Metrics to Monitor
- [ ] Memory usage (should be < 80% of limit)
- [ ] Connection count
- [ ] Command latency
- [ ] Eviction count

### Application Metrics
- [ ] Background job success rate
- [ ] Cache hit ratio
- [ ] API response times
- [ ] Error rates

## 🔐 Security Checklist

- [x] Using Internal Redis URL (not External)
- [x] Redis URL stored in environment variables (not in code)
- [x] No Redis credentials in git repository
- [x] Redis instance in same region as backend

## 💰 Cost Considerations

### Current Setup
- **Redis Free Tier**: $0/month (25 MB)
- **Sufficient for**: Development, testing, small production apps

### When to Upgrade
- Memory usage consistently > 80%
- Frequent cache evictions
- Need more than 25 MB
- High traffic production app

### Upgrade Options
- **Starter**: $10/month (256 MB)
- **Standard**: $50/month (1 GB)
- **Pro**: Custom pricing

## 📝 Environment Variables Summary

### Required for Redis
```env
REDIS_URL=redis://red-d42bv0n5r7bs73djp8cg:6379
```

### Optional (if not using REDIS_URL)
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Cache Configuration
```env
CACHE_PROVIDER=redis  # or 'memory' for fallback
```

## ✨ Success Criteria

Your deployment is successful when:
- ✅ No ECONNREFUSED errors in logs
- ✅ "Redis connected" messages appear in logs
- ✅ Background jobs are processing
- ✅ Caching is working (faster response times)
- ✅ Real-time features are functional
- ✅ Application is stable and responsive

## 🎉 Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Check Redis memory usage
- [ ] Verify all features working
- [ ] Set up alerts for Redis issues
- [ ] Document any custom configurations
- [ ] Update team on new Redis setup

## 📚 Additional Resources

- [Render Redis Documentation](https://render.com/docs/redis)
- [Redis Configuration Guide](./REDIS_CONFIGURATION_GUIDE.md)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [ioredis Documentation](https://github.com/luin/ioredis)

---

**Current Status**: ✅ Code is ready for deployment with Redis support

**Next Step**: Follow steps 1-5 above to complete Redis setup on Render
