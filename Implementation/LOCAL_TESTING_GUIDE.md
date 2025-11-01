# 🧪 Local Testing Guide - Redis Reversion

## Quick Start (5 Minutes)

### Step 1: Verify Environment Variables

```bash
cd backend
cat .env | grep REDIS_URL
```

**Expected output:**
```
REDIS_URL=redis://:Makingexploit4life@247@46.202.141.1:6379
```

If not present, add it to your `.env` file.

---

### Step 2: Test Redis Connection

```bash
# Run the test script
node test-redis-connection.js
```

**Expected output:**
```
🔍 Testing Redis Connection...
📡 Connecting to: redis://:****@46.202.141.1:6379
⏳ Attempting to connect...
✅ Connected successfully!
⏳ Testing PING...
✅ PING response: PONG
⏳ Testing SET...
✅ SET successful
⏳ Testing GET...
✅ GET successful: success
⏳ Testing DEL...
✅ DEL successful
⏳ Getting Redis info...
✅ Redis Version: 7.x.x
✅ Redis Mode: standalone
⏳ Testing Pub/Sub...
✅ Pub/Sub working! Received: Hello from test!
🎉 All Redis tests passed!
```

**If test fails:**
- Check Redis is running on VPS: `ssh user@46.202.141.1 "sudo systemctl status redis"`
- Check firewall allows your IP: `ssh user@46.202.141.1 "sudo ufw status"`
- Test manually: `redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 ping`

---

### Step 3: Build the Application

```bash
npm run build
```

**Expected output:**
```
> pharma-care-backend@1.0.0 build
> tsc

✓ Build completed successfully
```

---

### Step 4: Start the Server

```bash
npm start
```

**Expected logs (in order):**

```
Paystack Service initialized
Twilio SMS service not configured - using mock mode
✅ Database connected successfully
✅ Redis cache manager connected
✅ Performance cache service connected to Redis
✅ Redis connected successfully (RedisCacheService)
Redis cache connected successfully (performanceOptimization)
✅ Redis connected for presence tracking
✅ Background job service initialized successfully
Initializing QueueService...
QueueService initialized successfully
🚀 Server running on port 5000 in production mode
📡 Socket.IO server initialized for real-time communication
Starting invitation cron jobs...
Invitation cron jobs started successfully
Starting Email Delivery Cron Service...
Email Delivery Cron Service started successfully
```

**❌ If you see errors:**

1. **MaxRetriesPerRequestError**
   - Redis server is not reachable
   - Check VPS firewall
   - Verify REDIS_URL is correct

2. **ECONNREFUSED**
   - Redis is not running on VPS
   - Run: `ssh user@46.202.141.1 "sudo systemctl start redis"`

3. **NOAUTH Authentication required**
   - Password is incorrect in REDIS_URL
   - Verify password matches Redis config

---

### Step 5: Test Application Features

#### Test 1: Cache Working

```bash
# In another terminal
curl http://localhost:5000/api/dashboard/overview

# Check Redis for cache keys
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 keys "dashboard:*"
```

**Expected:** Should see cache keys created

#### Test 2: Background Jobs Working

```bash
# Check Bull queues
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 keys "bull:*"
```

**Expected:** Should see queue keys

#### Test 3: Presence Tracking Working

```bash
# Check presence keys
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 keys "presence:*"
```

**Expected:** Should see presence keys when users are online

---

### Step 6: Monitor for Issues

```bash
# Watch logs in real-time
npm start 2>&1 | tee server.log

# In another terminal, watch for errors
tail -f server.log | grep -i "error\|fail\|crash"
```

**Run for at least 30 minutes** to ensure stability.

---

## Success Checklist

- [ ] Redis connection test passes
- [ ] Server starts without errors
- [ ] All Redis services connect successfully
- [ ] No crashes after 30 minutes
- [ ] Cache keys appear in Redis
- [ ] Queue keys appear in Redis
- [ ] Presence keys appear in Redis
- [ ] API endpoints respond correctly
- [ ] No memory leaks (check with `htop`)

---

## Common Issues & Solutions

### Issue: "Cannot find module 'ioredis'"

**Solution:**
```bash
npm install ioredis
npm run build
```

### Issue: "Redis connection timeout"

**Solution:**
```bash
# Check if Redis is accessible
telnet 46.202.141.1 6379

# If fails, check VPS firewall
ssh user@46.202.141.1 "sudo ufw allow from $(curl -s ifconfig.me) to any port 6379"
```

### Issue: "Too many connections"

**Solution:**
```bash
# On VPS, increase max clients
ssh user@46.202.141.1
sudo nano /etc/redis/redis.conf
# Set: maxclients 10000
sudo systemctl restart redis
```

### Issue: "Out of memory"

**Solution:**
```bash
# On VPS, check Redis memory
ssh user@46.202.141.1
redis-cli info memory

# Set max memory and eviction policy
sudo nano /etc/redis/redis.conf
# Add:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
sudo systemctl restart redis
```

---

## Performance Testing

### Test 1: Cache Performance

```bash
# Without cache (first request)
time curl http://localhost:5000/api/dashboard/overview

# With cache (second request)
time curl http://localhost:5000/api/dashboard/overview
```

**Expected:** Second request should be significantly faster

### Test 2: Queue Performance

```bash
# Create 100 test jobs
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/test/queue-job
done

# Check queue stats
curl http://localhost:5000/api/queues/stats
```

**Expected:** Jobs should be processed without errors

---

## Next Steps

Once local testing is successful:

1. ✅ Verify all features work
2. ✅ Monitor for 24 hours
3. ✅ Check Redis memory usage
4. ✅ Review application logs
5. ⏳ Deploy to production (see REDIS_REVERSION_COMPLETE.md)

---

## Rollback (If Needed)

If you encounter critical issues:

```bash
# Revert to previous version
git revert HEAD~2..HEAD
npm run build
npm start
```

---

## Support Commands

```bash
# Check Redis status on VPS
ssh user@46.202.141.1 "sudo systemctl status redis"

# View Redis logs on VPS
ssh user@46.202.141.1 "sudo tail -f /var/log/redis/redis-server.log"

# Monitor Redis in real-time
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 monitor

# Check Redis memory usage
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 info memory

# Check connected clients
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 client list
```

---

**Ready to test? Run:** `node test-redis-connection.js`
