const fs = require('fs');
const filePath = './src/pages/EnhancedUserManagement.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace Grid item with Grid size prop (MUI v7 compatible)
content = content.replace(/<Grid item xs=/g, '<Grid size={{ xs: ');
content = content.replace(/ sm=/g, ', sm: ');
content = content.replace(/ md=/g, ', md: ');
content = content.replace(/>/g, (match, offset) => {
  // Check if this is closing a Grid tag with size prop
  const before = content.substring(Math.max(0, offset - 100), offset);
  if (before.includes('<Grid size={{')) {
    return ' }}>'; 
  }
  return match;
});

fs.writeFileSync(filePath, content);
console.log('Grid props fixed');
