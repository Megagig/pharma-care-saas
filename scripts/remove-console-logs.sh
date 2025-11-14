#!/bin/bash

# Script to remove console.log statements from production code
# Preserves console.error, console.warn, console.info for error handling
# Excludes test files, debug utilities, and development tools

echo "🔍 Removing console.log statements from production code..."

# Directories to clean (production code only)
DIRS=(
  "frontend/src/services"
  "frontend/src/components"
  "frontend/src/pages"
  "frontend/src/hooks"
  "frontend/src/context"
  "frontend/src/contexts"
  "frontend/src/modules"
)

# Files to exclude (debug/test utilities)
EXCLUDE_PATTERNS=(
  "*test*"
  "*Test*"
  "*debug*"
  "*Debug*"
  "*authDebug*"
  "*authTest*"
  "*debugWorkspace*"
  "*rbacTestSuite*"
  "*queryDevtools*"
  "*/debug/*"
  "*/__tests__/*"
  "*/tests/*"
)

# Counter
TOTAL_REMOVED=0

# Function to check if file should be excluded
should_exclude() {
  local file=$1
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ $file == $pattern ]]; then
      return 0
    fi
  done
  return 1
}

# Process each directory
for dir in "${DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "⚠️  Directory not found: $dir"
    continue
  fi
  
  echo "📁 Processing: $dir"
  
  # Find all TypeScript/JavaScript files
  while IFS= read -r file; do
    # Skip if file should be excluded
    if should_exclude "$file"; then
      continue
    fi
    
    # Count console.log occurrences before
    BEFORE=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
    
    if [ "$BEFORE" -gt 0 ]; then
      echo "  🔧 Cleaning: $file ($BEFORE console.log found)"
      
      # Remove console.log statements (various patterns)
      # Pattern 1: Single line console.log
      sed -i '/^\s*console\.log(/d' "$file"
      
      # Pattern 2: console.log with semicolon
      sed -i 's/console\.log([^;]*);*//g' "$file"
      
      # Count after
      AFTER=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
      REMOVED=$((BEFORE - AFTER))
      TOTAL_REMOVED=$((TOTAL_REMOVED + REMOVED))
      
      if [ "$AFTER" -gt 0 ]; then
        echo "  ⚠️  Warning: $AFTER console.log statements remain (multiline or complex)"
      fi
    fi
  done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null)
done

echo ""
echo "✅ Cleanup complete!"
echo "📊 Total console.log statements removed: $TOTAL_REMOVED"
echo ""
echo "⚠️  Note: Some complex multiline console.log statements may remain."
echo "   Please review manually if needed."
echo ""
echo "🔍 To find remaining console.log statements:"
echo "   grep -r 'console\.log' frontend/src --include='*.ts' --include='*.tsx'"

