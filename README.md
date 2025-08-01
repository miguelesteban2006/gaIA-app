# ElderCompanion - Sistema Inteligente de Monitoreo para Adultos Mayores

ElderCompanion es una Progressive Web Application (PWA) diseñada para el monitoreo y cuidado de adultos mayores a través de un sistema integrado que conecta familias, profesionales médicos y asistentes robóticos.

## 🚀 Características Principales

- **Análisis de Sentimientos**: Monitoreo emocional en tiempo real
- **Seguimiento de Salud**: Indicadores vitales y bienestar
- **Red de Apoyo**: Conecta familias, médicos y cuidadores
- **Interfaz Intuitiva**: Diseño accesible y fácil de usar
- **PWA**: Funciona como aplicación nativa

## 🛠️ Tecnologías

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn/ui
- TanStack Query (React Query)
- Wouter (routing)

### Backend
- Node.js + Express
- PostgreSQL + Drizzle ORM
- JWT Authentication
- Bcrypt (password hashing)

## 📦 Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Completa las variables en el archivo `.env`

4. Configura la base de datos:
   ```bash
   npm run db:push
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🚀 Despliegue en Vercel

### Configuración de Variables de Entorno

En tu panel de Vercel, configura las siguientes variables:

1. **DATABASE_URL**: URL de tu base de datos PostgreSQL
2. **JWT_SECRET**: Clave secreta para JWT (genera una segura)
3. **NODE_ENV**: `production`

### Pasos para Desplegar

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Vercel detectará automáticamente la configuración desde `vercel.json`
4. El despliegue se realizará automáticamente

### Base de Datos

Se recomienda usar un servicio de PostgreSQL como:
- **Neon** (recomendado para compatibilidad)
- **Supabase**
- **PlanetScale**
- **Railway**

## 📝 Scripts Disponibles

- `npm run dev`: Servidor de desarrollo
- `npm run build`: Build para producción
- `npm run start`: Servidor de producción local
- `npm run db:push`: Sincronizar esquema de base de datos
- `npm run check`: Verificar tipos de TypeScript

## 🔒 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:
- Registro y login de usuarios
- Tokens con expiración de 7 días
- Middleware de autenticación para rutas protegidas

## 📊 API Endpoints

### Autenticación
- `POST /api/register` - Registro de usuario
- `POST /api/login` - Inicio de sesión
- `GET /api/auth/user` - Obtener usuario actual
- `GET /api/profile` - Perfil del usuario

### Usuarios Mayores
- `POST /api/elderly-users` - Crear perfil de adulto mayor
- `GET /api/elderly-users` - Listar adultos mayores del usuario

### Interacciones
- `POST /api/interactions` - Registrar interacción
- `GET /api/interactions/:elderlyUserId` - Obtener interacciones

### Estadísticas
- `GET /api/stats/:elderlyUserId` - Estadísticas generales
- `GET /api/sentiment-data/:elderlyUserId` - Datos de sentimientos

### Alertas de Salud
- `POST /api/health-alerts` - Crear alerta
- `GET /api/health-alerts/:elderlyUserId` - Obtener alertas
- `PUT /api/health-alerts/:alertId/resolve` - Resolver alerta

## 🗄️ Esquema de Base de Datos

El proyecto utiliza las siguientes tablas principales:
- `users` - Usuarios del sistema
- `elderly_users` - Perfiles de adultos mayores
- `user_elderly_relations` - Relaciones entre usuarios y adultos mayores
- `interactions` - Interacciones registradas
- `health_alerts` - Alertas de salud
- `sessions` - Sesiones de usuario

## 🎨 UI/UX

- Diseño responsive y mobile-first
- Tema claro/oscuro
- Componentes accesibles (Radix UI)
- Animaciones suaves (Framer Motion)
- Iconos de Lucide React

## 📱 PWA Features

- Instalable como aplicación nativa
- Service Worker para funcionalidad offline
- Manifest.json configurado
- Cacheo inteligente de recursos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue si es necesario

---

Desarrollado con ❤️ para el cuidado integral de adultos mayores.