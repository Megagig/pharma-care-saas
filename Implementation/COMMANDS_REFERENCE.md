# Commands Reference

## 🚀 Starting the Application

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start Both (in separate terminals)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 🧪 Testing Commands

### Test Backend Endpoints
```bash
./test-phase1-backend.sh
```

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### Test Super Admin Endpoints (without auth)
```bash
# Clinical Interventions
curl http://localhost:5000/api/super-admin/dashboard/clinical-interventions

# Activities
curl http://localhost:5000/api/super-admin/dashboard/activities

# Communications
curl http://localhost:5000/api/super-admin/dashboard/communications

# Expected: 401 (authentication required)
```

### Test Frontend
```bash
curl http://localhost:5173
```

---

## 🔍 Debugging Commands

### Check Backend Logs
```bash
# In backend terminal, you should see:
# - Server running on port 5000
# - Database connected
# - API requests logging
```

### Check Frontend Logs
```bash
# In frontend terminal, you should see:
# - Vite dev server running
# - Hot module replacement working
# - No compilation errors
```

### Check Processes
```bash
# Check what's running on port 5000
lsof -i :5000

# Check what's running on port 5173
lsof -i :5173
```

### Kill Processes
```bash
# Kill backend
pkill -f "node.*backend"

# Kill frontend
pkill -f "vite"

# Kill specific port
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5173)
```

---

## 📦 Installation Commands

### Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🗄️ Database Commands

### Check MongoDB Connection
```bash
# If using MongoDB locally
mongosh

# Check databases
show dbs

# Use your database
use pharma-care-saas

# Check collections
show collections

# Count documents
db.users.countDocuments()
db.patients.countDocuments()
db.clinicalinterventions.countDocuments()
```

### Seed Data (if needed)
```bash
cd backend
npm run seed
```

---

## 🔧 Build Commands

### Build Backend
```bash
cd backend
npm run build
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Preview Production Build
```bash
cd frontend
npm run preview
```

---

## 📝 Git Commands

### Check Status
```bash
git status
```

### View Changes
```bash
# View all changes
git diff

# View specific file
git diff frontend/src/components/dashboard/SuperAdminDashboard.tsx
```

### Commit Changes
```bash
git add .
git commit -m "feat: enhance super admin dashboard with system-wide metrics"
```

### Rollback Changes
```bash
# Rollback specific file
git checkout HEAD -- frontend/src/components/dashboard/SuperAdminDashboard.tsx

# Rollback all changes
git reset --hard HEAD
```

---

## 🧹 Cleanup Commands

### Clear Node Modules
```bash
# Backend
rm -rf backend/node_modules

# Frontend
rm -rf frontend/node_modules
```

### Clear Build Artifacts
```bash
# Backend
rm -rf backend/dist

# Frontend
rm -rf frontend/dist
rm -rf frontend/build
```

### Clear Cache
```bash
# npm cache
npm cache clean --force

# Browser cache
# Use Ctrl+Shift+R or Cmd+Shift+R
```

---

## 📊 Monitoring Commands

### Watch Backend Logs
```bash
cd backend
npm run dev | tee backend.log
```

### Watch Frontend Logs
```bash
cd frontend
npm run dev | tee frontend.log
```

### Monitor Network
```bash
# Use browser DevTools
# Network tab -> Filter by XHR/Fetch
```

---

## 🔐 Authentication Commands

### Get Auth Cookie (from browser)
```javascript
// In browser console
document.cookie
```

### Test with Auth Cookie
```bash
curl -H "Cookie: your-auth-cookie-here" \
  http://localhost:5000/api/super-admin/dashboard/clinical-interventions
```

---

## 📈 Performance Commands

### Check Bundle Size
```bash
cd frontend
npm run build
ls -lh dist/assets/
```

### Analyze Bundle
```bash
cd frontend
npm run build -- --analyze
```

---

## 🐛 Troubleshooting Commands

### Check Node Version
```bash
node --version
# Should be >= 16.x
```

### Check npm Version
```bash
npm --version
# Should be >= 8.x
```

### Check TypeScript
```bash
cd frontend
npx tsc --version
```

### Verify Installations
```bash
# Backend
cd backend
npm list

# Frontend
cd frontend
npm list
```

---

## 🔄 Restart Commands

### Restart Backend
```bash
# Stop (Ctrl+C in terminal)
# Then start again
cd backend && npm run dev
```

### Restart Frontend
```bash
# Stop (Ctrl+C in terminal)
# Then start again
cd frontend && npm run dev
```

### Full Restart
```bash
# Kill all processes
pkill -f "node.*backend"
pkill -f "vite"

# Wait a moment
sleep 2

# Start backend
cd backend && npm run dev &

# Start frontend
cd frontend && npm run dev &
```

---

## 📚 Documentation Commands

### View Documentation
```bash
# List all documentation files
ls -la *.md

# Read specific doc
cat FINAL_SUMMARY.md
cat TESTING_CHECKLIST.md
cat QUICK_REFERENCE.md
```

### Search Documentation
```bash
# Search for specific term
grep -r "Clinical Interventions" *.md
```

---

## 🎯 Quick Commands

### One-Line Start
```bash
cd backend && npm run dev & cd frontend && npm run dev
```

### One-Line Test
```bash
./test-phase1-backend.sh && echo "✅ Backend tests passed"
```

### One-Line Health Check
```bash
curl -s http://localhost:5000/api/health | jq
```

---

## 💡 Useful Aliases

Add these to your `.bashrc` or `.zshrc`:

```bash
# Start backend
alias start-backend="cd ~/path/to/project/backend && npm run dev"

# Start frontend
alias start-frontend="cd ~/path/to/project/frontend && npm run dev"

# Test backend
alias test-backend="cd ~/path/to/project && ./test-phase1-backend.sh"

# Health check
alias health-check="curl -s http://localhost:5000/api/health | jq"
```

---

## 🔗 Quick URLs

```bash
# Open in browser
open http://localhost:5173
open http://localhost:5000/api/health

# Or use curl
curl http://localhost:5173
curl http://localhost:5000/api/health
```

---

**Need more help?** Check FINAL_SUMMARY.md or TROUBLESHOOTING section.
