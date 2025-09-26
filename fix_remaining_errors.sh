#!/bin/bash

# Fix error with catch clause variable type
sed -i '392s/endpointError: Error/endpointError: unknown/' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts

# Fix the record type issue by using more specific types
sed -i '369s/(r: Record<string, any>)/(r: Record<string, unknown>)/' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts

echo "Fixed remaining TypeScript errors in drugInfoApi.ts"
