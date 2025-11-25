# 🚀 Ejecutar SQL en Render - Guía Rápida

## Opción 1: Usar Render CLI (Recomendado si tienes CLI instalado)

### Paso 1: Instalar Render CLI (si no lo tienes)

```bash
# macOS/Linux
curl -fsSL https://render.com/install.sh | sh

# O con npm
npm install -g render-cli
```

### Paso 2: Iniciar sesión

```bash
render login
```

### Paso 3: Conectarte y ejecutar el script

```bash
# Usa el comando que Render te muestra (ejemplo: render psql dpg-d4j17sali9vc73ag7erg-a)
render psql dpg-d4j17sali9vc73ag7erg-a < database_postgresql.sql
```

O conectarte interactivamente:

```bash
render psql dpg-d4j17sali9vc73ag7erg-a
```

Luego dentro de psql:
```sql
\i database_postgresql.sql
```

---

## Opción 2: Usar External Database URL desde tu máquina local

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

### Paso 2: Ejecutar el script usando la External Database URL

```bash
# Copia la External Database URL completa de Render y úsala así:
psql "postgresql://en_hd_user:1WuJIqWDGtdiBoHy3VIVIMPd1cFm...@host:5432/en_hd" < database_postgresql.sql
```

**⚠️ Importante:** Reemplaza la URL completa con la que Render te muestra (incluyendo el password completo).

### Paso 3: Verificar

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

---

## Opción 3: Desde el Dashboard de Render (Más Fácil)

### Paso 1: Ir a la pestaña "Internal"

1. En tu base de datos de Render, haz click en la pestaña **"Internal"** (no "External")
2. Busca la opción **"psql"** o **"Connect with psql"**
3. Haz click en ella

### Paso 2: Ejecutar el script

1. Se abrirá una consola psql
2. Abre el archivo `database_postgresql.sql` en tu editor
3. Copia TODO el contenido (Ctrl+A, Ctrl+C)
4. Pega en la consola psql (Ctrl+V)
5. Presiona Enter

---

## ✅ Verificar que Funcionó

Después de ejecutar el script, verifica:

```sql
-- Ver todas las tablas
\dt

-- Deberías ver:
-- productos
-- usuarios
-- ventas
-- modelos

-- Contar productos
SELECT COUNT(*) FROM productos;
-- Debería mostrar: 20

-- Contar usuarios
SELECT COUNT(*) FROM usuarios;
-- Debería mostrar: 10
```

---

## 🎯 Recomendación

**Para crear las tablas por primera vez, usa la Opción 3 (Dashboard → Internal → psql)** porque:
- ✅ No necesitas instalar nada
- ✅ Es más fácil y visual
- ✅ Funciona directamente desde el navegador

**Para uso futuro o automatización, usa la Opción 1 (Render CLI)** porque:
- ✅ Es más rápido
- ✅ Se puede automatizar
- ✅ Útil para scripts

---

¡Listo! Una vez ejecutado, tus tablas estarán creadas. 🎉

