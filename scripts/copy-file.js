#!/usr/bin/env node
/**
 * Copy a file from source to destination
 * Usage: node copy-file.js <source> <destination>
 */
const fs = require('node:fs');
const path = require('node:path');

const [, , source, destination] = process.argv;

if (!source || !destination) {
  console.error('Usage: node copy-file.js <source> <destination>');
  process.exit(1);
}

try {
  // Ensure destination directory exists
  const destDir = path.dirname(destination);
  fs.mkdirSync(destDir, { recursive: true });

  // Copy the file
  fs.copyFileSync(source, destination);
  console.log(`Copied ${source} → ${destination}`);
} catch (error) {
  console.error(`Error copying file: ${error.message}`);
  process.exit(1);
}
