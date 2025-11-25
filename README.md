# Backend con IA Groq y Base de Datos

Backend desarrollado con Node.js y Express que integra la API de Groq para inteligencia artificial y una base de datos SQLite con productos tecnológicos.

## 🚀 Características

- **Integración con Groq AI**: Usa el modelo `meta-llama/llama-4-scout-17b-16e-instruct` para respuestas inteligentes
- **Base de Datos SQLite**: Almacena productos tecnológicos, usuarios y ventas
- **Detección Inteligente**: El bot detecta automáticamente cuándo necesita consultar la base de datos
- **Rol Especializado**: El bot está configurado para responder solo sobre temas de tecnología
- **API REST**: Endpoints para chat con IA y consultas a la base de datos

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Inicializar la base de datos con datos de ejemplo:
```bash
npm run init-db
```

3. (Opcional) Poblar la tabla de modelos con datos de ejemplo:
```bash
node scripts/poblarModelos.js
```

4. El archivo `.env` ya está configurado con tus credenciales de Groq.

## 🎯 Uso

### Iniciar el servidor

```bash
npm start
```

O en modo desarrollo con auto-reload:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación Completa de la API

Para ver la documentación completa y detallada de todos los endpoints con ejemplos, consulta el archivo **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## 📡 Endpoints - Resumen Rápido

### Chat con IA
```http
POST /api/chat
Content-Type: application/json

{
  "message": "¿Cuántos laptops hay en stock?"
}
```

**Respuesta:**
```json
{
  "success": true,
  "response": "Hay 4 laptops disponibles en nuestra tienda...",
  "necesitaConsultaBD": true,
  "modelo": "meta-llama/llama-4-scout-17b-16e-instruct"
}
```

### Obtener Productos
```http
GET /api/productos
```

### Buscar Productos
```http
GET /api/productos/buscar?q=iPhone
```

### Obtener Estadísticas
```http
GET /api/estadisticas
```

### Obtener Usuarios
```http
GET /api/usuarios
```

## 📦 Endpoints de Modelos (Nuevos)

### GET - Obtener todos los modelos
```http
GET /api/modelos
GET /api/modelos?tipo=Smartphone
GET /api/modelos?marca=Apple
GET /api/modelos?buscar=iPhone
```

### GET - Obtener modelo por ID
```http
GET /api/modelos/:id
```

### POST - Crear modelo
```http
POST /api/modelos
Content-Type: application/json

{
  "nombre": "Nuevo Modelo",
  "tipo": "Smartphone",
  "marca": "Samsung",
  "datos_adicionales": {"precio": 999, "stock": 20}
}
```

### PUT - Actualizar modelo
```http
PUT /api/modelos/:id
```

### DELETE - Eliminar modelo
```http
DELETE /api/modelos/:id
```

### GET - Estadísticas de modelos
```http
GET /api/modelos/estadisticas
```

