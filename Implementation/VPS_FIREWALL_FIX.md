# 🔥 VPS Firewall Configuration - Fix Connection Timeout

## Problem
Render is getting `ETIMEDOUT` when trying to connect to your VPS Redis. This means the firewall is blocking the connection.

---

## Solution: Configure VPS Firewall Correctly

### Step 1: SSH to Your VPS

```bash
ssh root@46.202.141.1
```

### Step 2: Check Current Firewall Status

```bash
sudo ufw status numbered
```

**Look for:** Rules allowing port 6379

### Step 3: Check if Redis is Listening

```bash
# Check if Redis is running
sudo systemctl status redis

# Check what Redis is listening on
sudo netstat -tulpn | grep 6379
# or
sudo ss -tulpn | grep 6379
```

**Expected output:**
```
tcp        0      0 0.0.0.0:6379            0.0.0.0:*               LISTEN      1234/redis-server
```

**If you see `127.0.0.1:6379` instead of `0.0.0.0:6379`**, Redis is only listening on localhost!

### Step 4: Configure Redis to Accept Remote Connections

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find this line:
bind 127.0.0.1 ::1

# Change it to (allow all interfaces):
bind 0.0.0.0 ::

# Or more secure (allow specific IPs):
bind 0.0.0.0

# Save and exit (Ctrl+X, Y, Enter)

# Restart Redis
sudo systemctl restart redis

# Verify it's listening on all interfaces
sudo netstat -tulpn | grep 6379
# Should show: 0.0.0.0:6379
```

### Step 5: Configure Firewall to Allow Render IPs

```bash
# Get Render's current IP ranges (as of 2024)
# Source: https://render.com/docs/static-outbound-ip-addresses

# Allow Render IP ranges
sudo ufw allow from 216.24.57.0/24 to any port 6379 comment 'Render Redis Access'
sudo ufw allow from 216.24.58.0/24 to any port 6379 comment 'Render Redis Access'

# Also allow these additional Render ranges
sudo ufw allow from 216.24.59.0/24 to any port 6379 comment 'Render Redis Access'
sudo ufw allow from 35.169.0.0/16 to any port 6379 comment 'Render Redis Access'

# Verify rules were added
sudo ufw status numbered
```

### Step 6: Test Connection from VPS

```bash
# Test Redis locally
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 ping
# Should return: PONG

# Test Redis from external interface
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 ping
# Should return: PONG
```

### Step 7: Test from Your Local Machine

```bash
# From your local machine (not VPS)
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 ping
```

**If this works**, the firewall is configured correctly!

**If this fails**, check:
1. VPS provider firewall (Hostinger control panel)
2. Network security groups
3. Redis is actually listening on 0.0.0.0

---

## Alternative: Check Hostinger Control Panel

Your VPS provider (Hostinger) might have an additional firewall in their control panel:

### Step 1: Login to Hostinger

1. Go to https://www.hostinger.com
2. Login to your account
3. Go to VPS section

### Step 2: Check Firewall/Security Settings

Look for:
- **Firewall Rules**
- **Security Groups**
- **Network Settings**
- **Port Management**

### Step 3: Allow Port 6379

Add a rule to allow:
- **Port:** 6379
- **Protocol:** TCP
- **Source:** Render IP ranges (216.24.57.0/24, 216.24.58.0/24)

---

## Quick Test Script

Run this on your VPS to verify everything:

```bash
#!/bin/bash

echo "=== Redis VPS Configuration Check ==="
echo ""

echo "1. Checking if Redis is running..."
sudo systemctl status redis | grep "Active:"
echo ""

echo "2. Checking Redis listening address..."
sudo netstat -tulpn | grep 6379
echo ""

echo "3. Checking firewall rules for port 6379..."
sudo ufw status | grep 6379
echo ""

echo "4. Testing Redis connection locally..."
redis-cli -h localhost -p 6379 -a Makingexploit4life@247 ping
echo ""

echo "5. Testing Redis connection from external IP..."
redis-cli -h 46.202.141.1 -p 6379 -a Makingexploit4life@247 ping
echo ""

echo "6. Checking Redis configuration..."
grep "^bind" /etc/redis/redis.conf
echo ""

echo "=== Configuration Check Complete ==="
```

Save this as `check-redis.sh`, make it executable, and run it:

```bash
chmod +x check-redis.sh
./check-redis.sh
```

---

## Common Issues & Solutions

### Issue 1: Redis Only Listening on 127.0.0.1

**Symptom:**
```
tcp  0  0  127.0.0.1:6379  0.0.0.0:*  LISTEN
```

**Solution:**
```bash
sudo nano /etc/redis/redis.conf
# Change: bind 127.0.0.1 ::1
# To: bind 0.0.0.0 ::
sudo systemctl restart redis
```

### Issue 2: Firewall Rules Not Working

**Symptom:** Rules added but connection still times out

**Solution:**
```bash
# Reload firewall
sudo ufw reload

# Or restart firewall
sudo ufw disable
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

### Issue 3: Hostinger Additional Firewall

**Symptom:** UFW rules correct but still can't connect

**Solution:** Check Hostinger control panel for additional firewall/security groups

### Issue 4: Wrong Render IP Ranges

**Symptom:** Connection works sometimes but not always

**Solution:** Add all Render IP ranges:
```bash
# Primary ranges
sudo ufw allow from 216.24.57.0/24 to any port 6379
sudo ufw allow from 216.24.58.0/24 to any port 6379
sudo ufw allow from 216.24.59.0/24 to any port 6379

# Additional ranges (check Render docs for latest)
sudo ufw allow from 35.169.0.0/16 to any port 6379
sudo ufw allow from 44.226.0.0/16 to any port 6379
```

---

## Temporary Test: Allow All (NOT FOR PRODUCTION!)

To test if it's a firewall issue, temporarily allow all connections:

```bash
# TEMPORARY - FOR TESTING ONLY
sudo ufw allow 6379/tcp

# Test from Render
# If it works, the issue is firewall rules

# IMPORTANT: Remove this rule after testing!
sudo ufw delete allow 6379/tcp

# Then add proper Render IP rules
```

**⚠️ WARNING:** Never leave port 6379 open to the internet in production!

---

## Expected Render Logs After Fix

Once configured correctly, you should see:

```
✅ Database connected successfully
✅ Redis cache manager connected
✅ Background job service initialized successfully
✅ Redis connected for presence tracking
Initializing QueueService...
QueueService initialized successfully
🚀 Server running on port 5000 in production mode
```

**No more:**
- ❌ `ETIMEDOUT` errors
- ❌ `MaxRetriesPerRequestError`
- ❌ Server crashes

---

## Verification Checklist

After configuration:

- [ ] Redis listening on 0.0.0.0:6379 (not 127.0.0.1)
- [ ] UFW rules allow Render IPs to port 6379
- [ ] Hostinger firewall (if any) allows port 6379
- [ ] Can connect from local machine: `redis-cli -h 46.202.141.1 -p 6379 -a PASSWORD ping`
- [ ] Render logs show successful Redis connection
- [ ] No ETIMEDOUT errors in Render logs
- [ ] Application working without crashes

---

## Need Help?

If still not working after these steps, provide:

1. Output of: `sudo netstat -tulpn | grep 6379`
2. Output of: `sudo ufw status numbered`
3. Output of: `grep "^bind" /etc/redis/redis.conf`
4. Screenshot of Hostinger firewall settings (if any)

This will help diagnose the exact issue.
