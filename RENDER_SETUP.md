# 🚀 Configuración para Render

Este documento explica cómo configurar el proyecto en Render con PostgreSQL.

## 📋 Resumen de Cambios

El proyecto ahora soporta **ambas bases de datos**:
- **SQLite** (local) - Se usa automáticamente cuando NO hay `DATABASE_URL`
- **PostgreSQL** (Render) - Se usa automáticamente cuando hay `DATABASE_URL`

El código detecta automáticamente qué base de datos usar según las variables de entorno.

## 🔧 Paso 1: Crear Base de Datos PostgreSQL en Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `proyecto-azure-backend-db` (o el nombre que prefieras)
   - **Database**: `proyecto_azure_db` (o el nombre que prefieras)
   - **User**: Déjalo por defecto o elige uno
   - **Region**: Elige la región más cercana
   - **PostgreSQL Version**: 15 o superior
   - **Plan**: Free tier (para empezar)

4. Click en **"Create Database"**
5. Espera a que se cree (toma unos minutos)

## 📊 Paso 2: Ejecutar el Script SQL

Una vez creada la base de datos:

1. Ve a tu base de datos en Render
2. Click en **"Connect"** → **"psql"** (o usa la opción "Shell")
3. Copia y pega el contenido completo del archivo `database_postgresql.sql`
4. Ejecuta el script (debería crear todas las tablas e insertar datos de ejemplo)

**Alternativa:** También puedes ejecutar el script desde tu máquina local usando `psql`:

```bash
psql "postgresql://usuario:password@host:5432/database" < database_postgresql.sql
```

## 🔐 Paso 3: Configurar Variables de Entorno en Render

Cuando crees el Web Service en Render, configura estas variables de entorno:

### 📋 Cómo Obtener la DATABASE_URL de Render:

1. Ve a tu base de datos PostgreSQL en el dashboard de Render
2. En la sección de conexión, verás varias URLs:
   - **Internal Database URL**: Usa esta si tu Web Service está en la misma región (más rápido y seguro)
   - **External Database URL**: Usa esta si necesitas conectarte desde fuera de Render
3. Haz click en el ícono de **"copiar"** (📋) junto a la URL que necesites
4. La URL tiene este formato: `postgresql://usuario:password@host:5432/database`

### Variables Requeridas en el Web Service:

```env
# Base de Datos PostgreSQL (OBLIGATORIO - Copia desde Render)
# Usa "Internal Database URL" si el servicio está en la misma región
DATABASE_URL=postgresql://en_bd_user:password@host:5432/en_bd

# Groq API
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=tu_api_key_de_groq_aqui
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Puerto (Render lo asigna automáticamente)
PORT=10000
```

### ⚠️ Importante:

- **DATABASE_URL**: **Copia directamente** la URL completa que Render te proporciona (Internal o External según corresponda). El código ya está configurado para usar SSL automáticamente.
- **GROQ_API_KEY**: Necesitas obtener tu API key de Groq desde https://console.groq.com
- **PORT**: Render asigna el puerto automáticamente a través de `process.env.PORT` (ya está configurado en el código)
- **SSL**: El código configura SSL automáticamente cuando detecta `DATABASE_URL`, así que no necesitas configurar nada adicional

## 🚀 Paso 4: Crear Web Service en Render

1. Ve a tu dashboard de Render
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git (GitHub, GitLab, o Bitbucket)
4. Configura:
   - **Name**: `proyecto-azure-backend` (o el nombre que prefieras)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier (para empezar)

5. En la sección **"Environment Variables"**, agrega todas las variables del Paso 3
6. Click en **"Create Web Service"**

## ✅ Paso 5: Verificar Despliegue

Una vez desplegado, verifica que funcione:

```bash
# Health check
curl https://tu-app.onrender.com/health

# Obtener productos
curl https://tu-app.onrender.com/api/productos

# Obtener modelos
curl https://tu-app.onrender.com/api/modelos
```

## 🔍 Cómo Funciona la Detección Automática

El código detecta automáticamente qué base de datos usar:

```javascript
// En config.js
database: {
  url: process.env.DATABASE_URL,  // Si existe, usa PostgreSQL
  path: process.env.DATABASE_PATH || './database.db',  // Si no hay DATABASE_URL, usa SQLite
  usePostgres: !!process.env.DATABASE_URL  // true si hay DATABASE_URL
}
```

- **Local (sin DATABASE_URL)**: Usa SQLite con `better-sqlite3`
- **Render (con DATABASE_URL)**: Usa PostgreSQL con `pg`

## 🐛 Troubleshooting

### Error: "Cannot find module 'pg'"
- Asegúrate de que `pg` esté en `package.json` (ya está incluido)
- Verifica que el build en Render haya instalado las dependencias correctamente

### Error de conexión a PostgreSQL
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de usar la **Internal Database URL** si el servicio está en la misma región
- Verifica que el SSL esté configurado (ya está configurado automáticamente para producción)

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script `database_postgresql.sql` en tu base de datos
- Verifica que las tablas se hayan creado correctamente

### El código funciona local pero no en Render
- Verifica que todas las variables de entorno estén configuradas en Render
- Revisa los logs de Render para ver errores específicos
- Asegúrate de que `DATABASE_URL` esté configurada correctamente

## 📝 Notas Importantes

1. **Local sigue usando SQLite**: No necesitas cambiar nada en tu entorno local. El código detecta automáticamente que no hay `DATABASE_URL` y usa SQLite.

2. **Render usa PostgreSQL**: Cuando despliegues en Render, solo necesitas configurar `DATABASE_URL` y el código usará PostgreSQL automáticamente.

3. **Scripts de inicialización**: Los scripts `init-db` y `poblar-modelos` solo funcionan con SQLite localmente. En Render, usa el script SQL directamente.

4. **SSL**: El código configura SSL automáticamente para PostgreSQL en producción.

---

¡Listo! Tu proyecto debería funcionar tanto localmente (SQLite) como en Render (PostgreSQL). 🎉

