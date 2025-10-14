const path = require('path');
const fs = require('fs');

// Simulate what happens in the compiled code
const __dirname_dist = path.join(__dirname, 'dist');

console.log('Current directory:', __dirname);
console.log('Simulated dist directory:', __dirname_dist);
console.log('Uploads path from dist:', path.join(__dirname_dist, '../../uploads'));
console.log('Uploads path from src:', path.join(__dirname, '../uploads'));

// Check if uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
console.log('\nChecking uploads directory:', uploadsPath);
console.log('Exists:', fs.existsSync(uploadsPath));

if (fs.existsSync(uploadsPath)) {
    const avatarsPath = path.join(uploadsPath, 'avatars');
    console.log('Avatars directory:', avatarsPath);
    console.log('Exists:', fs.existsSync(avatarsPath));
    
    if (fs.existsSync(avatarsPath)) {
        const files = fs.readdirSync(avatarsPath);
        console.log('Files in avatars directory:', files);
    }
}
