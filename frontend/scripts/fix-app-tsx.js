#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixAppTsx() {
  const filePath = path.join(__dirname, '..', 'src', 'App.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('App.tsx not found');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the specific pattern: </ProtectedRoute>} followed by }
  content = content.replace(/(<\/ProtectedRoute>)\s*}\s*}\s*\/>/g, '$1\n                          }\n                        />');
  
  // Fix any remaining double closing braces
  content = content.replace(/}\s*}\s*\/>/g, '}\n                        />');
  
  // Fix any remaining patterns with extra braces
  content = content.replace(/}\s*}\s*$/gm, '}');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed App.tsx syntax issues');
}

fixAppTsx();