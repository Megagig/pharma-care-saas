# 🚀 Upstash Redis Setup Guide

## Why Upstash?

Upstash Redis is perfect for serverless deployments like Render because:
- ✅ **Serverless-friendly**: Pay per request, no idle costs
- ✅ **Global edge network**: Low latency worldwide
- ✅ **Free tier**: 10,000 commands/day free
- ✅ **TLS/SSL**: Secure by default
- ✅ **No connection limits**: Perfect for serverless functions

## Step-by-Step Setup

### Step 1: Get Your Upstash Redis Credentials

1. **Go to your Upstash database**:
   https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b

2. **Copy the Redis Connection String**:
   - Look for the section labeled **"Redis Connect"** or **"Connection String"**
   - Copy the URL that looks like:
     ```
     redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
     ```
   - Example:
     ```
     redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379
     ```

3. **Optional: Copy REST API credentials** (for advanced use):
   - **UPSTASH_REDIS_REST_URL**: `https://xxxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: Your token

### Step 2: Update Local .env File

Open `backend/.env` and replace the REDIS_URL with your Upstash URL:

```env
# Redis Configuration - Upstash Redis
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

**Example**:
```env
REDIS_URL=redis://default:AXzxASQgYTU5ZjYtNDU5Zi00ZjYtODU5Zi00ZjYtODU5Zg@us1-merry-firefly-12345.upstash.io:6379
```

### Step 3: Test Locally

```bash
cd backend
npm run dev
```

**Look for these success messages in logs**:
```
✅ Queue Redis client connected
✅ Redis cache connected successfully
✅ Redis cache manager connected
```

**If you see errors**, check:
- URL is correct (copy-paste from Upstash console)
- No extra spaces in .env file
- URL includes `redis://` prefix
- Password is correct

### Step 4: Deploy to Render

1. **Go to Render Dashboard**:
   https://dashboard.render.com

2. **Open your backend service**

3. **Add Environment Variable**:
   - Click "Environment" in left sidebar
   - Click "Add Environment Variable"
   - **Key**: `REDIS_URL`
   - **Value**: `redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379`
   - Click "Save Changes"

4. **Wait for Redeploy**:
   - Render will automatically redeploy (~2-3 minutes)

5. **Verify in Logs**:
   - Click "Logs" tab
   - Look for: "Queue Redis client connected" ✅
   - No "ECONNREFUSED" errors ❌

## What's Different with Upstash?

### TLS/SSL Required
Upstash requires TLS connections. The code now automatically detects Upstash URLs and enables TLS:

```javascript
tls: redisUrl.includes('upstash.io') 
  ? { rejectUnauthorized: false } 
  : undefined
```

### IPv6 Support
Upstash uses IPv6. The code automatically sets this:

```javascript
family: redisUrl.includes('upstash.io') ? 6 : 4
```

### Longer Timeouts
Serverless environments need longer timeouts:

```javascript
connectTimeout: 30000  // 30 seconds
commandTimeout: 10000  // 10 seconds
```

### Single Database
Upstash free tier only supports database 0:

```javascript
db: redisUrl.includes('upstash.io') ? 0 : 1
```

## Upstash Console Features

### Monitor Usage
- Go to: https://console.upstash.com/redis/314e66a6-a505-416b-b81d-0c25304f634b
- View:
  - Commands per day
  - Storage used
  - Bandwidth
  - Latency

### View Data
- Click "Data Browser" tab
- See all keys and values
- Manually add/edit/delete keys
- Useful for debugging

### Metrics
- Click "Metrics" tab
- View graphs of:
  - Request rate
  - Latency
  - Error rate
  - Storage usage

## Troubleshooting

### Error: "Connection timeout"

**Solution 1**: Check your Upstash URL
```bash
# Should look like this:
redis://default:PASSWORD@HOST.upstash.io:6379

# NOT like this:
redis://HOST.upstash.io:6379  # Missing password
```

**Solution 2**: Verify database is active
- Go to Upstash console
- Check database status is "Active"

**Solution 3**: Check region
- Upstash database and Render service should be in nearby regions
- US East (Upstash) works well with US East (Render)

### Error: "WRONGPASS invalid username-password pair"

