require('dotenv').config();

console.log('🔍 Environment Variable Test');
console.log('============================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
console.log('OPENROUTER_API_KEY length:', process.env.OPENROUTER_API_KEY?.length || 0);
console.log('OPENROUTER_API_KEY prefix:', process.env.OPENROUTER_API_KEY?.substring(0, 15) || 'none');

// Check all environment variables that contain "OPENROUTER"
console.log('\nAll OPENROUTER related env vars:');
Object.keys(process.env).forEach(key => {
    if (key.includes('OPENROUTER')) {
        console.log(`${key}:`, process.env[key]?.substring(0, 20) + '...');
    }
});

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
console.log('\n.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const openrouterLines = envContent.split('\n').filter(line => line.includes('OPENROUTER'));
    console.log('OPENROUTER lines in .env:', openrouterLines);
}