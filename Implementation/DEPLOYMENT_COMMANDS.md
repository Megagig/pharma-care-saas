# License Verification System - Deployment Commands

## 🚀 Step-by-Step Deployment Guide

### Prerequisites
- Node.js installed
- MongoDB running
- Git repository access
- Environment variables configured

---

## 1️⃣ Pre-Deployment Checks

### Check Current Branch
```bash
git status
git branch
```

### Pull Latest Changes
```bash
git pull origin main
```

### Check Node Version
```bash
node --version  # Should be >= 16.x
npm --version   # Should be >= 8.x
```

---

## 2️⃣ Backend Setup

### Navigate to Backend
```bash
cd backend
```

### Install Dependencies
```bash
npm install
```

### Run Database Migration
```bash
# Run the migration
npm run migrate:up

# Or run directly with ts-node
npx ts-node src/migrations/add-license-fields.ts
```

### Verify Migration
```bash
# Connect to MongoDB and check
mongo
use pharmily
db.users.findOne({}, { pharmacySchool: 1, yearOfGraduation: 1 })
exit
```

### Create Upload Directory
```bash
mkdir -p uploads/licenses
chmod 755 uploads/licenses
ls -la uploads/
```

### Build Backend
```bash
npm run build
```

### Run Tests (Optional)
```bash
npm test
```

### Start Backend (Development)
```bash
npm run dev
```

### Start Backend (Production)
```bash
npm run start
```

---

## 3️⃣ Frontend Setup

### Navigate to Frontend
```bash
cd ../frontend
```

### Install Dependencies
```bash
npm install
```

### Build Frontend
```bash
npm run build
```

### Run Tests (Optional)
```bash
npm test
```

### Start Frontend (Development)
```bash
npm run dev
```

### Preview Production Build
```bash
npm run preview
```

---

## 4️⃣ Environment Configuration

### Backend Environment Variables
Create/Update `backend/.env`:
```bash
# Edit the .env file
nano backend/.env

# Or use your preferred editor
code backend/.env
```

Required variables:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pharmily
JWT_SECRET=your_jwt_secret_here
EMAIL_SERVICE_API_KEY=your_email_api_key
UPLOAD_MAX_SIZE=5242880
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Environment Variables
Create/Update `frontend/.env`:
```bash
# Edit the .env file
nano frontend/.env
```

Required variables:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Pharmily
```

---

## 5️⃣ Database Backup (Before Migration)

### Create Backup
```bash
# Backup entire database
mongodump --db pharmily --out ./backup-$(date +%Y%m%d-%H%M%S)

# Or backup just users collection
mongodump --db pharmily --collection users --out ./backup-users-$(date +%Y%m%d-%H%M%S)
```

### Verify Backup
```bash
ls -lh backup-*
```

---

## 6️⃣ Testing Commands

### Test License Upload API
```bash
# Test with curl
curl -X POST http://localhost:5000/api/license/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "licenseDocument=@/path/to/license.pdf" \
  -F "licenseNumber=TEST-123" \
  -F "licenseExpirationDate=2026-12-31" \
  -F "pharmacySchool=University of Lagos" \
  -F "yearOfGraduation=2020"
```

### Test License Status API
```bash
curl -X GET http://localhost:5000/api/license/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Admin Pending Licenses API
```bash
curl -X GET http://localhost:5000/api/admin/licenses/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 7️⃣ Deployment to Staging

### Deploy Backend to Staging
```bash
# SSH to staging server
ssh user@staging-server

# Navigate to project
cd /var/www/pharmily-backend

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migration
npm run migrate:up

# Build
npm run build

# Restart service
pm2 restart pharmily-backend

# Check logs
pm2 logs pharmily-backend
```

### Deploy Frontend to Staging
```bash
# SSH to staging server
ssh user@staging-server

