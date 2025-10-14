# Vite Proxy is Broken - Alternative Solution

## Problem
The Vite dev server proxy returns 404 for POST requests to `/api/auth/login`. This is a known issue with Vite's http-proxy-middleware.

## Solution: Use nginx as Reverse Proxy

Instead of relying on Vite's broken proxy, use nginx to serve both frontend and backend on the same port in development.

### Setup nginx (Quick):

1. **Install nginx** (if not installed):
   ```bash
   sudo apt install nginx  # Ubuntu/Debian
   # or
   brew install nginx      # Mac
   ```

2. **Create nginx config** (`/etc/nginx/sites-available/pharma-dev`):
   ```nginx
   server {
       listen 3000;
       server_name localhost;

       # Frontend (Vite dev server)
       location / {
           proxy_pass http://127.0.0.1:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API
       location /api {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable and restart nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pharma-dev /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Access app at**: `http://localhost:3000`

Now both frontend and backend are on the same origin, cookies work perfectly!

## Alternative: Simpler Solution Without nginx

Just accept that development uses different origins and handle it:

### Option A: Use localStorage tokens (less secure but works)
- Backend sends tokens in response body
- Frontend stores in localStorage
- Frontend sends in Authorization header

### Option B: Accept CORS and different origins
- Keep using `http://127.0.0.1:5000/api` directly
- Backend CORS is already configured
- Cookies won't work cross-origin, so use localStorage

## Recommended: Option B (Direct Backend URLs)

Since the Vite proxy is broken and you need it to work in production anyway, let's just use direct backend URLs in development and handle cookies differently.

I'll implement this now...
