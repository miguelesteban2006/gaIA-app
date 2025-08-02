#!/usr/bin/env node
/**
 * Custom build script for Vercel to avoid esbuild issues
 * 
 * This script builds only the frontend with Vite and uses the 
 * precompiled api/index.js for the serverless function
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Starting Vercel build process...');

try {
  // 1. Build frontend with Vite
  console.log('📦 Building frontend with Vite...');
  execSync('npx vite build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Frontend built successfully');

  // 2. Verify api/index.js exists (precompiled serverless function)
  if (existsSync('./api/index.js')) {
    console.log('✅ Backend serverless function ready: api/index.js');
  } else {
    console.warn('⚠️  Warning: api/index.js not found. Backend may not work.');
  }

  console.log('🎉 Vercel build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}