# Navigate to project
cd /var/www/pharmily-frontend

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Copy to web server
cp -r dist/* /var/www/html/

# Restart nginx
sudo systemctl restart nginx
```

---

## 8️⃣ Deployment to Production

### Deploy Backend to Production
```bash
# SSH to production server
ssh user@production-server

# Navigate to project
cd /var/www/pharmily-backend

# Create backup first
mongodump --db pharmily --out ./backup-$(date +%Y%m%d-%H%M%S)

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Run migration
npm run migrate:up

# Build
npm run build

# Restart service
pm2 restart pharmily-backend

# Check status
pm2 status

# Monitor logs
pm2 logs pharmily-backend --lines 100
```

### Deploy Frontend to Production
```bash
# SSH to production server
ssh user@production-server

# Navigate to project
cd /var/www/pharmily-frontend

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Build
npm run build

# Backup current version
mv /var/www/html /var/www/html-backup-$(date +%Y%m%d-%H%M%S)

# Copy new build
cp -r dist /var/www/html

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx
```

---

## 9️⃣ Post-Deployment Verification

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Check Frontend
```bash
curl http://localhost:3000
```

### Check Database Connection
```bash
mongo
use pharmily
db.users.count()
exit
```

### Check File Upload Directory
```bash
ls -la backend/uploads/licenses/
```

### Monitor Logs
```bash
# Backend logs
tail -f backend/logs/combined.log

# Or with PM2
pm2 logs pharmily-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔟 Rollback Commands (If Needed)

### Rollback Database Migration
```bash
cd backend
npm run migrate:down
```

### Restore Database from Backup
```bash
# Stop the application first
pm2 stop pharmily-backend

# Restore database
mongorestore --db pharmily --drop ./backup-YYYYMMDD-HHMMSS/pharmily

# Restart application
pm2 start pharmily-backend
```

### Rollback Backend Code
```bash
cd backend
git log --oneline  # Find the commit to rollback to
git revert HEAD    # Or specific commit hash
npm install
npm run build
pm2 restart pharmily-backend
```

### Rollback Frontend Code
```bash
cd frontend
git log --oneline
git revert HEAD
npm install
npm run build
cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

---

## 1️⃣1️⃣ Monitoring Commands

### Check Application Status
```bash
# PM2 status
pm2 status

# PM2 monitoring
pm2 monit

# System resources
htop
```

### Check Disk Space
```bash
df -h
du -sh backend/uploads/licenses/
```

### Check Memory Usage
```bash
free -h
```

### Check Database Size
```bash
mongo
use pharmily
db.stats()
exit
```

---

## 1️⃣2️⃣ Maintenance Commands

### Clear Old Logs
```bash
# Clear PM2 logs
pm2 flush

# Clear application logs
rm backend/logs/*.log

# Rotate logs
logrotate /etc/logrotate.d/pharmily
```

### Clean Old Backups
```bash
# Keep only last 7 days of backups
find ./backup-* -mtime +7 -exec rm -rf {} \;
```

### Update Dependencies
```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

---

## 1️⃣3️⃣ Troubleshooting Commands

### Check Port Usage
```bash
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000
```

### Check Process
```bash
ps aux | grep node
ps aux | grep nginx
```

### Restart Services
```bash
# Restart backend
pm2 restart pharmily-backend

# Restart nginx
sudo systemctl restart nginx

# Restart MongoDB
sudo systemctl restart mongod
```

### Check Firewall
```bash
sudo ufw status
sudo ufw allow 5000
sudo ufw allow 3000
```

---

## 1️⃣4️⃣ Quick Commands Reference

### Start Everything (Development)
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - MongoDB
mongod
```

### Build Everything
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Test Everything
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Clean Everything
```bash
# Backend
cd backend && rm -rf node_modules dist && npm install

# Frontend
cd frontend && rm -rf node_modules dist && npm install
```

---

## 📝 Notes

- Always create a backup before deployment
- Test on staging before production
- Monitor logs after deployment
- Have rollback plan ready
- Keep team informed of deployment status

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0
