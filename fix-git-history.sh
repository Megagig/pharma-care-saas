#!/bin/bash

echo "🔧 Fixing Git history to remove large log files..."
echo "⚠️  WARNING: This will rewrite Git history. Make sure you have a backup!"
echo ""

# Check if git filter-repo is available
if ! command -v git-filter-repo &> /dev/null; then
    echo "📦 Installing git-filter-repo..."
    
    # Try to install git-filter-repo
    if command -v pip3 &> /dev/null; then
        pip3 install git-filter-repo
    elif command -v pip &> /dev/null; then
        pip install git-filter-repo
    else
        echo "❌ Could not install git-filter-repo. Please install it manually:"
        echo "   pip install git-filter-repo"
        echo "   or"
        echo "   sudo apt-get install git-filter-repo"
        echo ""
        echo "🔄 Using git filter-branch as fallback (slower but works)..."
        
        # Fallback to git filter-branch
        echo "🗑️  Removing large log files from Git history..."
        git filter-branch --force --index-filter \
            'git rm --cached --ignore-unmatch backend/logs/error.log backend/logs/combined.log backend/logs/*.log' \
            --prune-empty --tag-name-filter cat -- --all
        
        echo "🧹 Cleaning up Git references..."
        rm -rf .git/refs/original/
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        
        echo "✅ History cleanup complete using git filter-branch!"
        echo ""
        echo "🚀 Now you can force push:"
        echo "   git push --force-with-lease origin feature/Project-Optimization"
        exit 0
    fi
fi

echo "🗑️  Using git-filter-repo to remove large log files from history..."

# Remove the problematic files from entire Git history
git filter-repo --path backend/logs/error.log --invert-paths
git filter-repo --path backend/logs/combined.log --invert-paths
git filter-repo --path backend/logs/ --invert-paths

echo "✅ History cleanup complete!"
echo ""
echo "🚀 Now you can force push:"
echo "   git push --force-with-lease origin feature/Project-Optimization"
echo ""
echo "⚠️  Note: This has rewritten your Git history. All collaborators will need to:"
echo "   git fetch origin"
echo "   git reset --hard origin/feature/Project-Optimization"