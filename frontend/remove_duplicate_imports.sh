#!/bin/bash

echo "Removing duplicate React imports..."

# Remove duplicate React imports that were added by our previous script
# This will remove lines that are exactly "import React from 'react';" when there's already a React import

# Function to remove duplicate React imports from a file
remove_duplicate_react_imports() {
    local file="$1"
    if [ -f "$file" ]; then
        # Count React imports
        react_import_count=$(grep -c "import.*React.*from.*'react'" "$file" 2>/dev/null || echo "0")
        
        if [ "$react_import_count" -gt 1 ]; then
            echo "Fixing duplicate React imports in: $file"
            # Remove standalone "import React from 'react';" lines, keeping the first comprehensive import
            sed -i '/^import React from '\''react'\'';$/d' "$file"
        fi
    fi
}

# Process all TypeScript and TSX files
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    remove_duplicate_react_imports "$file"
done

echo "Duplicate React imports removed!"