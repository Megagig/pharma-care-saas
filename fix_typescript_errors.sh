#!/bin/bash

# Fix typescript errors in drugInfoApi.ts
sed -i 's/data?: any;/data?: unknown;/g' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts
sed -i 's/headers?: any;/headers?: Record<string, string>;/g' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts
sed -i 's/request?: any;/request?: unknown;/g' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts

# Fix the r: any specific to line 369
sed -i '369s/(r: any)/(r: Record<string, any>)/' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts

# Fix endpointError: any at line 392
sed -i '392s/endpointError: any/endpointError: Error/' /home/megagig/PROJECTS/MERN/pharma-care-saas/frontend/src/services/drugInfoApi.ts

echo "Fixed TypeScript errors in drugInfoApi.ts"
