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
- `GET /api/elderly-users/:elderlyUserId` - Obtener perfil específico con información médica completa
- `PUT /api/elderly-users/:elderlyUserId` - Actualizar perfil médico (info personal, medicaciones, diagnósticos, etc.)

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

## Recent Changes (Aug 3, 2025)

### OPTIMIZACIONES FINALES PARA FUNCIONAMIENTO MÓVIL INDEPENDIENTE ✅ (AGOSTO 3, 2025 - 17:53)

- ✅ **Service Worker optimizado**: Cache inteligente con estrategia Cache First para datos del usuario
- ✅ **Detector de conectividad**: Hook useNetworkStatus para monitoreo en tiempo real
- ✅ **Indicador de estado de red**: Componente NetworkStatus que informa sobre conectividad
- ✅ **Funcionamiento offline**: Datos del usuario accesibles sin conexión a internet
- ✅ **URLs dinámicas**: Sistema adaptativo para funcionamiento en cualquier dominio
- ✅ **Build optimizado**: Bundle de producción listo para deployment independiente
- ✅ **PWA mejorada**: Manifest actualizado con start_url optimizada para standalone

### SISTEMA DE PERFILES MÉDICOS COMPLETOS IMPLEMENTADO ✅ (AGOSTO 3, 2025 - 17:36)

- ✅ **Diagnósticos relevantes**: Sistema completo para agregar/eliminar diagnósticos múltiples (demencia, Parkinson, depresión, etc.)
- ✅ **Medicaciones actuales**: Formulario detallado con nombre, dosis, horario y notas para cada medicación
- ✅ **Alergias y sensibilidades**: Arrays separados con badges distintivos (rojo para alergias, gris para sensibilidades)
- ✅ **Movilidad y ayudas técnicas**: Estado de movilidad (independiente, limitada, asistida, silla de ruedas) + lista de ayudas
- ✅ **Limitaciones sensoriales**: Estados independientes para visión, audición y habla con opciones específicas
- ✅ **Instrucciones de cuidado**: Campo de texto libre para rutinas especiales y precauciones
- ✅ **Interfaz intuitiva**: Modo edición/visualización, agregado dinámico con Enter, eliminación con X
- ✅ **Validación y actualización**: Backend completamente funcional, todos los campos se guardan correctamente
- ✅ **Error de fecha corregido**: Problema de validación Drizzle-Zod solucionado definitivamente

### MIGRACIÓN REPLIT AGENT → REPLIT COMPLETADA ✅ (AGOSTO 3, 2025 - 16:48)

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
- ✅ **Ícono personalizado**: Logo morado con figuras de cuidado (actualizado Aug 3, 2025)
- ✅ **Tema actualizado**: Colores purple/morado en toda la app
- ✅ **Optimización móvil**: Tamaños ajustados sin cambiar diseño
- ✅ **Botones táctiles**: Mejor interacción en dispositivos móviles

### SISTEMA DE PERFILES MÉDICOS COMPLETOS ✅

- ✅ **Estado de salud**: Campo para estado general y antecedentes médicos
- ✅ **Diagnósticos relevantes**: Array JSON para múltiples diagnósticos (demencia, Parkinson, etc.)
- ✅ **Medicaciones actuales**: Sistema completo con nombre, dosis, horarios y notas
- ✅ **Alergias y sensibilidades**: Arrays separados para alergias y sensibilidades
- ✅ **Movilidad**: Estado de movilidad y ayudas técnicas (andador, silla de ruedas, etc.)
- ✅ **Limitaciones sensoriales**: Estados de visión, audición y habla
- ✅ **Instrucciones de cuidado**: Campo para instrucciones especiales y rutinas
- ✅ **Página de perfil completa**: Interfaz de edición con validación y manejo de arrays
- ✅ **API endpoints**: GET/PUT para obtener y actualizar perfiles médicos
- ✅ **Navegación**: Enlaces desde dashboard principal a perfiles individuales

## Estado del Proyecto

**✅ PROYECTO OPTIMIZADO PARA FUNCIONAMIENTO MÓVIL INDEPENDIENTE (AGOSTO 3, 2025 - 17:52)**

- ✅ **Base de datos PostgreSQL**: Configurada automáticamente y funcionando
- ✅ **Schema sincronizado**: Todas las tablas creadas con `npm run db:push`
- ✅ **Servidor funcionando**: Express corriendo en puerto 5000 con Vite
- ✅ **API endpoints**: Todos funcionando correctamente (auth, usuarios, interacciones)
- ✅ **Datos de ejemplo**: Usuario María González con interacciones reales
- ✅ **PWA móvil mejorada**: URLs absolutas y mejor compatibilidad móvil
- ✅ **UI corregida**: Ánimo muestra datos reales en lugar de placeholder "8"
- ✅ **Datos de ejemplo**: Usuario María González con interacciones reales
- ✅ **Problemas PWA móvil resueltos**: Login y registro funcionan en móviles
- ✅ **Ícono actualizado**: Nuevo diseño proporcionado por el usuario

### CONFIGURACIÓN PARA DEPLOYMENT INDEPENDIENTE ✅

- ✅ **Build de producción**: Optimizado con Vite y esbuild
- ✅ **API mejorada**: URLs dinámicas para deployment y desarrollo
- ✅ **Service Worker actualizado**: Cache inteligente y manejo offline
- ✅ **Detector de conectividad**: Aviso cuando falta conexión al servidor
- ✅ **Health check endpoint**: `/api/health` para verificar servidor
- ✅ **Configuración PWA**: Lista para funcionar independientemente

## ⚠️ INSTRUCCIONES PARA DESPLIEGUE ⚠️

Para que la aplicación PWA funcione independientemente en móviles SIN necesidad de tener Replit abierto:

**PASO 1: Desplegar en Replit Deployments**
1. Haz clic en el botón "Deploy" en la parte superior de Replit
2. Selecciona "Autoscale Deployment" (recomendado para apps web)
3. Agrega método de pago si es necesario
4. Espera a que el deployment se complete

**PASO 2: Configurar Variables de Entorno**
En el deployment, agregar estas variables:
- `DATABASE_URL`: URL de PostgreSQL (se copiará automáticamente)
- `JWT_SECRET`: Una clave secreta segura
- `NODE_ENV`: production

**PASO 3: Actualizar URL en PWA**
Una vez deployado, la app estará disponible en `https://tu-proyecto.replit.app`
Los usuarios pueden instalar la PWA desde esa URL y funcionará independientemente.

El proyecto GaIA ahora está configurado para funcionar perfectamente tanto en desarrollo como en producción deployada.

## User Preferences

- Idioma: Español
- Comunicación: Clara y directa, enfoque en soluciones prácticas
- Documentación: Detallada con checkmarks y ejemplos prácticos