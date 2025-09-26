#!/bin/bash

echo "🔧 Fixing all syntax errors in React/TypeScript files..."

# Fix missing React imports
echo "📦 Adding missing React imports..."
find src -name "*.tsx" -exec grep -L "import React" {} \; | while read file; do
    if grep -q "useState\|useEffect\|useCallback\|useMemo\|useRef" "$file"; then
        echo "Adding React import to $file"
        sed -i '1i import React from '\''react'\'';' "$file"
    fi
done

# Fix interface declarations - add proper syntax
echo "🔧 Fixing interface declarations..."
find src -name "*.tsx" -name "*.ts" -exec sed -i 's/^interface /export interface /g' {} \;

# Fix missing import statements
echo "📦 Fixing missing import statements..."
find src -name "*.tsx" -name "*.ts" -exec sed -i '/^  [a-zA-Z]/s/^/import { /' {} \;
find src -name "*.tsx" -name "*.ts" -exec sed -i '/^import { .*[^}]$/s/$/} from '\''react'\'';/' {} \;

# Fix object syntax - missing closing braces
echo "🔧 Fixing object syntax..."
find src -name "*.tsx" -name "*.ts" -exec sed -i 's/});$/});/g' {} \;
find src -name "*.tsx" -name "*.ts" -exec sed -i 's/}$/});/g' {} \;

# Fix JSX syntax errors
echo "🎨 Fixing JSX syntax errors..."
find src -name "*.tsx" -exec sed -i 's/>{/>{'\''{'\''}/'g {} \;
find src -name "*.tsx" -exec sed -i 's/>}/>{'\''}'\''}/'g {} \;

# Fix missing semicolons
echo "🔧 Adding missing semicolons..."
find src -name "*.tsx" -name "*.ts" -exec sed -i 's/^  [a-zA-Z].*[^;]$/&;/g' {} \;

echo "✅ Syntax error fixes completed!"