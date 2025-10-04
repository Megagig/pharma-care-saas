#!/bin/bash

# Script to fix cache service calls in all TypeScript service files
# Changes cache.set(key, value, ttl_number) to cache.set(key, value, { ttl: ttl_seconds })

cd /home/megagig/Desktop/PROJECTS/MERN/pharma-care-saas/backend

echo "Fixing cache service calls..."

# List of files to fix
files=(
  "src/services/NotificationService.ts"
  "src/services/SecurityMonitoringService.ts"
  "src/services/SystemAnalyticsService.ts"
  "src/services/UserManagementService.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Fix patterns like: , this.CACHE_TTL)
    sed -i 's/, this\.CACHE_TTL)/, { ttl: this.CACHE_TTL \/ 1000 })/g' "$file"
    
    # Fix patterns like: , 60 * 1000)
    sed -i 's/, \([0-9]\+\) \* 60 \* 1000)/, { ttl: \1 * 60 })/g' "$file"
    
    # Fix patterns like: , 5 * 60 * 1000)
    sed -i 's/, \([0-9]\+\) \* 60 \* 1000)/, { ttl: \1 * 60 })/g' "$file"
    
    # Fix patterns like: , 60 * 60 * 1000)
    sed -i 's/, \([0-9]\+\) \* 60 \* 60 \* 1000)/, { ttl: \1 * 3600 })/g' "$file"
    
    # Fix patterns like: , 24 * 60 * 60 * 1000)
    sed -i 's/, \([0-9]\+\) \* 60 \* 60 \* 1000)/, { ttl: \1 * 3600 })/g' "$file"
    
    # Fix simple patterns like: , 300)
    sed -i 's/cacheService\.set(\([^,]\+\), \([^,]\+\), \([0-9]\+\))/cacheService.set(\1, \2, { ttl: \3 })/g' "$file"
    
    echo "Fixed $file"
  fi
done

echo "Done fixing cache service calls!"
