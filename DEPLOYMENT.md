# Guía de Despliegue en Vercel

## 📋 Pasos para Desplegar ElderCompanion en Vercel

### 1. Preparación del Repositorio

Asegúrate de que tu repositorio tenga todos los archivos necesarios:
- `vercel.json` - Configuración de Vercel ✅
- `README.md` - Documentación del proyecto ✅
- `.env.example` - Ejemplo de variables de entorno ✅
- `.vercelignore` - Archivos a ignorar en el despliegue ✅

### 2. Variables de Entorno Requeridas

En el panel de Vercel, configura estas variables:

#### Variables Obligatorias:
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
NODE_ENV=production
```

#### Ejemplo para Neon Database:
```
DATABASE_URL=postgresql://username:password@ep-example-12345.us-east-1.aws.neon.tech/eldercompanion?sslmode=require
JWT_SECRET=eldercompanion_super_secret_key_2025_production
NODE_ENV=production
```

### 3. Configuración de Base de Datos

#### Opción 1: Neon Database (Recomendado)
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "eldercompanion"
4. Copia la connection string
5. Pégala en la variable `DATABASE_URL` de Vercel

#### Opción 2: Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > Database
4. Copia la URI connection string
5. Pégala en la variable `DATABASE_URL` de Vercel

### 4. Despliegue en Vercel

#### Método 1: GitHub (Recomendado)
1. Sube tu código a GitHub
2. Conecta tu repositorio a Vercel
3. Configura las variables de entorno
4. Vercel desplegará automáticamente

#### Método 2: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer login
vercel login

# Desplegar
vercel --prod
```

### 5. Configuración Post-Despliegue

#### Configurar Base de Datos
Una vez desplegado, ejecuta las migraciones de base de datos:

```bash
# Desde tu entorno local con la DATABASE_URL de producción
npx drizzle-kit push
```

#### Verificar Funcionamiento
1. Ve a tu URL de Vercel
2. Prueba el registro de usuario
3. Prueba el inicio de sesión
4. Verifica que las rutas API funcionen

### 6. Dominios Personalizados (Opcional)

1. En el panel de Vercel, ve a tu proyecto
2. Haz clic en "View Domains"
3. Añade tu dominio personalizado
4. Configura los DNS según las instrucciones

### 7. Monitoreo y Logs

- **Analytics**: Vercel Analytics incluido
- **Logs**: Ver en Vercel Dashboard > Functions
- **Performance**: Monitoreo automático de Core Web Vitals

### 8. Actualización del Proyecto

Para futuras actualizaciones:
1. Haz push a tu repositorio
2. Vercel desplegará automáticamente
3. Verifica que todo funcione correctamente

### 🚨 Troubleshooting Común

#### Error de Base de Datos
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos sea accesible desde internet
- Verifica que las tablas estén creadas (`drizzle-kit push`)

#### Error 500 en API
- Revisa los logs de función en Vercel
- Verifica que `JWT_SECRET` esté configurado
- Asegúrate de que todas las dependencias estén en `dependencies` (no en `devDependencies`)

#### Frontend no carga
- Verifica que el build se completó correctamente
- Revisa la configuración de rutas en `vercel.json`
- Asegúrate de que los archivos estáticos se generaron en `dist/public`

### 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Vercel
2. Verifica las variables de entorno
3. Confirma que la base de datos esté accesible
4. Consulta la documentación de Vercel

---

¡Tu aplicación ElderCompanion estará lista para cuidar a adultos mayores en todo el mundo! 🌍❤️