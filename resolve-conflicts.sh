#!/bin/bash

# Script to resolve merge conflicts by accepting develop branch changes
# This keeps the most recent changes from the develop branch

echo "=== Merge Conflict Resolution Helper ==="
echo "Total conflicted files: $(git status --porcelain | grep "^UU" | wc -l)"

# Function to resolve conflicts by accepting develop branch version
resolve_conflict_accept_develop() {
    local file="$1"
    echo "Resolving conflict in: $file (accepting develop branch)"
    
    # Check if file exists and has conflicts
    if [[ -f "$file" ]] && grep -q "<<<<<<< HEAD" "$file"; then
        # Create a backup
        cp "$file" "${file}.backup"
        
        # Use git checkout to accept the develop branch version
        git checkout --theirs "$file"
        
        echo "✓ Resolved: $file (kept develop branch version)"
        git add "$file"
    else
        echo "⚠ No conflicts found in: $file"
    fi
}

# Function to show conflict summary
show_conflict_summary() {
    echo ""
    echo "=== Conflict Summary by Category ==="
    
    echo "📁 Configuration files:"
    git status --porcelain | grep "^UU" | grep -E "\.(env|yml|yaml|json|conf)$" | wc -l
    
    echo "📄 Documentation files:"
    git status --porcelain | grep "^UU" | grep -E "\.md$" | wc -l
    
    echo "🔧 TypeScript/JavaScript files:"
    git status --porcelain | grep "^UU" | grep -E "\.(ts|tsx|js|jsx)$" | wc -l
    
    echo "🎨 Frontend files:"
    git status --porcelain | grep "^UU" | grep "frontend/" | wc -l
    
    echo "⚙️ Backend files:"
    git status --porcelain | grep "^UU" | grep "backend/" | wc -l
    
    echo "🚀 Deployment files:"
    git status --porcelain | grep "^UU" | grep -E "(deployment/|scripts/|docker)" | wc -l
}

# Function to resolve all conflicts by keeping develop branch version
resolve_all_conflicts() {
    echo "Starting automatic conflict resolution (accepting develop branch)..."
    
    # Get list of conflicted files
    conflicted_files=$(git status --porcelain | grep "^UU" | cut -c4-)
    
    for file in $conflicted_files; do
        resolve_conflict_accept_develop "$file"
    done
    
    # Handle the special case of deleted file
    if git status --porcelain | grep -q "DU frontend/src/pages/NewPricing.tsx"; then
        echo "Handling deleted file: frontend/src/pages/NewPricing.tsx"
        git rm frontend/src/pages/NewPricing.tsx
        echo "✓ Removed: frontend/src/pages/NewPricing.tsx (as per develop branch)"
    fi
    
    echo ""
    echo "=== Resolution Complete ==="
    echo "Remaining conflicts: $(git status --porcelain | grep "^UU" | wc -l)"
}

# Show menu
echo ""
echo "Choose an option:"
echo "1) Show conflict summary"
echo "2) Resolve all conflicts (accept develop branch changes)"
echo "3) Exit"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        show_conflict_summary
        ;;
    2)
        resolve_all_conflicts
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac