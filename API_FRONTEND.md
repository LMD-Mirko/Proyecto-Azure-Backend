# 🌐 Documentación API para Frontend

**Base URL:** `https://proyecto-azure-backend.onrender.com`

---

## 📋 Tabla de Contenidos

1. [Configuración Base](#configuración-base)
2. [Endpoints Generales](#endpoints-generales)
3. [Endpoints de Chat con IA](#endpoints-de-chat-con-ia)
4. [Endpoints de Modelos Groq](#endpoints-de-modelos-groq)
5. [Endpoints de Productos](#endpoints-de-productos)
6. [Endpoints de Modelos (BD)](#endpoints-de-modelos-bd)
7. [Endpoints de Usuarios](#endpoints-de-usuarios)
8. [Endpoints de Estadísticas](#endpoints-de-estadísticas)
9. [Ejemplos de Uso en Frontend](#ejemplos-de-uso-en-frontend)

---

## ⚙️ Configuración Base

```javascript
const API_BASE_URL = 'https://proyecto-azure-backend.onrender.com';
```

---

## 🔧 Endpoints Generales

### Health Check

**GET** `/health`

Verifica el estado del servidor.

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/health`);
const data = await response.json();
// { status: "healthy" }
```

---

### Información del Servidor

**GET** `/`

Información general del servidor.

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/`);
const data = await response.json();
// {
//   message: "Backend con IA Groq y Base de Datos",
//   status: "running",
//   ai_provider: "Groq",
//   model: "llama-3.3-70b-versatile"
// }
```

---

## 🤖 Endpoints de Chat con IA

### Enviar Mensaje al Chat (con Memoria)

**POST** `/api/chat`

Envía un mensaje al chatbot con IA Groq. El chatbot ahora tiene **memoria de conversación** y **detección mejorada de intenciones**.

**Body:**
```json
{
  "message": "¿Cuántos laptops hay en stock?",
  "modelo": "llama-3.3-70b-versatile",  // Opcional
  "sessionId": "session_1234567890_abc123"  // Opcional - para mantener memoria
}
```

**Respuesta:**
```json
{
  "success": true,
  "response": "Hay 2 laptops disponibles en nuestra tienda...",
  "necesitaConsultaBD": true,
  "intencion": "bd",
  "modelo": "llama-3.3-70b-versatile",
  "sessionId": "session_1234567890_abc123"
}
```

**Campos de respuesta:**
- `response`: Respuesta del chatbot (en formato **Markdown**)
- `necesitaConsultaBD`: `true` si consultó la base de datos
- `intencion`: Tipo de intención detectada (`"bd"`, `"web"`, o `"general"`)
- `modelo`: Modelo usado para la respuesta
- `sessionId`: ID de sesión (guárdalo para mantener la conversación)
- `tieneContexto`: `true` si hay contexto previo de la conversación

**Nota importante:** Las respuestas vienen en formato **Markdown**. Si tu frontend usa React/Vue, puedes usar librerías como `react-markdown` o `marked` para renderizar el Markdown correctamente.

**Ejemplo con memoria:**
```javascript
let sessionId = null; // Guardar el sessionId para mantener la conversación

async function enviarMensaje(mensaje, modelo) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: mensaje,
      modelo: modelo, // Opcional
      sessionId: sessionId // Enviar sessionId para mantener memoria
    })
  });

  const data = await response.json();
  
  // Guardar el sessionId la primera vez
  if (!sessionId && data.sessionId) {
    sessionId = data.sessionId;
    // Guardar en localStorage para persistir entre recargas
    localStorage.setItem('chatSessionId', sessionId);
  }
  
  return data;
}

// Cargar sessionId al iniciar
sessionId = localStorage.getItem('chatSessionId');

// Usar
const resultado = await enviarMensaje('¿Cuántos laptops hay?', 'llama-3.3-70b-versatile');
console.log(resultado.response);
console.log('Intención detectada:', resultado.intencion); // "bd", "web", o "general"
```

**Notas importantes:**
- Si no envías `sessionId`, se creará uno nuevo automáticamente
- Si envías el mismo `sessionId`, el chatbot recordará la conversación anterior
- Si no envías `modelo`, se usará el modelo por defecto configurado en el servidor
- La memoria se mantiene durante los últimos 10 mensajes (5 intercambios)

---

## 🎯 Endpoints de Modelos Groq

### Obtener Modelos Disponibles

**GET** `/api/modelos-groq`

Obtiene la lista de modelos de Groq disponibles para usar en el chat.

**Respuesta:**
```json
{
  "success": true,
  "total": 7,
  "modelos": [
    {
      "id": "llama-3.3-70b-versatile",
      "nombre": "Llama 3.3 70B Versatile",
      "descripcion": "Modelo versátil y potente para tareas generales",
      "provider": "meta-llama"
    },
    {
      "id": "llama-3.1-70b-versatile",
      "nombre": "Llama 3.1 70B Versatile",
      "descripcion": "Versión anterior del modelo versátil",
      "provider": "meta-llama"
    },
    {
      "id": "llama-3.1-8b-instant",
      "nombre": "Llama 3.1 8B Instant",
      "descripcion": "Modelo rápido y ligero para respuestas instantáneas",
      "provider": "meta-llama"
    },
    {
      "id": "llama-3.1-405b-reasoning",
      "nombre": "Llama 3.1 405B Reasoning",
      "descripcion": "Modelo avanzado para razonamiento complejo",
      "provider": "meta-llama"
    },
    {
      "id": "mixtral-8x7b-32768",
      "nombre": "Mixtral 8x7B",
      "descripcion": "Modelo Mixtral de alta calidad",
      "provider": "mixtral"
    },
    {
      "id": "gemma2-9b-it",
      "nombre": "Gemma2 9B",
      "descripcion": "Modelo Gemma2 optimizado para instrucciones",
      "provider": "google"
    },
    {
      "id": "meta-llama/llama-4-scout-17b-16e-instruct",
      "nombre": "Llama 4 Scout 17B",
      "descripcion": "Modelo especializado en instrucciones",
      "provider": "meta-llama"
    }
  ]
}
```

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/modelos-groq`);
const data = await response.json();

// Usar para poblar un select de modelos
data.modelos.forEach(modelo => {
  console.log(`${modelo.nombre} - ${modelo.descripcion}`);
});
```

---

## 📦 Endpoints de Productos

### Obtener Todos los Productos

**GET** `/api/productos`

Obtiene todos los productos disponibles.

**Respuesta:**
```json
{
  "success": true,
  "productos": [
    {
      "id": 1,
      "nombre": "Laptop Dell XPS 15",
      "categoria": "Laptops",
      "precio": "1299.99",
      "stock": 25,
      "descripcion": "Laptop de alto rendimiento...",
      "marca": "Dell",
      "especificaciones": "Intel i7-12700H, 16GB DDR4...",
      "fecha_lanzamiento": "2023-03-15",
      "created_at": "2025-11-25T21:18:54.589Z"
    }
  ]
}
```

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/productos`);
const data = await response.json();
console.log(data.productos);
```

---

### Obtener Productos por Categoría

**GET** `/api/productos/categoria/:categoria`

Obtiene productos filtrados por categoría.

**Parámetros:**
- `categoria` (path): Categoría del producto (ej: `Laptops`, `Smartphones`, `Gaming`)

**Ejemplo:**
```javascript
const categoria = 'Laptops';
const response = await fetch(`${API_BASE_URL}/api/productos/categoria/${categoria}`);
const data = await response.json();
```

---

### Buscar Productos

**GET** `/api/productos/buscar?q=termino`

Busca productos por nombre, descripción o marca.

**Parámetros:**
- `q` (query): Término de búsqueda

**Ejemplo:**
```javascript
const termino = 'iPhone';
const response = await fetch(`${API_BASE_URL}/api/productos/buscar?q=${termino}`);
const data = await response.json();
```

---

## 🗄️ Endpoints de Modelos (Base de Datos)

### Obtener Todos los Modelos

**GET** `/api/modelos`

Obtiene todos los modelos almacenados en la base de datos.

**Parámetros de consulta (opcionales):**
- `tipo` (string): Filtrar por tipo (ej: `Smartphone`, `Laptop`)
- `marca` (string): Filtrar por marca (ej: `Apple`, `Samsung`)
- `buscar` (string): Buscar en nombre, descripción, marca o tipo

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
      "especificaciones": "A17 Pro, 256GB...",
      "descripcion": "El smartphone más avanzado...",
      "datos_adicionales": {
        "precio": 1199,
        "stock": 50,
        "colores": ["Titanio Natural", "Titanio Azul"]
      },
      "created_at": "2025-11-25T19:58:35.000Z",
      "updated_at": "2025-11-25T19:58:35.000Z"
    }
  ]
}
```

**Ejemplos:**
```javascript
// Todos los modelos
const response = await fetch(`${API_BASE_URL}/api/modelos`);

// Filtrar por tipo
const response = await fetch(`${API_BASE_URL}/api/modelos?tipo=Smartphone`);

// Filtrar por marca
const response = await fetch(`${API_BASE_URL}/api/modelos?marca=Apple`);

// Buscar
const response = await fetch(`${API_BASE_URL}/api/modelos?buscar=iPhone`);
```

---

### Obtener Modelo por ID

**GET** `/api/modelos/:id`

Obtiene un modelo específico por su ID.

**Ejemplo:**
```javascript
const id = 1;
const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`);
const data = await response.json();
```

---

### Crear Nuevo Modelo

**POST** `/api/modelos`

Crea un nuevo modelo en la base de datos.

**Body:**
```json
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
```javascript
const response = await fetch(`${API_BASE_URL}/api/modelos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Galaxy S25',
    tipo: 'Smartphone',
    marca: 'Samsung',
    especificaciones: 'Snapdragon 8 Gen 4, 256GB',
    descripcion: 'Nuevo modelo flagship',
    datos_adicionales: {
      precio: 1299,
      stock: 20
    }
  })
});

const data = await response.json();
```

---

### Actualizar Modelo

**PUT** `/api/modelos/:id`

Actualiza un modelo existente.

**Body:**
```json
{
  "nombre": "Modelo Actualizado",
  "stock": 50
}
```

**Ejemplo:**
```javascript
const id = 1;
const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stock: 50
  })
});
```

---

### Eliminar Modelo

**DELETE** `/api/modelos/:id`

Elimina un modelo de la base de datos.

**Ejemplo:**
```javascript
const id = 1;
const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, {
  method: 'DELETE'
});
```

---

### Estadísticas de Modelos

**GET** `/api/modelos/estadisticas`

Obtiene estadísticas de los modelos almacenados.

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

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/modelos/estadisticas`);
const data = await response.json();
```

---

## 👥 Endpoints de Usuarios

### Obtener Todos los Usuarios

**GET** `/api/usuarios`

Obtiene todos los usuarios registrados.

**Respuesta:**
```json
{
  "success": true,
  "usuarios": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+34 600 123 456",
      "fecha_registro": "2025-11-25T19:58:34.000Z",
      "total_compras": 3,
      "activo": true
    }
  ]
}
```

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/usuarios`);
const data = await response.json();
```

---

## 📊 Endpoints de Estadísticas

### Obtener Estadísticas Generales

**GET** `/api/estadisticas`

Obtiene estadísticas generales de la tienda.

**Respuesta:**
```json
{
  "success": true,
  "estadisticas": {
    "totalProductos": "5",
    "totalUsuarios": "3",
    "totalUsuariosActivos": "3",
    "totalVentas": "0",
    "productosPorCategoria": [
      {
        "categoria": "Laptops",
        "cantidad": "2"
      },
      {
        "categoria": "Smartphones",
        "cantidad": "2"
      },
      {
        "categoria": "Gaming",
        "cantidad": "1"
      }
    ]
  }
}
```

**Ejemplo:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/estadisticas`);
const data = await response.json();
console.log(data.estadisticas.totalProductos);
```

---

### Obtener Historial de Conversación

**GET** `/api/chat/historial/:sessionId`

Obtiene el historial completo de una conversación.

**Ejemplo:**
```javascript
const sessionId = 'session_1234567890_abc123';
const response = await fetch(`${API_BASE_URL}/api/chat/historial/${sessionId}`);
const data = await response.json();

// data.historial contiene el array de mensajes
// [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }, ...]
```

---

### Limpiar Conversación

**DELETE** `/api/chat/:sessionId`

Elimina el historial de una conversación de la memoria.

**Ejemplo:**
```javascript
const sessionId = 'session_1234567890_abc123';
const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
  method: 'DELETE'
});

const data = await response.json();
// { success: true, message: 'Conversación limpiada correctamente' }

// También limpiar del localStorage
localStorage.removeItem('chatSessionId');
sessionId = null;
```

---

## 💻 Ejemplos de Uso en Frontend

### Ejemplo Completo: Chat con Memoria y Selección de Modelo

```javascript
const API_BASE_URL = 'https://proyecto-azure-backend.onrender.com';

// Variable global para mantener la sesión
let sessionId = localStorage.getItem('chatSessionId') || null;

// 1. Cargar modelos disponibles
async function cargarModelos() {
  const response = await fetch(`${API_BASE_URL}/api/modelos-groq`);
  const data = await response.json();
  
  const select = document.getElementById('modelo-select');
  data.modelos.forEach(modelo => {
    const option = document.createElement('option');
    option.value = modelo.id;
    option.textContent = `${modelo.nombre} - ${modelo.descripcion}`;
    select.appendChild(option);
  });
}

// 2. Enviar mensaje al chat (con memoria)
async function enviarMensaje(mensaje, modeloSeleccionado = null) {
  try {
    const body = { 
      message: mensaje,
      sessionId: sessionId // Enviar sessionId para mantener memoria
    };
    
    if (modeloSeleccionado) {
      body.modelo = modeloSeleccionado;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Guardar sessionId la primera vez
      if (!sessionId && data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('chatSessionId', sessionId);
      }
      
      return {
        respuesta: data.response,
        modelo: data.modelo,
        intencion: data.intencion, // "bd", "web", o "general"
        consultoBD: data.necesitaConsultaBD,
        sessionId: data.sessionId
      };
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
}

// 3. Limpiar conversación
async function limpiarConversacion() {
  if (sessionId) {
    await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
      method: 'DELETE'
    });
    sessionId = null;
    localStorage.removeItem('chatSessionId');
  }
}

// 4. Obtener historial
async function obtenerHistorial() {
  if (!sessionId) return [];
  
  const response = await fetch(`${API_BASE_URL}/api/chat/historial/${sessionId}`);
  const data = await response.json();
  return data.historial || [];
}

// 5. Renderizar Markdown (ejemplo con marked)
import { marked } from 'marked';

function renderizarRespuesta(markdownText, containerId) {
  const html = marked(markdownText);
  document.getElementById(containerId).innerHTML = html;
}

// Uso
cargarModelos();

// Ejemplo de uso en un chat
const modeloSeleccionado = document.getElementById('modelo-select').value;

// Primer mensaje
const respuesta1 = await enviarMensaje('¿Cuántos laptops hay?', modeloSeleccionado);
console.log('Respuesta 1:', respuesta1.respuesta);
console.log('Intención:', respuesta1.intencion); // "bd"

// Renderizar respuesta en Markdown
renderizarRespuesta(respuesta1.respuesta, 'chat-container');

// Segundo mensaje (el bot recordará el contexto)
const respuesta2 = await enviarMensaje('¿Y smartphones?', modeloSeleccionado);
console.log('Respuesta 2:', respuesta2.respuesta); // El bot entenderá "smartphones" en contexto

// Renderizar segunda respuesta
renderizarRespuesta(respuesta2.respuesta, 'chat-container');

// Ver historial
const historial = await obtenerHistorial();
console.log('Historial:', historial);

// Limpiar cuando sea necesario
// await limpiarConversacion();
```

---

### Ejemplo: Listar Productos con Filtros

```javascript
async function obtenerProductos(filtros = {}) {
  let url = `${API_BASE_URL}/api/productos`;
  
  if (filtros.categoria) {
    url = `${API_BASE_URL}/api/productos/categoria/${filtros.categoria}`;
  } else if (filtros.buscar) {
    url = `${API_BASE_URL}/api/productos/buscar?q=${encodeURIComponent(filtros.buscar)}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.productos;
}

// Uso
const productos = await obtenerProductos({ categoria: 'Laptops' });
const productosBusqueda = await obtenerProductos({ buscar: 'iPhone' });
```

---

### Ejemplo: Crear y Gestionar Modelos

```javascript
// Crear modelo
async function crearModelo(modelo) {
  const response = await fetch(`${API_BASE_URL}/api/modelos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(modelo)
  });
  
  return await response.json();
}

// Actualizar modelo
async function actualizarModelo(id, cambios) {
  const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cambios)
  });
  
  return await response.json();
}

// Eliminar modelo
async function eliminarModelo(id) {
  const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, {
    method: 'DELETE'
  });
  
  return await response.json();
}

// Uso
const nuevoModelo = await crearModelo({
  nombre: 'Galaxy S25',
  tipo: 'Smartphone',
  marca: 'Samsung',
  datos_adicionales: { precio: 1299, stock: 20 }
});

await actualizarModelo(nuevoModelo.modelo.id, { stock: 25 });
```

---

### Ejemplo: Obtener Estadísticas

```javascript
async function obtenerEstadisticas() {
  const response = await fetch(`${API_BASE_URL}/api/estadisticas`);
  const data = await response.json();
  
  return data.estadisticas;
}

// Uso
const stats = await obtenerEstadisticas();
console.log(`Total productos: ${stats.totalProductos}`);
console.log(`Total usuarios: ${stats.totalUsuarios}`);
console.log(`Productos por categoría:`, stats.productosPorCategoria);
```

---

## 🔒 Manejo de Errores

Todos los endpoints pueden devolver errores. Siempre verifica el estado de la respuesta:

```javascript
async function llamarAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error en la petición:', error);
    throw error;
  }
}

// Uso
try {
  const data = await llamarAPI(`${API_BASE_URL}/api/productos`);
  console.log(data);
} catch (error) {
  alert(`Error: ${error.message}`);
}
```

---

## 📝 Notas Importantes

1. **CORS**: El servidor tiene CORS habilitado, así que puedes hacer peticiones desde cualquier dominio.

2. **Modelo por Defecto**: Si no envías el parámetro `modelo` en `/api/chat`, se usará el modelo configurado en el servidor (`llama-3.3-70b-versatile`).

3. **Formato de Respuestas**: Las respuestas del chat vienen en formato **Markdown**. Necesitas renderizar el Markdown en tu frontend.

4. **Formato de Fechas**: Las fechas vienen en formato ISO 8601 (ej: `2025-11-25T21:18:54.589Z`).

5. **Precios**: Los precios vienen como strings en algunos casos. Convierte a número si necesitas hacer cálculos:
   ```javascript
   const precio = parseFloat(producto.precio);
   ```

6. **JSONB**: El campo `datos_adicionales` en modelos es JSONB y puede contener cualquier estructura JSON.

---

## 🎨 Renderizar Markdown en el Frontend

Las respuestas del chat vienen en formato Markdown. Aquí tienes ejemplos de cómo renderizarlas:

### React con react-markdown

```bash
npm install react-markdown
```

```jsx
import ReactMarkdown from 'react-markdown';

function ChatMessage({ message }) {
  return (
    <div className="chat-message">
      <ReactMarkdown>{message}</ReactMarkdown>
    </div>
  );
}
```

### Vue con marked

```bash
npm install marked
```

```vue
<template>
  <div class="chat-message" v-html="renderedMarkdown"></div>
</template>

<script>
import { marked } from 'marked';

export default {
  props: ['message'],
  computed: {
    renderedMarkdown() {
      return marked(this.message);
    }
  }
}
</script>
```

### JavaScript Vanilla con marked

```bash
npm install marked
```

```javascript
import { marked } from 'marked';

function renderMarkdown(markdownText) {
  return marked(markdownText);
}

// Uso
const respuesta = await enviarMensaje('¿Cuántos laptops hay?');
const html = renderMarkdown(respuesta.response);
document.getElementById('chat-container').innerHTML = html;
```

### Ejemplo de respuesta Markdown

El chatbot responderá con formato como este:

```markdown
## Información de Stock

Tenemos **2 laptops** disponibles en nuestra tienda:

### Productos Disponibles

- **MacBook Pro 14" M3** - $1999.99 (Stock: 15)
- **Laptop Dell XPS 15** - $1299.99 (Stock: 25)

¿Te gustaría más información sobre alguno de estos productos?
```

---

## 🚀 URLs de Ejemplo

- **Base URL**: `https://proyecto-azure-backend.onrender.com`
- **Health Check**: `https://proyecto-azure-backend.onrender.com/health`
- **Chat**: `https://proyecto-azure-backend.onrender.com/api/chat`
- **Productos**: `https://proyecto-azure-backend.onrender.com/api/productos`
- **Modelos Groq**: `https://proyecto-azure-backend.onrender.com/api/modelos-groq`
- **Estadísticas**: `https://proyecto-azure-backend.onrender.com/api/estadisticas`

---

¡Listo para usar en tu frontend! 🎉


