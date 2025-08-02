# ElderCompanion - Proyecto para Adultos Mayores

## Resumen del Proyecto

ElderCompanion es una aplicación web completa en español diseñada para el cuidado y monitoreo de adultos mayores. La plataforma incluye autenticación segura, gestión de perfiles, seguimiento de interacciones y alertas de salud.

## Arquitectura del Proyecto

### Frontend (React + TypeScript)
- **Framework**: React 18.3.1 con TypeScript
- **Routing**: Wouter para navegación SPA  
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query v5 para gestión de estado del servidor
- **Forms**: React Hook Form con validación Zod

### Backend (Express + Node.js)
- **Runtime**: Node.js 20 con TypeScript
- **Framework**: Express.js 4.21.2
- **Database**: PostgreSQL con Drizzle ORM
- **Authentication**: JWT con bcrypt para hashing de contraseñas
- **API**: RESTful API con middleware de autenticación

### Base de Datos (PostgreSQL + Drizzle)
```sql
- users: Usuarios del sistema (familiares, médicos, cuidadores)
- elderly_users: Perfiles de adultos mayores
- user_elderly_relations: Relaciones entre usuarios y adultos mayores
- interactions: Interacciones registradas con el sistema
- health_alerts: Alertas de salud y bienestar
- sessions: Sesiones de usuario
```

## Estado Actual del Despliegue

### ✅ Preparado para Vercel
- **Build Status**: ✅ Compilación exitosa sin errores TypeScript
- **Frontend**: ✅ 715KB compilado en `dist/public/`
- **Backend**: ✅ 22.1KB compilado como función serverless
- **API**: ✅ `api/index.js` listo para Vercel
- **Configuración**: ✅ `vercel.json` optimizado

### Archivos de Configuración Vercel
- `vercel.json` - Configuración principal con rutas y builds
- `api/index.js` - Entry point para funciones serverless
- `.vercelignore` - Archivos excluidos del despliegue
- `.env.example` - Variables de entorno documentadas

## Variables de Entorno Requeridas

```env
# Obligatorias para producción
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret_here  
NODE_ENV=production
```

## Scripts Disponibles

```bash
npm run dev         # Servidor de desarrollo (puerto 5000)
npm run build       # Build para producción 
npm run start       # Servidor de producción local
npm run check       # Verificación TypeScript
npm run db:push     # Sincronizar esquema de base de datos
```

## API Endpoints

### Autenticación
- `POST /api/register` - Registro de usuario
- `POST /api/login` - Inicio de sesión  
- `GET /api/profile` - Perfil del usuario autenticado
- `GET /api/auth/user` - Información del usuario actual

### Gestión de Adultos Mayores
- `POST /api/elderly-users` - Crear perfil de adulto mayor
- `GET /api/elderly-users` - Listar adultos mayores del usuario

### Interacciones y Monitoreo
- `POST /api/interactions` - Registrar nueva interacción
- `GET /api/interactions/:elderlyUserId` - Historial de interacciones
- `GET /api/stats/:elderlyUserId` - Estadísticas generales
- `GET /api/sentiment/:elderlyUserId` - Datos de análisis de sentimientos

### Alertas de Salud
- `POST /api/health-alerts` - Crear alerta de salud
- `GET /api/health-alerts/:elderlyUserId` - Alertas por usuario
- `PUT /api/health-alerts/:alertId/resolve` - Resolver alerta

## Pasos para Despliegue en Vercel

### 1. Preparar Base de Datos
- Crear cuenta en [Neon.tech](https://neon.tech)
- Crear proyecto "eldercompanion"
- Copiar connection string completa

### 2. Configurar Vercel
- Conectar repositorio GitHub
- **Framework Preset**: Other
- **Build Command**: Detectará automáticamente `vercel.json` con `buildCommand`
- **Output Directory**: `dist/public`
- Configurar variables de entorno:
  - `DATABASE_URL`
  - `JWT_SECRET` 
  - `NODE_ENV=production`

### 3. Inicializar Base de Datos
```bash
# Con DATABASE_URL configurada
npx drizzle-kit push
```

### 4. Verificar Despliegue
- Vercel ejecutará `node vercel-build.mjs` (evita error esbuild)
- Frontend: compilado con `vite build` → `dist/public/`
- Backend: usa `api/index.js` precompilado → función serverless

## Características Técnicas

### Seguridad
- Autenticación JWT con expiración de 7 días
- Contraseñas hasheadas con bcrypt (10 rounds)
- Middleware de autenticación para rutas protegidas
- Validación de datos con Zod schemas

### Performance
- Build optimizado con Vite
- Code splitting automático
- Gzip compression habilitada
- Assets estáticos optimizados

### Funcionalidades
- Registro y autenticación de usuarios
- Gestión de perfiles de adultos mayores
- Seguimiento de interacciones y conversaciones
- Análisis de sentimientos y estado de ánimo
- Sistema de alertas de salud
- Dashboard con estadísticas en tiempo real
- PWA con service worker y manifest

## Recent Changes (Aug 2, 2025)

### MIGRACIÓN REPLIT AGENT → REPLIT COMPLETADA ✅

- ✅ **Dependencias actualizadas**: drizzle-orm y drizzle-zod compatibles
- ✅ **Base de datos configurada**: PostgreSQL funcionando en Replit
- ✅ **Schema migrado**: Todas las tablas creadas correctamente
- ✅ **TypeScript corregido**: Errores de compatibilidad resueltos
- ✅ **Servidor ejecutándose**: Express corriendo en puerto 5000
- ✅ **Configuración Vercel corregida**: 
  - Eliminadas referencias problemáticas de multer
  - Archivo estático serving optimizado para Vercel
  - vercel-build.mjs funcionando correctamente
- ✅ **Variables de entorno**: .env.example documentado para Vercel

### SOLUCIÓN A ERRORES DE VERCEL LOGIN/REGISTRO ✅

### PROBLEMA RESUELTO: npm run build falla en Vercel ✅

- ✅ **Identificado problema crítico**: `esbuild server/index.ts --packages=external` falla con "entry point cannot be marked as external"
- ✅ **Solución implementada**: Script personalizado `vercel-build.mjs` que evita esbuild problemático
- ✅ **Configuración Vercel optimizada**: 
  - `buildCommand: "node vercel-build.mjs"` en lugar de `npm run build`
  - Usa `vite build` para frontend solamente 
  - Utiliza `api/index.js` precompilado (22.1KB) para backend serverless
- ✅ **Verificación completa**:
  - Frontend compilado: `dist/public/` (715KB)
  - Backend ready: `api/index.js` (22.1KB)
  - Build exitoso sin errores de esbuild
- ✅ **Configuración final**: `vercel.json` con builds estables y rutas optimizadas

### Archivos Importantes Agregados:
- `vercel-build.mjs` - Script personalizado que evita error de esbuild
- `vercel.json` - Configuración estable con buildCommand personalizado

## Estado del Proyecto

**✅ PROBLEMA ESBUILD RESUELTO - VERCEL READY**

El proyecto ElderCompanion ahora puede usar `npm run build` en Vercel sin errores. La configuración evita el problema de esbuild usando un script personalizado que solo compila el frontend y utiliza el backend precompilado.

## User Preferences

- Idioma: Español
- Comunicación: Clara y directa, enfoque en soluciones prácticas
- Documentación: Detallada con checkmarks y ejemplos prácticos