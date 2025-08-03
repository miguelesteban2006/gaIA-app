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

### ✅ Funcionando en Replit
- **Build Status**: ✅ Aplicación corriendo exitosamente
- **Frontend**: ✅ Servido por Vite en desarrollo
- **Backend**: ✅ Express server corriendo en puerto 5000
- **Base de Datos**: ✅ PostgreSQL configurada y conectada
- **Configuración**: ✅ Optimizada para Replit únicamente

## Variables de Entorno Requeridas

```env
# Configuradas automáticamente en Replit
DATABASE_URL=postgresql://user:password@host:port/database
PGPORT=5432
PGUSER=replit
PGPASSWORD=auto_generated
PGDATABASE=main
PGHOST=localhost
```

## Scripts Disponibles

```bash
npm run dev         # Servidor de desarrollo (puerto 5000)
npm run build       # Build frontend con Vite
npm run start       # Servidor de producción con tsx
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

## Uso en Replit

### 1. Base de Datos
- PostgreSQL configurada automáticamente
- Variables de entorno creadas automáticamente
- Schema sincronizado con `npm run db:push`

### 2. Desarrollo
- El workflow "Start application" ejecuta `npm run dev`
- Frontend y backend corren juntos en puerto 5000
- Hot reload habilitado con Vite

### 3. Estructura del Servidor
- Express server maneja API y archivos estáticos
- Vite integrado para desarrollo
- CORS configurado para Replit

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
- ✅ **Configuración Vercel eliminada completamente**
- ✅ **Variables de entorno**: .env.example documentado

### MEJORAS POST-MIGRACIÓN ✅

- ✅ **Conectividad externa mejorada**: CORS optimizado para deployments externos
- ✅ **Dependencias Radix UI**: Todas las dependencias faltantes instaladas
- ✅ **Manejo de errores mejorado**: API requests con timeout y mejor logging
- ✅ **Configuración de entorno**: .env.example documentado para deployments
- ✅ **Compatibilidad TanStack Query**: Configuración actualizada para v5

### CONFIGURACIÓN PWA PARA MÓVILES ✅

- ✅ **Manifest.json**: Configuración completa para instalación como APK
- ✅ **Service Worker**: Funcionalidad offline y caché inteligente
- ✅ **Meta tags móviles**: Optimización para iOS/Android
- ✅ **CSS responsivo**: Estilos optimizados para dispositivos móviles
- ✅ **Iconos PWA**: SVG escalables para todas las resoluciones

### PERSONALIZACIÓN GAIA ✅

- ✅ **Nombre cambiado**: ElderCompanion → GaIA
- ✅ **Ícono personalizado**: Logo morado con figuras de cuidado
- ✅ **Tema actualizado**: Colores purple/morado en toda la app
- ✅ **Optimización móvil**: Tamaños ajustados sin cambiar diseño
- ✅ **Botones táctiles**: Mejor interacción en dispositivos móviles

## Estado del Proyecto

**✅ MIGRACIÓN A REPLIT COMPLETADA Y PWA CONFIGURADA**

El proyecto ElderCompanion ahora funciona perfectamente en Replit y está configurado como una PWA instalable en dispositivos móviles. Los usuarios pueden instalarla como una aplicación nativa desde el navegador móvil.

## User Preferences

- Idioma: Español
- Comunicación: Clara y directa, enfoque en soluciones prácticas
- Documentación: Detallada con checkmarks y ejemplos prácticos