**Solution**: Copy the full connection string from Upstash
- Don't manually construct the URL
- Use the exact string from Upstash console
- Include the `default:` username part

### Error: "Protocol error"

**Solution**: Ensure TLS is enabled
- The code should automatically detect Upstash
- If not, check the URL contains "upstash.io"

### Slow Performance

**Solution 1**: Check region proximity
- Upstash: https://console.upstash.com → Database → Region
- Render: Dashboard → Service → Region
- Should be in same or nearby regions

**Solution 2**: Upgrade Upstash plan
- Free tier: 10,000 commands/day
- Paid tier: Unlimited commands, better performance

## Upstash Free Tier Limits

- **Commands**: 10,000 per day
- **Storage**: 256 MB
- **Bandwidth**: 1 GB per day
- **Databases**: 1 database
- **Regions**: All regions available

**Is this enough?**
- ✅ Development: Yes
- ✅ Testing: Yes
- ✅ Small production: Yes (< 100 users)
- ⚠️ Medium production: Maybe (monitor usage)
- ❌ Large production: No (upgrade needed)

## Upgrading Upstash

When you need more:

1. **Go to Upstash console**
2. **Click "Upgrade"**
3. **Choose plan**:
   - **Pay as you go**: $0.2 per 100K commands
   - **Pro**: $10/month (1M commands included)
   - **Enterprise**: Custom pricing

## Monitoring Commands Usage

### Check Daily Usage
```bash
# In Upstash console
Dashboard → Your Database → Usage tab
```

### Estimate Your Usage
- **Per user session**: ~50-100 commands
- **Per API request**: ~5-10 commands (with caching)
- **Per background job**: ~10-20 commands

**Example**:
- 100 users/day × 50 commands = 5,000 commands/day ✅ (within free tier)
- 1,000 users/day × 50 commands = 50,000 commands/day ❌ (need paid tier)

## Best Practices

### 1. Use Connection Pooling
✅ Already configured in the code

### 2. Set Appropriate TTLs
```javascript
// Cache for 5 minutes
await redis.setex('key', 300, 'value');
```

### 3. Monitor Usage
- Check Upstash console weekly
- Set up alerts for 80% usage

### 4. Use Pipelining for Bulk Operations
```javascript
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

### 5. Handle Errors Gracefully
✅ Already configured in the code

## Security

### ✅ What's Secure
- TLS/SSL encryption enabled
- Password authentication required
- Credentials in environment variables
- No credentials in code

### 🔒 Additional Security
1. **Rotate passwords regularly**:
   - Upstash console → Database → Settings → Rotate Password

2. **Use IP allowlist** (paid plans):
   - Restrict access to specific IPs

3. **Monitor access logs**:
   - Check for unusual activity

## Cost Comparison

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Upstash** | 10K commands/day | $0.2 per 100K |
| **Render Redis** | 25 MB | $10/month (256 MB) |
| **Redis Cloud** | 30 MB | $5/month (100 MB) |
| **AWS ElastiCache** | None | $15/month (cache.t3.micro) |

**Winner for Serverless**: Upstash (pay per use, no idle costs)

## Migration from Render Redis

If you were using Render Redis before:

1. **Update REDIS_URL** in Render environment variables
2. **Data won't migrate** (Redis is cache, not database)
3. **No downtime** (cache will rebuild automatically)
4. **Monitor for 24 hours** to ensure stability

## Support

### Upstash Support
- Documentation: https://docs.upstash.com/redis
- Discord: https://discord.gg/upstash
- Email: support@upstash.com

### Common Issues
- Check Upstash status: https://status.upstash.com
- Review docs: https://docs.upstash.com/redis/troubleshooting

## Summary

✅ **Code updated** for Upstash compatibility
✅ **TLS/SSL** automatically enabled
✅ **IPv6** support added
✅ **Longer timeouts** for serverless
✅ **Single database** support (free tier)

**Next Steps**:
1. Copy your Upstash Redis URL
2. Update `backend/.env` with the URL
3. Test locally: `npm run dev`
4. Deploy to Render with the URL
5. Monitor usage in Upstash console

**Result**: No more Redis connection errors! 🎉
