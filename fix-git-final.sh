#!/bin/bash

echo "🔧 Final Git fix - handling stale info error..."

echo "📥 Step 1: Fetching latest changes from remote..."
git fetch origin

echo "📊 Step 2: Checking current status..."
git status

echo "🔍 Step 3: Checking what's different between local and remote..."
git log --oneline origin/feature/Project-Optimization..HEAD

echo ""
echo "🤔 The remote branch has changes that conflict with our history rewrite."
echo "We have a few options:"
echo ""
echo "Option 1: Force push (overwrites remote - use if you're sure)"
echo "   git push --force origin feature/Project-Optimization"
echo ""
echo "Option 2: Create a new clean branch"
echo "   git checkout -b feature/Project-Optimization-clean"
echo "   git push origin feature/Project-Optimization-clean"
echo ""
echo "Option 3: Reset and try a different approach"
echo ""
echo "Which option would you like? (1/2/3)"
read -r choice

case $choice in
    1)
        echo "⚠️  WARNING: This will overwrite the remote branch!"
        echo "Are you absolutely sure? (type 'YES' to confirm)"
        read -r confirm
        if [[ "$confirm" == "YES" ]]; then
            echo "🚀 Force pushing..."
            git push --force origin feature/Project-Optimization
            echo "✅ Done! The remote branch has been overwritten."
        else
            echo "❌ Aborted."
        fi
        ;;
    2)
        echo "🌿 Creating new clean branch..."
        git checkout -b feature/Project-Optimization-clean
        git push origin feature/Project-Optimization-clean
        echo "✅ New clean branch created: feature/Project-Optimization-clean"
        echo "You can now create a PR from this branch instead."
        ;;
    3)
        echo "🔄 Let's try a different approach..."
        echo "First, let's restore the original branch:"
        git fetch origin
        git reset --hard origin/feature/Project-Optimization
        
        echo "Now let's remove just the large files without rewriting history:"
        
        # Remove the actual files
        rm -rf backend/logs/
        
        # Commit the removal
        git add -A
        git commit -m "Remove large log files and add .gitignore

- Delete backend/logs/ directory with large files
- Add comprehensive .gitignore to prevent future log tracking
- This removes the files without rewriting Git history"
        
        echo "🚀 Now try pushing:"
        git push origin feature/Project-Optimization
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac