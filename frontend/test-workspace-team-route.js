/**
 * Test script to verify workspace team route configuration
 * This script checks that the route is properly configured with the correct protection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Workspace Team Route Configuration...\n');

// Read App.tsx
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');

// Test 1: Check if LazyWorkspaceTeam is imported
console.log('Test 1: Checking LazyWorkspaceTeam import...');
const hasLazyImport = appTsxContent.includes('LazyWorkspaceTeam');
if (hasLazyImport) {
  console.log('✅ LazyWorkspaceTeam is imported in App.tsx');
} else {
  console.log('❌ LazyWorkspaceTeam is NOT imported in App.tsx');
  process.exit(1);
}

// Test 2: Check if route exists
console.log('\nTest 2: Checking /workspace/team route...');
const hasRoute = appTsxContent.includes('path="/workspace/team"');
if (hasRoute) {
  console.log('✅ /workspace/team route exists');
} else {
  console.log('❌ /workspace/team route does NOT exist');
  process.exit(1);
}

// Test 3: Check if route has pharmacy_outlet role protection
console.log('\nTest 3: Checking pharmacy_outlet role protection...');
const routeSection = appTsxContent.match(/path="\/workspace\/team"[\s\S]{0,500}\/>/);
if (routeSection) {
  const hasRoleProtection = routeSection[0].includes('requiredRole="pharmacy_outlet"');
  if (hasRoleProtection) {
    console.log('✅ Route is protected with pharmacy_outlet role');
  } else {
    console.log('❌ Route is NOT protected with pharmacy_outlet role');
    process.exit(1);
  }
} else {
  console.log('❌ Could not find route section');
  process.exit(1);
}

// Test 4: Check if route requires active subscription
console.log('\nTest 4: Checking subscription requirement...');
if (routeSection) {
  const hasSubscriptionProtection = routeSection[0].includes('requiresActiveSubscription');
  if (hasSubscriptionProtection) {
    console.log('✅ Route requires active subscription');
  } else {
    console.log('❌ Route does NOT require active subscription');
    process.exit(1);
  }
}

// Test 5: Check if LazyWorkspaceTeam is exported from LazyComponents
console.log('\nTest 5: Checking LazyComponents export...');
const lazyComponentsPath = path.join(__dirname, 'src', 'components', 'LazyComponents.tsx');
const lazyComponentsContent = fs.readFileSync(lazyComponentsPath, 'utf-8');
const hasExport = lazyComponentsContent.includes("export const LazyWorkspaceTeam = lazy(() => import('../pages/workspace/WorkspaceTeam'))");
if (hasExport) {
  console.log('✅ LazyWorkspaceTeam is properly exported from LazyComponents');
} else {
  console.log('❌ LazyWorkspaceTeam is NOT properly exported from LazyComponents');
  process.exit(1);
}

// Test 6: Check if WorkspaceTeam page exists
console.log('\nTest 6: Checking WorkspaceTeam page existence...');
const workspaceTeamPath = path.join(__dirname, 'src', 'pages', 'workspace', 'WorkspaceTeam.tsx');
if (fs.existsSync(workspaceTeamPath)) {
  console.log('✅ WorkspaceTeam page exists at correct path');
} else {
  console.log('❌ WorkspaceTeam page does NOT exist');
  process.exit(1);
}

console.log('\n✅ All tests passed! Route is properly configured.\n');
console.log('Summary:');
console.log('- Route: /workspace/team');
console.log('- Protection: pharmacy_outlet role required');
console.log('- Subscription: Active subscription required');
console.log('- Component: LazyWorkspaceTeam (lazy loaded)');
console.log('- Access Control: Only workspace owners can access');
