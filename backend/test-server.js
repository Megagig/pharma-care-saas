#!/usr/bin/env node

// Simple test to check if the server can start without Redis
const { spawn } = require('child_process');

console.log('Testing backend server startup without Redis...');

const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'pipe',
  env: {
    ...process.env,
    DISABLE_BACKGROUND_JOBS: 'true',
    DISABLE_PERFORMANCE_JOBS: 'true',
    CACHE_PROVIDER: 'memory'
  }
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('STDOUT:', text);
  
  // Check if server started successfully
  if (text.includes('Server running on port')) {
    console.log('✅ Server started successfully!');
    server.kill('SIGTERM');
    process.exit(0);
  }
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.log('STDERR:', text);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  
  if (code === 0) {
    console.log('✅ Test passed - server can start without Redis');
  } else {
    console.log('❌ Test failed - server crashed');
    console.log('Error output:', errorOutput);
  }
  
  process.exit(code);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('❌ Test timed out');
  server.kill('SIGKILL');
  process.exit(1);
}, 30000);