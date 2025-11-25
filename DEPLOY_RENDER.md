# 🚀 Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu backend en Render y configurar la base de datos PostgreSQL.

## 📋 Requisitos Previos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Archivo SQL de base de datos (`database_postgresql.sql`)

## 🔧 Paso 1: Crear Base de Datos PostgreSQL en Render

1. Ve a tu dashboard de Render
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `proyecto-azure-backend-db`
   - **Database**: `proyecto_azure_db`
   - **User**: `proyecto_azure_user` (o déjalo por defecto)
   - **Region**: Elige la región más cercana
   - **PostgreSQL Version**: 15 o superior
   - **Plan**: Free tier (para empezar)

4. Click en **"Create Database"**
5. Espera a que se cree (toma unos minutos)
6. Una vez creada, copia la **Internal Database URL** y la **External Database URL**

## 📊 Paso 2: Ejecutar el Script SQL

### Opción A: Desde el Dashboard de Render

1. Ve a tu base de datos en Render
2. Click en **"Connect"** → **"psql"**
3. Copia y pega el contenido de `database_postgresql.sql`
4. Ejecuta el script

### Opción B: Desde tu máquina local (con psql)

```bash
# Instalar psql si no lo tienes
# Ubuntu/Debian:
sudo apt-get install postgresql-client

# macOS:
brew install postgresql

# Conectarte a la BD de Render
psql "postgresql://usuario:password@host:5432/database"

# Ejecutar el script
\i database_postgresql.sql
```

### Opción C: Desde Render Shell

1. En el dashboard de Render, ve a tu base de datos
2. Click en **"Connect"** → **"Shell"**
3. Ejecuta:
```bash
psql $DATABASE_URL < database_postgresql.sql
```

## 🔐 Paso 3: Configurar Variables de Entorno

En tu servicio de Render, configura estas variables de entorno:

```env
# Base de Datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:5432/database

# Groq API
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=tu_api_key_aqui
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Puerto (Render lo asigna automáticamente)
PORT=10000
```

## 🛠️ Paso 4: Actualizar Código para PostgreSQL

Necesitas cambiar de SQLite a PostgreSQL. Actualiza `database.js`:

### Instalar dependencias PostgreSQL

```bash
npm install pg
```

### Actualizar database.js

```javascript
import pg from 'pg';
const { Pool } = pg;
import { config } from './config.js';

const pool = new Pool({
  connectionString: config.database.url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Ejemplo de función actualizada
export async function getModelos() {
  const result = await pool.query('SELECT * FROM modelos ORDER BY created_at DESC');
  return result.rows;
}
```

## 🚀 Paso 5: Crear Servicio Web en Render

1. Ve a tu dashboard de Render
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git
4. Configura:
   - **Name**: `proyecto-azure-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier

5. En **"Environment Variables"**, agrega todas las variables del Paso 3
6. Click en **"Create Web Service"**

## 📝 Paso 6: Actualizar package.json

Asegúrate de que tu `package.json` tenga:

```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

## ✅ Paso 7: Verificar Despliegue

Una vez desplegado, verifica:

```bash
# Health check
curl https://tu-app.onrender.com/health

# Obtener modelos
curl https://tu-app.onrender.com/api/modelos
```

## 🔍 Troubleshooting

### Error de conexión a BD

- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de usar la **Internal Database URL** si el servicio está en la misma región
- Verifica que el SSL esté configurado correctamente

### Error de módulos

- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `node_modules` esté en `.gitignore`

### Puerto

Render asigna el puerto automáticamente. Asegúrate de usar:

```javascript
const PORT = process.env.PORT || 3000;
```

## 📚 Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [PostgreSQL en Render](https://render.com/docs/databases)
- [Node.js en Render](https://render.com/docs/node)

## 🎯 Checklist de Despliegue

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Script SQL ejecutado correctamente
- [ ] Variables de entorno configuradas
- [ ] Código actualizado para PostgreSQL
- [ ] Servicio web creado en Render
- [ ] Repositorio conectado
- [ ] Build exitoso
- [ ] Servicio funcionando
- [ ] Endpoints probados

---

¡Listo! Tu backend debería estar funcionando en Render. 🎉

