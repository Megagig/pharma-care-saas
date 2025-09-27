#!/usr/bin/env node

// Simple memory monitoring script
const monitorMemory = () => {
  const used = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  console.log(`Memory Usage:
    RSS: ${formatMB(used.rss)} MB (Resident Set Size)
    Heap Used: ${formatMB(used.heapUsed)} MB
    Heap Total: ${formatMB(used.heapTotal)} MB
    External: ${formatMB(used.external)} MB
    Array Buffers: ${formatMB(used.arrayBuffers)} MB
  `);
  
  // Alert if memory usage is high
  const heapUsedMB = formatMB(used.heapUsed);
  if (heapUsedMB > 100) {
    console.log(`⚠️ High memory usage detected: ${heapUsedMB} MB`);
  }
};

// Monitor memory every 10 seconds
console.log('Starting memory monitoring...');
setInterval(monitorMemory, 10000);

// Initial reading
monitorMemory();