#!/usr/bin/env node
const { execNodeScript, execCdk } = require('./shell-utils');

/**
 * Smart deployment script that:
 * 1. Runs verify-image.js to check if 'latest' image exists
 * 2. Calculates desiredCount (1 if image exists, 0 otherwise)
 * 3. Passes desiredCount to CDK via context parameter
 */

console.log('🚀 Starting deployment...\n');

// Run verify-image.js and capture its JSON output
let imageExists = false;
try {
  // verify-image.js outputs JSON on the last line
  const verifyImageOutput = execNodeScript('scripts/verify-image.js');

  // Extract imageExists value from JSON output (it's the last line)
  const lines = verifyImageOutput.trim().split('\n');
  const jsonLine = lines[lines.length - 1];
  const jsonParsed = JSON.parse(jsonLine);
  imageExists = jsonParsed.imageExists;

  console.log(
    `Image detection: ${imageExists ? '✅ Found' : '❌ Not found'}\n`
  );
} catch (error) {
  console.error('Failed to verify image:', error.message);
  process.exit(1);
}

// Calculate desiredCount based on image existence
// 1 task is sufficient because:
//   - ALB distributes traffic across availability zones by default
//   - VPC Link is properly configured (Web tier subnets only)
//   - Easier debugging and lower resource usage for dev/uat environments
// Can be scaled up for production HA when needed
// 0 tasks if no image exists (infrastructure only)
const desiredCount = imageExists ? 1 : 0;

// Run CDK deploy with desiredCount as context parameter
console.log(`📦 Running CDK deploy with desiredCount=${desiredCount}...\n`);
execCdk([
  'deploy',
  '--all',
  '--require-approval',
  'never',
  '-c',
  `desiredCount=${desiredCount}`,
]);

console.log('\n✅ Deployment complete!');
if (!imageExists) {
  console.log('\nℹ️  No tasks running (no image found)');
  console.log('   To start tasks:');
  console.log('   1. Build and push image: nx run api-app:push:image');
  console.log('   2. Redeploy: nx run infra-app:deploy');
}
