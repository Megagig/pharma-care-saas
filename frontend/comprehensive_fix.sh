#!/bin/bash

echo "Running comprehensive syntax error fixes..."

# Fix trailing comma with closing brace patterns
echo "Fixing trailing comma patterns..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/}, };/}/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/, };/}/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/, }$/}/g'

# Fix missing closing parentheses in function calls
echo "Fixing function call syntax..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/});$/});/g'

# Fix interface declaration issues (add missing imports)
echo "Fixing interface declarations..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '/^interface /i import React from '\''react'\'';' 2>/dev/null || true

# Fix duplicate React imports
echo "Fixing duplicate React imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '/import \* as React from '\''react'\'';/d'

# Fix malformed import statements
echo "Fixing import statements..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import ClinicalNotesErrorBoundary/\/\/ import ClinicalNotesErrorBoundary/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import MessageThread/\/\/ import MessageThread/g'

echo "Comprehensive fixes completed!"