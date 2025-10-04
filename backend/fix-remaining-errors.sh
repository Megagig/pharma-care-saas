#!/bin/bash
# Comprehensive TypeScript Error Fixes Script

echo "Fixing cache type guards in all services..."

# Fix all cache.get() type checks to include type guards
find src/services -name "*.ts" -exec sed -i 's/if (cached) {/if (cached \&\& typeof cached === "object" \&\& Object.keys(cached).length > 0) {/g' {} \;

echo "All service cache guards fixed!"
