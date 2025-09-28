#!/bin/bash

echo "🔧 Fixing Git large files issue..."

# Step 1: Remove the large log files from Git tracking (but keep them locally)
echo "📝 Removing log files from Git tracking..."
git rm --cached backend/logs/error.log 2>/dev/null || echo "error.log not in index"
git rm --cached backend/logs/combined.log 2>/dev/null || echo "combined.log not in index"
git rm --cached -r backend/logs/ 2>/dev/null || echo "logs directory not in index"

# Step 2: Remove any log files that might be tracked
echo "🧹 Cleaning up any tracked log files..."
git rm --cached -r backend/logs/*.log 2>/dev/null || echo "No .log files in index"
git rm --cached -r frontend/logs/*.log 2>/dev/null || echo "No frontend log files in index"

# Step 3: Add the updated .gitignore
echo "📋 Adding updated .gitignore..."
git add .gitignore

# Step 4: Commit the changes
echo "💾 Committing the changes..."
git commit -m "Remove large log files from tracking and update .gitignore

- Remove backend/logs/error.log (74.50 MB)
- Remove backend/logs/combined.log (102.61 MB)
- Add comprehensive .gitignore rules for log files
- Prevent future log files from being tracked"

echo "✅ Git cleanup complete!"
echo ""
echo "🚀 You can now push your changes:"
echo "   git push"
echo ""
echo "📁 Note: Log files are still on your local machine, just not tracked by Git anymore."