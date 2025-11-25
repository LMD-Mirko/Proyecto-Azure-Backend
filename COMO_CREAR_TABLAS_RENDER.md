# 📊 Cómo Crear las Tablas en Render

Esta guía te muestra paso a paso cómo ejecutar el script SQL para crear las tablas en tu base de datos PostgreSQL de Render.

## 🎯 Método 1: Desde el Dashboard de Render (Más Fácil)

### Paso 1: Abrir la Consola SQL de Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Busca tu base de datos PostgreSQL (la que creaste)
3. Haz click en el nombre de tu base de datos
4. En la página de detalles, busca la sección **"Connect"** o **"Connections"**
5. Verás varias opciones. Haz click en **"psql"** o **"Connect with psql"**

### Paso 2: Abrir el Editor SQL

Una vez que se abra la consola psql, verás algo como:
```
en_bd=>
```

### Paso 3: Copiar y Pegar el Script SQL

1. Abre el archivo `database_postgresql.sql` en tu editor de código
2. **Selecciona TODO el contenido** del archivo (Ctrl+A o Cmd+A)
3. **Copia** todo el contenido (Ctrl+C o Cmd+C)
4. **Pega** el contenido en la consola psql de Render (Ctrl+V o Cmd+V)
5. Presiona **Enter** para ejecutar

### Paso 4: Verificar que Funcionó

Deberías ver mensajes como:
```
DROP TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
INSERT 0 20
INSERT 0 10
INSERT 0 5
INSERT 0 11
CREATE INDEX
...
```

Si ves errores, revisa que hayas copiado todo el script completo.

---

## 🔧 Método 2: Desde tu Máquina Local (Si tienes psql instalado)

### Paso 1: Instalar psql (si no lo tienes)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
Descarga desde: https://www.postgresql.org/download/windows/

### Paso 2: Obtener la URL de Conexión

1. Ve a tu base de datos en Render
2. Copia la **"External Database URL"** (la URL completa que empieza con `postgresql://`)

### Paso 3: Ejecutar el Script

Abre tu terminal y ejecuta:

```bash
# Reemplaza la URL con la tuya
psql "postgresql://en_bd_user:tu_password@tu_host:5432/en_bd" < database_postgresql.sql
```

O si prefieres ejecutarlo paso a paso:

```bash
# Conectarte primero
psql "postgresql://en_bd_user:tu_password@tu_host:5432/en_bd"

# Luego dentro de psql, ejecutar:
\i database_postgresql.sql
```

---

## 🖥️ Método 3: Usando Render Shell

### Paso 1: Abrir Shell de Render

1. Ve a tu base de datos en Render
2. Haz click en **"Connect"** → **"Shell"**
3. Se abrirá una terminal

### Paso 2: Ejecutar el Script

En el shell, ejecuta:

```bash
# Conectarte a la base de datos
psql $DATABASE_URL

# Luego copia y pega el contenido de database_postgresql.sql
```

O directamente:

```bash
psql $DATABASE_URL < database_postgresql.sql
```

---

## ✅ Verificar que las Tablas se Crearon

Después de ejecutar el script, puedes verificar que las tablas se crearon correctamente:

### Desde psql:

```sql
-- Ver todas las tablas
\dt

-- Deberías ver:
-- productos
-- usuarios
-- ventas
-- modelos

-- Verificar datos en productos
SELECT COUNT(*) FROM productos;
-- Debería mostrar: 20

-- Verificar datos en usuarios
SELECT COUNT(*) FROM usuarios;
-- Debería mostrar: 10

-- Verificar datos en modelos
SELECT COUNT(*) FROM modelos;
-- Debería mostrar: 11
```

### Desde tu código (después de desplegar):

```bash
curl https://tu-app.onrender.com/api/productos
```

Deberías recibir una lista de productos.

---

## 🐛 Solución de Problemas

### Error: "relation already exists"
Si ves este error, significa que las tablas ya existen. El script tiene `DROP TABLE IF EXISTS`, así que debería eliminarlas primero. Si persiste el error, ejecuta manualmente:

```sql
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS modelos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
```

Y luego ejecuta el resto del script.

### Error: "permission denied"
Asegúrate de estar usando la URL correcta con las credenciales correctas.

### Error: "could not connect to server"
- Verifica que estés usando la **External Database URL** si estás conectando desde fuera de Render
- Verifica que tu IP esté permitida (Render permite conexiones externas por defecto)

---

## 📝 Notas Importantes

1. **El script es idempotente**: Puedes ejecutarlo varias veces sin problemas. Eliminará las tablas existentes y las recreará.

2. **Datos de ejemplo**: El script incluye datos de ejemplo (20 productos, 10 usuarios, 5 ventas, 11 modelos). Si no quieres estos datos, puedes comentar las secciones `INSERT INTO`.

3. **Backup**: Si ya tienes datos importantes, haz un backup antes de ejecutar el script.

---

¡Listo! Una vez ejecutado el script, tus tablas estarán creadas y listas para usar. 🎉

