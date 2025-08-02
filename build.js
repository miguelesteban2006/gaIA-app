#!/usr/bin/env node
import { execSync } from 'child_process';

// Build frontend with Vite
console.log('Building frontend...');
execSync('vite build', { stdio: 'inherit' });

// Copy the pre-built API file
console.log('Using pre-built API file...');
console.log('Build completed successfully!');
