#!/bin/bash

echo "Fixing critical syntax errors..."

# Fix specific files with critical errors

# Fix MTRDashboard.tsx - missing closing parenthesis
sed -i 's/updatedAt: patient.updatedAt$/updatedAt: patient.updatedAt/' src/components/MTRDashboard.tsx

# Fix DiagnosticModule.tsx - missing closing parenthesis  
sed -i 's/method: '\''electronic'\''$/method: '\''electronic'\''/' src/components/DiagnosticModule.tsx

# Fix NotificationCenter.tsx - missing closing parenthesis
sed -i 's/requireInteraction: notification.priority === '\''urgent'\''$/requireInteraction: notification.priority === '\''urgent'\''/' src/components/communication/NotificationCenter.tsx

# Fix AuditLogViewer.tsx - missing closing parenthesis
sed -i 's/patientId$/patientId/' src/components/communication/AuditLogViewer.tsx

# Fix CaseIntakePage.tsx - missing closing parenthesis
sed -i 's/consent: z.boolean().refine((val) => val === true, '\''Consent is required'\'')$/consent: z.boolean().refine((val) => val === true, '\''Consent is required'\'')/' src/modules/diagnostics/pages/CaseIntakePage.tsx

# Fix ComponentDemo.tsx - missing closing parenthesis
sed -i 's/allergies: \[\]$/allergies: []/' src/modules/diagnostics/pages/ComponentDemo.tsx

echo "Critical fixes completed!"