#!/usr/bin/env node

// Script para arreglar package.json temporalmente en Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Arreglando comando esbuild para npm run build...');

try {
  // Leer package.json
  const packagePath = path.join(__dirname, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Backup del comando original
  const originalBuild = packageData.scripts.build;
  console.log('Original:', originalBuild);
  
  // Solo cambiar si tiene el comando esbuild problemático
  if (originalBuild.includes('esbuild') && originalBuild.includes('--packages=external')) {
    packageData.scripts.build = "vite build";
    console.log('Nuevo:', packageData.scripts.build);
    
    // Escribir el archivo modificado
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
    console.log('✅ Script modificado temporalmente para evitar error de esbuild');
  } else {
    console.log('✅ Script ya está correcto o no necesita cambios');
  }
  
  console.log('✅ package.json modificado temporalmente para evitar error de esbuild');
  
} catch (error) {
  console.error('❌ Error al modificar package.json:', error.message);
  process.exit(1);
}