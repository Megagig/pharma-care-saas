#!/bin/bash

echo "Fixing remaining syntax errors..."

# Fix remaining trailing comma issues
echo "Fixing trailing comma issues..."

# Fix PharmacyUserManagement.tsx
sed -i 's/}, };/}/' src/pages/PharmacyUserManagement.tsx

# Fix DiagnosticModule.tsx
sed -i 's/}, };/}/' src/components/DiagnosticModule.tsx

# Fix ComponentDemo.tsx - this one needs special handling
sed -i 's/allergies: \[\] };/allergies: []/' src/modules/diagnostics/pages/ComponentDemo.tsx

# Fix LicenseUpload.tsx
sed -i 's/duration: 5000, };/duration: 5000/' src/components/license/LicenseUpload.tsx

# Fix AdminDashboard.tsx
sed -i 's/...filters, };/...filters/' src/components/admin/AdminDashboard.tsx

# Fix SubscriptionManagement.tsx JSX issues
sed -i 's/primary={}/className="font-medium"/' src/pages/SubscriptionManagement.tsx

# Fix DrugSearch.tsx JSX closing tags
sed -i 's/<\/List>/<\/div>/' src/components/DrugSearch.tsx

echo "Syntax errors fixed!"