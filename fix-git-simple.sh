#!/bin/bash

echo "🔧 Simple Git history fix using filter-branch..."
echo "⚠️  This will rewrite Git history. Proceed? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo "🗑️  Removing large log files from entire Git history..."

# Remove files from all commits in history
git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch backend/logs/error.log backend/logs/combined.log backend/logs/*.log' \
    --prune-empty --tag-name-filter cat -- --all

echo "🧹 Cleaning up Git references and garbage collection..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Git history cleanup complete!"
echo ""
echo "📊 Checking repository size..."
du -sh .git/

echo ""
echo "🚀 Now force push your cleaned history:"
echo "   git push --force-with-lease origin feature/Project-Optimization"
echo ""
echo "⚠️  IMPORTANT: After force pushing, all collaborators need to run:"
echo "   git fetch origin"
echo "   git reset --hard origin/feature/Project-Optimization"