**📖 Para más detalles y ejemplos completos, consulta [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## 📦 Endpoints de Modelos (Detallados)

### GET - Obtener todos los modelos
```http
GET /api/modelos
```

**Parámetros opcionales:**
- `tipo`: Filtrar por tipo (ej: `?tipo=Smartphone`)
- `marca`: Filtrar por marca (ej: `?marca=Apple`)
- `buscar`: Buscar en nombre, descripción, marca o tipo (ej: `?buscar=iPhone`)

**Ejemplo:**
```bash
curl http://localhost:3000/api/modelos
curl http://localhost:3000/api/modelos?tipo=Laptop
curl http://localhost:3000/api/modelos?marca=Apple
curl http://localhost:3000/api/modelos?buscar=iPhone
```

**Respuesta:**
```json
{
  "success": true,
  "total": 10,
  "modelos": [
    {
      "id": 1,
      "nombre": "iPhone 15 Pro Max",
      "tipo": "Smartphone",
      "marca": "Apple",
      "especificaciones": "A17 Pro, 256GB, Cámara 48MP...",
      "descripcion": "El smartphone más avanzado...",
      "datos_adicionales": {
        "precio": 1199,
        "stock": 50,
        "colores": ["Titanio Natural", "Titanio Azul"]
      },
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### GET - Obtener un modelo por ID
```http
GET /api/modelos/:id
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/modelos/1
```

### POST - Crear un nuevo modelo
```http
POST /api/modelos
Content-Type: application/json

{
  "nombre": "Nuevo Modelo",
  "tipo": "Smartphone",
  "marca": "Samsung",
  "especificaciones": "Especificaciones técnicas...",
  "descripcion": "Descripción del modelo",
  "datos_adicionales": {
    "precio": 999,
    "stock": 30,
    "colores": ["Negro", "Blanco"]
  }
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/modelos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Galaxy S25",
    "tipo": "Smartphone",
    "marca": "Samsung",
    "especificaciones": "Snapdragon 8 Gen 4, 256GB",
    "descripcion": "Nuevo modelo flagship",
    "datos_adicionales": {
      "precio": 1299,
      "stock": 20
    }
  }'
```

### PUT - Actualizar un modelo
```http
PUT /api/modelos/:id
Content-Type: application/json

{
  "nombre": "Modelo Actualizado",
  "stock": 50
}
```

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/modelos/1 \
  -H "Content-Type: application/json" \
  -d '{"stock": 50}'
```

### DELETE - Eliminar un modelo
```http
DELETE /api/modelos/:id
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/modelos/1
```

### GET - Estadísticas de modelos
```http
GET /api/modelos/estadisticas
```

**Respuesta:**
```json
{
  "success": true,
  "estadisticas": {
    "total": 10,
    "porTipo": {
      "Smartphone": 2,
      "Laptop": 2,
      "Consola": 2
    },
    "porMarca": {
      "Apple": 4,
      "Samsung": 2
    }
  }
}
```

## 🤖 Ejemplos de Preguntas

### Preguntas que consultan la BD:
- "¿Cuántos laptops hay en stock?"
- "¿Cuántos usuarios están registrados?"
- "¿Qué productos de Apple tienen?"
- "¿Cuál es el precio del iPhone 15 Pro?"
- "¿Hay stock del PlayStation 5?"

### Preguntas que NO consultan la BD (respuesta directa):
- "¿Cuándo salió la Nintendo Switch?"
- "¿Qué es un SSD?"
- "¿Cuál es la diferencia entre RAM y almacenamiento?"
- "¿Qué procesador es mejor, Intel o AMD?"

## 📊 Estructura de la Base de Datos

### Tabla: productos
- id, nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento

### Tabla: usuarios
- id, nombre, email, telefono, fecha_registro, total_compras, activo

### Tabla: ventas
- id, usuario_id, producto_id, cantidad, precio_total, fecha_venta

### Tabla: modelos
- id, nombre, tipo, marca, especificaciones, descripcion, datos_adicionales (JSON), created_at, updated_at

**Nota:** La tabla `modelos` es flexible y permite almacenar diferentes tipos de datos tecnológicos. El campo `datos_adicionales` puede contener cualquier información adicional en formato JSON.

## 🔐 Configuración

Las credenciales están en el archivo `.env`:
- `GROQ_API_URL`: URL de la API de Groq
- `GROQ_API_KEY`: Tu API key de Groq
- `GROQ_MODEL`: Modelo a usar
- `DATABASE_PATH`: Ruta del archivo de base de datos

## 📝 Notas

- El bot está configurado para responder solo sobre temas de tecnología
- Si se pregunta algo fuera del contexto, redirigirá educadamente hacia temas tecnológicos
- La detección de consultas a BD se basa en palabras clave y contexto

## 🛠️ Tecnologías Utilizadas

- Node.js
- Express.js
- SQLite3 (better-sqlite3)
- Groq API
- Axios

