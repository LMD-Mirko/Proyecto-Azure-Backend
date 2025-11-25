# 📚 Documentación de la API

Base URL: `http://localhost:3000`

## 📋 Tabla de Contenidos

1. [Endpoints Generales](#endpoints-generales)
2. [Endpoints de Modelos](#endpoints-de-modelos)
3. [Endpoints de Productos](#endpoints-de-productos)
4. [Endpoints de Usuarios](#endpoints-de-usuarios)
5. [Endpoints de Estadísticas](#endpoints-de-estadísticas)
6. [Endpoints de Chat con IA](#endpoints-de-chat-con-ia)

---

## 🔧 Endpoints Generales

### Health Check

**GET** `/health`

Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "healthy"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/health
```

---

### Root

**GET** `/`

Información general del servidor.

**Respuesta:**
```json
{
  "message": "Backend con IA Groq y Base de Datos",
  "status": "running",
  "ai_provider": "Groq",
  "model": "meta-llama/llama-4-scout-17b-16e-instruct"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/
```

---

## 📦 Endpoints de Modelos

### Obtener todos los modelos

**GET** `/api/modelos`

Obtiene todos los modelos almacenados en la base de datos.

**Parámetros de consulta (opcionales):**
- `tipo` (string): Filtrar por tipo de modelo (ej: `Smartphone`, `Laptop`)
- `marca` (string): Filtrar por marca (ej: `Apple`, `Samsung`)
- `buscar` (string): Buscar en nombre, descripción, marca o tipo

**Respuesta exitosa (200):**
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
      "created_at": "2025-11-25 19:58:35",
      "updated_at": "2025-11-25 19:58:35"
    }
  ]
}
```

**Ejemplos:**
```bash
# Obtener todos los modelos
curl http://localhost:3000/api/modelos

# Filtrar por tipo
curl "http://localhost:3000/api/modelos?tipo=Smartphone"

# Filtrar por marca
curl "http://localhost:3000/api/modelos?marca=Apple"

# Buscar
curl "http://localhost:3000/api/modelos?buscar=iPhone"
```

---

### Obtener un modelo por ID

**GET** `/api/modelos/:id`

Obtiene un modelo específico por su ID.

**Parámetros de ruta:**
- `id` (integer): ID del modelo

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "modelo": {
    "id": 1,
    "nombre": "iPhone 15 Pro Max",
    "tipo": "Smartphone",
    "marca": "Apple",
    "especificaciones": "A17 Pro, 256GB...",
    "descripcion": "El smartphone más avanzado...",
    "datos_adicionales": {
      "precio": 1199,
      "stock": 50
    },
    "created_at": "2025-11-25 19:58:35",
    "updated_at": "2025-11-25 19:58:35"
  }
}
```

**Respuesta de error (404):**
```json
{
  "error": "Modelo no encontrado"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/modelos/1
```

---

### Crear un nuevo modelo

**POST** `/api/modelos`

Crea un nuevo modelo en la base de datos.

**Body (JSON):**
```json
{
  "nombre": "Galaxy S25",
  "tipo": "Smartphone",
  "marca": "Samsung",
  "especificaciones": "Snapdragon 8 Gen 4, 256GB",
  "descripcion": "Nuevo modelo flagship",
  "datos_adicionales": {
    "precio": 1299,
    "stock": 20,
    "colores": ["Negro", "Blanco"]
  }
}
```

**Campos requeridos:**
- `nombre` (string): Nombre del modelo
- `tipo` (string): Tipo de producto tecnológico

**Campos opcionales:**
- `marca` (string): Marca del producto
- `especificaciones` (string): Especificaciones técnicas
- `descripcion` (string): Descripción del producto
- `datos_adicionales` (object): Objeto JSON con información adicional

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Modelo creado correctamente",
  "modelo": {
    "id": 11,
    "nombre": "Galaxy S25",
    "tipo": "Smartphone",
    "marca": "Samsung",
    "especificaciones": "Snapdragon 8 Gen 4, 256GB",
    "descripcion": "Nuevo modelo flagship",
    "datos_adicionales": {
      "precio": 1299,
      "stock": 20
    },
    "created_at": "2025-11-25 20:00:00",
    "updated_at": "2025-11-25 20:00:00"
  }
}
```

**Respuesta de error (400):**
```json
{
  "error": "Los campos \"nombre\" y \"tipo\" son requeridos"
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
    "descripcion": "Nuevo modelo flagship",
    "datos_adicionales": {
      "precio": 1299,
      "stock": 20
    }
  }'
```

---

### Actualizar un modelo

**PUT** `/api/modelos/:id`

Actualiza un modelo existente un modelo existente.

**Parámetros de ruta:**
- `id` (integer): ID del modelo a actualizar

**Body (JSON):**
```json
{
  "nombre": "Galaxy S25 Ultra",
  "stock": 25
}
```

**Nota:** Solo envía los campos que deseas actualizar. Los demás campos se mantendrán igual.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Modelo actualizado correctamente",
  "modelo": {
    "id": 11,
    "nombre": "Galaxy S25 Ultra",
    "tipo": "Smartphone",
    "marca": "Samsung",
    "stock": 25,
    "updated_at": "2025-11-25 20:05:00"
  }
}
```

**Respuesta de error (404):**
```json
{
  "error": "Modelo no encontrado"
}
```

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/modelos/11 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Galaxy S25 Ultra",
    "stock": 25
  }'
```

---

### Eliminar un modelo

**DELETE** `/api/modelos/:id`

Elimina un modelo de la base de datos.

**Parámetros de ruta:**
- `id` (integer): ID del modelo a eliminar

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Modelo eliminado correctamente"
}
```

**Respuesta de error (404):**
```json
{
  "error": "Modelo no encontrado"
}
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/modelos/11
```

---

### Estadísticas de modelos

**GET** `/api/modelos/estadisticas`

Obtiene estadísticas agregadas de los modelos.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "estadisticas": {
    "total": 10,
    "porTipo": {
      "Smartphone": 2,
      "Laptop": 2,
      "Consola": 2,
      "Tablet": 1,
      "Monitor": 1,
      "Audio": 1,
      "Almacenamiento": 1
    },
    "porMarca": {
      "Apple": 3,
      "Samsung": 2,
      "Dell": 1,
      "Sony": 2,
      "Nintendo": 1,
      "LG": 1
    }
  }
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/modelos/estadisticas
```

---

## 🛍️ Endpoints de Productos

### Obtener todos los productos

**GET** `/api/productos`

Obtiene todos los productos tecnológicos almacenados.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "productos": [
    {
      "id": 1,
      "nombre": "Laptop Dell XPS 15",
      "categoria": "Laptops",
      "precio": 1299.99,
      "stock": 25,
      "descripcion": "Laptop de alto rendimiento...",
      "marca": "Dell",
      "especificaciones": "Intel i7-12700H, 16GB DDR4...",
      "fecha_lanzamiento": "2023-03-15",
      "created_at": "2025-11-25 19:58:34"
    }
  ]
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/productos
```

---

### Obtener productos por categoría

**GET** `/api/productos/categoria/:categoria`

Obtiene productos filtrados por categoría.

**Parámetros de ruta:**
- `categoria` (string): Categoría del producto (ej: `Laptops`, `Smartphones`)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "productos": [...]
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/productos/categoria/Laptops
```

---

### Buscar productos

**GET** `/api/productos/buscar`

Busca productos por término.

**Parámetros de consulta:**
- `q` (string, requerido): Término de búsqueda

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "productos": [...]
}
```

**Respuesta de error (400):**
```json
{
  "error": "Parámetro \"q\" es requerido"
}
```

**Ejemplo:**
```bash
curl "http://localhost:3000/api/productos/buscar?q=iPhone"
```

---

## 👥 Endpoints de Usuarios

### Obtener todos los usuarios

**GET** `/api/usuarios`

Obtiene todos los usuarios registrados.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "usuarios": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+34 600 123 456",
      "fecha_registro": "2025-11-25 19:58:34",
      "total_compras": 3,
      "activo": 1
    }
  ]
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/usuarios
```

---

## 📊 Endpoints de Estadísticas

### Estadísticas generales

**GET** `/api/estadisticas`

Obtiene estadísticas generales del sistema.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "estadisticas": {
    "totalProductos": 20,
    "totalUsuarios": 10,
    "totalUsuariosActivos": 10,
    "totalVentas": 5,
    "productosPorCategoria": [
      {
        "categoria": "Laptops",
        "cantidad": 4
      },
      {
        "categoria": "Smartphones",
        "cantidad": 3
      }
    ]
  }
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/estadisticas
```

---

## 🤖 Endpoints de Chat con IA

### Chat con IA

**POST** `/api/chat`

Envía un mensaje al asistente de IA especializado en tecnología.

**Body (JSON):**
```json
{
  "message": "¿Cuántos laptops hay en stock?"
}
```

**Campos requeridos:**
- `message` (string): Mensaje o pregunta para la IA

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "response": "Hay 4 laptops disponibles en nuestra tienda...",
  "necesitaConsultaBD": true,
  "modelo": "meta-llama/llama-4-scout-17b-16e-instruct"
}
```

**Campos de respuesta:**
- `response` (string): Respuesta generada por la IA
- `necesitaConsultaBD` (boolean): Indica si se consultó la base de datos
- `modelo` (string): Modelo de IA utilizado

**Respuesta de error (400):**
```json
{
  "error": "El campo \"message\" es requerido y debe ser un string"
}
```

**Respuesta de error (500):**
```json
{
  "error": "Error al procesar la solicitud",
  "message": "Detalles del error..."
}
```

**Ejemplos:**

Pregunta que consulta la BD:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuántos laptops hay en stock?"}'
```

Pregunta general (no consulta BD):
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuándo salió la Nintendo Switch?"}'
```

---

## 📝 Notas Importantes

### Tipos de Preguntas para el Chat

**Preguntas que consultan la BD:**
- "¿Cuántos laptops hay en stock?"
- "¿Cuántos usuarios están registrados?"
- "¿Qué productos de Apple tienen?"
- "¿Cuál es el precio del iPhone 15 Pro?"
- "¿Hay stock del PlayStation 5?"

**Preguntas que NO consultan la BD (respuesta directa):**
- "¿Cuándo salió la Nintendo Switch?"
- "¿Qué es un SSD?"
- "¿Cuál es la diferencia entre RAM y almacenamiento?"
- "¿Qué procesador es mejor, Intel o AMD?"

### Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en la solicitud (campos faltantes o inválidos)
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

### Formato de Fechas

Las fechas se devuelven en formato: `YYYY-MM-DD HH:MM:SS`

### Campo `datos_adicionales`

El campo `datos_adicionales` en la tabla `modelos` acepta cualquier objeto JSON. Puedes almacenar información flexible como:
- Precios
- Stock
- Colores disponibles
- Especificaciones adicionales
- Cualquier otro dato relevante

---

## 🔗 Ejemplos de Uso Completo

### Flujo completo: Crear, Leer, Actualizar, Eliminar (CRUD)

```bash
# 1. Crear un modelo
curl -X POST http://localhost:3000/api/modelos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nuevo Producto",
    "tipo": "Gadget",
    "marca": "TechBrand",
    "descripcion": "Descripción del producto",
    "datos_adicionales": {"precio": 99, "stock": 10}
  }'

# 2. Obtener el modelo creado (asumiendo ID 11)
curl http://localhost:3000/api/modelos/11

# 3. Actualizar el modelo
curl -X PUT http://localhost:3000/api/modelos/11 \
  -H "Content-Type: application/json" \
  -d '{"stock": 25}'

# 4. Eliminar el modelo
curl -X DELETE http://localhost:3000/api/modelos/11
```

---

## 🛠️ Herramientas Recomendadas

- **Postman**: Para probar endpoints fácilmente
- **curl**: Para pruebas desde terminal
- **Insomnia**: Alternativa a Postman
- **Thunder Client**: Extensión de VS Code

---

## 📞 Soporte

Para más información, consulta el archivo `README.md` del proyecto.

