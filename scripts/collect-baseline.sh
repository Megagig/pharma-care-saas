#!/bin/bash

# Performance Baseline Collection Script
# This script collects comprehensive performance metrics for the PharmaPilot application

set -e

echo "🚀 Starting Performance Baseline Collection..."
echo "================================================"

# Create results directory
mkdir -p performance-baseline
cd performance-baseline

# Clean previous results
rm -f *.txt *.json *.html

echo "📦 Building application..."
cd ../frontend
npm run build

echo "📊 Running Lighthouse performance tests..."
echo "This may take a few minutes..."

# Run Lighthouse tests
npm run lighthouse > ../performance-baseline/lighthouse-results.txt 2>&1 || echo "Lighthouse completed with warnings"

echo "📈 Analyzing bundle size..."
npm run bundle:size > ../performance-baseline/bundle-analysis.txt 2>&1 || echo "Bundle analysis completed"

# Copy bundle analysis files if they exist
if [ -f "dist/bundle-analysis.html" ]; then
    cp dist/bundle-analysis.html ../performance-baseline/
fi

if [ -f "dist/bundle-size-report.json" ]; then
    cp dist/bundle-size-report.json ../performance-baseline/
fi

echo "🖥️  Starting application services..."

# Start backend
cd ../backend
npm start &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend preview
cd ../frontend
npm run preview &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 15

# Function to check if service is ready
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $name is ready"
            return 0
        fi
        echo "⏳ Waiting for $name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $name failed to start"
    return 1
}

# Check if services are ready
check_service "http://localhost:5000/api/health" "Backend"
check_service "http://localhost:3000" "Frontend" || check_service "http://localhost:4173" "Frontend"

echo "📡 Collecting API performance metrics..."

# Collect public API metrics (no auth required)
curl -s "http://localhost:5000/api/health" > ../performance-baseline/health-check.json || echo "Health check failed"

# Try to collect Web Vitals summary (public endpoint)
curl -s "http://localhost:5000/api/analytics/web-vitals/summary" > ../performance-baseline/webvitals-summary.json || echo "Web Vitals collection failed"

echo "🗄️  Collecting database metrics..."

# Note: These endpoints require authentication, so they may fail in automated collection
# They should be run manually with proper authentication for complete baseline

curl -s "http://localhost:5000/api/admin/performance/latency" > ../performance-baseline/api-latency.json 2>/dev/null || echo "API latency collection requires authentication"

curl -s "http://localhost:5000/api/admin/performance/database/profile" > ../performance-baseline/database-profile.json 2>/dev/null || echo "Database profile collection requires authentication"

echo "🧹 Cleaning up services..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || echo "Services already stopped"

# Wait a moment for cleanup
sleep 2

echo "📋 Generating baseline report..."

# Create a comprehensive baseline report
cat > ../performance-baseline/baseline-report.md << 'EOF'
# Performance Baseline Report

Generated on: $(date)
Application Version: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## Files Generated

1. **lighthouse-results.txt** - Lighthouse performance test results
2. **bundle-analysis.txt** - Bundle size analysis and recommendations
3. **bundle-analysis.html** - Visual bundle analysis (if available)
4. **bundle-size-report.json** - Detailed bundle size metrics
5. **webvitals-summary.json** - Web Vitals summary data
6. **health-check.json** - Application health status
7. **api-latency.json** - API latency metrics (requires auth)
8. **database-profile.json** - Database performance profile (requires auth)

## Next Steps

1. Review all generated files for baseline metrics
2. Update PERF_BASELINE.md with actual measurements
3. Set up performance budgets based on baseline data
4. Configure monitoring and alerting thresholds
5. Run authenticated endpoints manually to complete baseline

## Manual Commands for Authenticated Endpoints

```bash
# Get authentication token first
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | \
  jq -r '.token')

# Collect API latency metrics
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/latency > api-latency-auth.json

# Collect database profile
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/performance/database/profile > database-profile-auth.json
```

EOF

# Replace the placeholder date with actual date
sed -i "s/\$(date)/$(date)/" ../performance-baseline/baseline-report.md 2>/dev/null || \
    sed -i '' "s/\$(date)/$(date)/" ../performance-baseline/baseline-report.md 2>/dev/null || \
    echo "Date replacement failed, please update manually"

echo "✅ Performance baseline collection complete!"
echo ""
echo "📁 Results saved to: performance-baseline/"
echo ""
echo "📋 Generated files:"
ls -la ../performance-baseline/
echo ""
echo "📖 Next steps:"
echo "1. Review baseline-report.md for details"
echo "2. Update PERF_BASELINE.md with actual measurements"
echo "3. Run authenticated endpoints manually if needed"
echo "4. Set up performance monitoring based on baseline data"
echo ""
echo "🎯 Performance optimization targets:"
echo "- Lighthouse Performance ≥ 90 (desktop)"
echo "- LCP improvement: 30% from baseline"
echo "- API P95 latency: 30% improvement"
echo "- Bundle size reduction: 20% from baseline"