# 💬 Guía de Implementación del Chat con IA - Frontend

Este documento explica todos los cambios y mejoras implementadas en el sistema de chat con IA y cómo debes implementarlos en el frontend.

---

## 📋 Tabla de Contenidos

1. [Nuevas Funcionalidades](#nuevas-funcionalidades)
2. [Selección Dinámica de Modelos](#selección-dinámica-de-modelos)
3. [Sistema de Memoria/Conversación](#sistema-de-memoriaconversación)
4. [Formato Markdown en Respuestas](#formato-markdown-en-respuestas)
5. [Detección de Intención Mejorada](#detección-de-intención-mejorada)
6. [Endpoints del Chat](#endpoints-del-chat)
7. [Ejemplos de Implementación](#ejemplos-de-implementación)
8. [Checklist de Implementación](#checklist-de-implementación)

---

## 🆕 Nuevas Funcionalidades

El sistema de chat ahora incluye:

1. ✅ **Selección dinámica de modelos**: El usuario puede elegir qué modelo de Groq usar para cada conversación
2. ✅ **Memoria de conversación**: El chat recuerda el contexto de la conversación anterior
3. ✅ **Respuestas en Markdown**: Las respuestas vienen formateadas en Markdown para mejor legibilidad
4. ✅ **Detección inteligente de intención**: El sistema detecta si la pregunta requiere consulta a BD, conocimiento web o es una pregunta general

---

## 🎯 Selección Dinámica de Modelos

### ¿Qué cambió?

Antes el modelo era fijo. Ahora el frontend puede seleccionar qué modelo de Groq usar para cada mensaje.

### ¿Qué debes hacer?

1. **Cargar los modelos disponibles** al iniciar la aplicación
2. **Mostrar un selector** (dropdown/select) para que el usuario elija el modelo
3. **Enviar el modelo seleccionado** en cada petición al chat

### Endpoint: Obtener Modelos Disponibles

**GET** `/api/modelos-groq`

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
      "id": "llama-3.1-8b-instant",
      "nombre": "Llama 3.1 8B Instant",
      "descripcion": "Modelo rápido y ligero para respuestas instantáneas",
      "provider": "meta-llama"
    }
    // ... más modelos
  ]
}
```

### Ejemplo de Implementación

```javascript
// 1. Cargar modelos al iniciar
let modelosDisponibles = [];
let modeloSeleccionado = null;

async function cargarModelos() {
  const response = await fetch('https://proyecto-azure-backend.onrender.com/api/modelos-groq');
  const data = await response.json();
  
  modelosDisponibles = data.modelos;
  
  // Establecer modelo por defecto (el primero o uno específico)
  modeloSeleccionado = modelosDisponibles[0]?.id || null;
  
  // Poblar el selector en el HTML
  const select = document.getElementById('modelo-select');
  modelosDisponibles.forEach(modelo => {
    const option = document.createElement('option');
    option.value = modelo.id;
    option.textContent = `${modelo.nombre} - ${modelo.descripcion}`;
    select.appendChild(option);
  });
}

// 2. Obtener el modelo seleccionado cuando el usuario envía un mensaje
function obtenerModeloSeleccionado() {
  const select = document.getElementById('modelo-select');
  return select?.value || modeloSeleccionado;
}

// Llamar al cargar la página
cargarModelos();
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function ChatComponent() {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);

  useEffect(() => {
    async function cargarModelos() {
      const response = await fetch('https://proyecto-azure-backend.onrender.com/api/modelos-groq');
      const data = await response.json();
      setModelos(data.modelos);
      if (data.modelos.length > 0) {
        setModeloSeleccionado(data.modelos[0].id);
      }
    }
    cargarModelos();
  }, []);

  return (
    <div>
      <select 
        value={modeloSeleccionado || ''} 
        onChange={(e) => setModeloSeleccionado(e.target.value)}
      >
        {modelos.map(modelo => (
          <option key={modelo.id} value={modelo.id}>
            {modelo.nombre} - {modelo.descripcion}
          </option>
        ))}
      </select>
      
      {/* Resto del componente de chat */}
    </div>
  );
}
```

---

## 🧠 Sistema de Memoria/Conversación

### ¿Qué cambió?

El chat ahora tiene **memoria de conversación**. Esto significa que el bot recuerda lo que se habló anteriormente en la misma sesión.

### ¿Qué debes hacer?

1. **Guardar el `sessionId`** que devuelve el backend
2. **Enviar el `sessionId`** en cada mensaje para mantener la conversación
3. **Persistir el `sessionId`** en localStorage para mantener la conversación entre recargas de página
4. **Implementar un botón "Nueva Conversación"** que limpie el sessionId

### Cómo Funciona

- **Primera vez**: No envías `sessionId`, el backend crea uno nuevo y te lo devuelve
- **Siguientes mensajes**: Envías el mismo `sessionId` y el bot recuerda el contexto
- **Nueva conversación**: Eliminas el `sessionId` (o envías `null`) y empieza una conversación nueva

### Ejemplo de Implementación

```javascript
// Variable global para mantener la sesión
let sessionId = localStorage.getItem('chatSessionId') || null;

// Enviar mensaje con memoria
async function enviarMensaje(mensaje, modelo) {
  const body = {
    message: mensaje,
    modelo: modelo, // Opcional: si no envías, usa el por defecto
    sessionId: sessionId // Enviar sessionId para mantener memoria
  };
  
  const response = await fetch('https://proyecto-azure-backend.onrender.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  // Guardar el sessionId la primera vez
  if (!sessionId && data.sessionId) {
    sessionId = data.sessionId;
    localStorage.setItem('chatSessionId', sessionId);
  }
  
  return data;
}

// Iniciar nueva conversación
function nuevaConversacion() {
  if (sessionId) {
    // Opcional: limpiar en el backend también
    fetch(`https://proyecto-azure-backend.onrender.com/api/chat/${sessionId}`, {
      method: 'DELETE'
    });
  }
  
  sessionId = null;
  localStorage.removeItem('chatSessionId');
}

// Cargar sessionId al iniciar la página
sessionId = localStorage.getItem('chatSessionId') || null;
```

### React Example con Hook

```jsx
import { useState, useEffect } from 'react';

function useChatSession() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Cargar sessionId del localStorage al iniciar
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  const nuevaConversacion = async () => {
    if (sessionId) {
      // Limpiar en el backend
      await fetch(`https://proyecto-azure-backend.onrender.com/api/chat/${sessionId}`, {
        method: 'DELETE'
      });
    }
    setSessionId(null);
    localStorage.removeItem('chatSessionId');
  };

  const guardarSessionId = (newSessionId) => {
    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  };

  return { sessionId, nuevaConversacion, guardarSessionId };
}

function ChatComponent() {
  const { sessionId, nuevaConversacion, guardarSessionId } = useChatSession();
  const [mensajes, setMensajes] = useState([]);

  const enviarMensaje = async (texto, modelo) => {
    const response = await fetch('https://proyecto-azure-backend.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: texto,
        modelo: modelo,
        sessionId: sessionId
      })
    });

    const data = await response.json();
    
    // Guardar el nuevo sessionId si es la primera vez
    if (data.sessionId) {
      guardarSessionId(data.sessionId);
    }

    // Agregar mensajes al historial
    setMensajes(prev => [
      ...prev,
      { role: 'user', content: texto },
      { role: 'assistant', content: data.response }
    ]);

    return data;
  };

  return (
    <div>
      <button onClick={nuevaConversacion}>Nueva Conversación</button>
      {/* Resto del componente */}
    </div>
  );
}
```

---

## 📝 Formato Markdown en Respuestas

### ¿Qué cambió?

Las respuestas del chat ahora vienen en formato **Markdown** para mejor legibilidad y estructura.

### ¿Qué debes hacer?

**DEBES renderizar el Markdown** en tu frontend. No puedes simplemente mostrar el texto plano porque perderás el formato.

### Opciones para Renderizar Markdown

#### Opción 1: React con `react-markdown` (Recomendado)

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

#### Opción 2: Vue con `marked`

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

#### Opción 3: JavaScript Vanilla con `marked`

```bash
npm install marked
```

```javascript
import { marked } from 'marked';

function renderizarRespuesta(markdownText, containerId) {
  const html = marked(markdownText);
  document.getElementById(containerId).innerHTML = html;
}

// Uso
const respuesta = await enviarMensaje('¿Cuántos laptops hay?');
renderizarRespuesta(respuesta.response, 'chat-container');
```

#### Opción 4: Usar CDN (sin npm)

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  function renderizarRespuesta(markdownText, containerId) {
    const html = marked.parse(markdownText);
    document.getElementById(containerId).innerHTML = html;
  }
</script>
```

### Ejemplo de Respuesta Markdown

El backend puede responder con formato como este:

```markdown
## Información de Stock

Tenemos **2 laptops** disponibles en nuestra tienda:

### Productos Disponibles

- **MacBook Pro 14" M3** - $1999.99 (Stock: 15)
- **Laptop Dell XPS 15** - $1299.99 (Stock: 25)

¿Te gustaría más información sobre alguno de estos productos?
```

### Estilos CSS Recomendados

Si usas Markdown, considera agregar estilos para que se vea bien:

```css
.chat-message {
  line-height: 1.6;
}

.chat-message h2 {
  font-size: 1.5em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.chat-message h3 {
  font-size: 1.2em;
  margin-top: 0.8em;
  margin-bottom: 0.4em;
}

.chat-message ul, .chat-message ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.chat-message code {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.chat-message pre {
  background-color: #f4f4f4;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

.chat-message strong {
  font-weight: bold;
}
```

---

## 🎯 Detección de Intención Mejorada

### ¿Qué cambió?

El sistema ahora detecta inteligentemente qué tipo de pregunta es:
- **`"bd"`**: Requiere consulta a la base de datos (ej: "¿Cuántos laptops hay?")
- **`"web"`**: Requiere conocimiento general/web (ej: "¿Cuándo salió la Nintendo Switch?")
- **`"general"`**: Pregunta general sobre tecnología (ej: "¿Qué es un SSD?")

### ¿Qué debes hacer?

Puedes usar esta información para:
1. **Mostrar un indicador visual** del tipo de consulta
2. **Mostrar diferentes iconos** según el tipo
3. **Registrar analytics** sobre qué tipo de preguntas hace el usuario
4. **Mejorar la UX** mostrando información contextual

### Respuesta del Endpoint

```json
{
  "success": true,
  "response": "Hay 2 laptops disponibles...",
  "necesitaConsultaBD": true,
  "intencion": "bd",  // ← Nueva: "bd", "web", o "general"
  "modelo": "llama-3.3-70b-versatile",
  "sessionId": "session_1234567890_abc123"
}
```

### Ejemplo de Implementación

```javascript
async function enviarMensaje(mensaje, modelo) {
  const response = await fetch('https://proyecto-azure-backend.onrender.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje, modelo: modelo, sessionId: sessionId })
  });
  
  const data = await response.json();
  
  // Usar la intención detectada
  mostrarIndicadorIntencion(data.intencion);
  
  return data;
}

function mostrarIndicadorIntencion(intencion) {
  const indicadores = {
    'bd': { texto: 'Consultando base de datos', icono: '🗄️', color: 'blue' },
    'web': { texto: 'Buscando información', icono: '🌐', color: 'green' },
    'general': { texto: 'Pregunta general', icono: '💡', color: 'gray' }
  };
  
  const indicador = indicadores[intencion] || indicadores['general'];
  console.log(`${indicador.icono} ${indicador.texto}`);
  
  // Mostrar en la UI
  mostrarBadge(indicador.texto, indicador.color);
}
```

### React Example

```jsx
function ChatMessage({ message, intencion }) {
  const getIntencionInfo = (intencion) => {
    const map = {
      'bd': { label: 'Base de Datos', icon: '🗄️', color: '#3b82f6' },
      'web': { label: 'Búsqueda Web', icon: '🌐', color: '#10b981' },
      'general': { label: 'General', icon: '💡', color: '#6b7280' }
    };
    return map[intencion] || map['general'];
  };

  const info = getIntencionInfo(intencion);

  return (
    <div className="chat-message">
      <div className="intencion-badge" style={{ backgroundColor: info.color }}>
        {info.icon} {info.label}
      </div>
      <ReactMarkdown>{message}</ReactMarkdown>
    </div>
  );
}
```

---

## 🔌 Endpoints del Chat

### 1. Enviar Mensaje

**POST** `/api/chat`

**Body:**
```json
{
  "message": "¿Cuántos laptops hay?",
  "modelo": "llama-3.3-70b-versatile",  // Opcional
  "sessionId": "session_1234567890_abc123"  // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "response": "Hay 2 laptops disponibles...",
  "necesitaConsultaBD": true,
  "intencion": "bd",
  "modelo": "llama-3.3-70b-versatile",
  "sessionId": "session_1234567890_abc123"
}
```

### 2. Obtener Historial de Conversación

**GET** `/api/chat/historial/:sessionId`

**Respuesta:**
```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "total": 4,
  "historial": [
    { "role": "user", "content": "¿Cuántos laptops hay?" },
    { "role": "assistant", "content": "Hay 2 laptops..." },
    { "role": "user", "content": "¿Y smartphones?" },
    { "role": "assistant", "content": "Tenemos 3 smartphones..." }
  ]
}
```

**Uso:**
```javascript
async function cargarHistorial(sessionId) {
  const response = await fetch(
    `https://proyecto-azure-backend.onrender.com/api/chat/historial/${sessionId}`
  );
  const data = await response.json();
  return data.historial;
}
```

### 3. Obtener Información de Sesión

**GET** `/api/chat/sesion/:sessionId`

**Respuesta:**
```json
{
  "success": true,
  "sesion": {
    "sessionId": "session_1234567890_abc123",
    "totalMensajes": 4,
    "fechaCreacion": "2025-11-25T20:00:00.000Z",
    "ultimaActividad": "2025-11-25T20:15:00.000Z"
  }
}
```

### 4. Limpiar Conversación

**DELETE** `/api/chat/:sessionId`

**Respuesta:**
```json
{
  "success": true,
  "message": "Conversación limpiada correctamente",
  "sessionId": "session_1234567890_abc123"
}
```

**Uso:**
```javascript
async function limpiarConversacion(sessionId) {
  const response = await fetch(
    `https://proyecto-azure-backend.onrender.com/api/chat/${sessionId}`,
    { method: 'DELETE' }
  );
  const data = await response.json();
  
  // También limpiar del localStorage
  localStorage.removeItem('chatSessionId');
  
  return data;
}
```

---

## 💻 Ejemplos de Implementación Completa

### Ejemplo Completo: Vanilla JavaScript

```javascript
const API_BASE_URL = 'https://proyecto-azure-backend.onrender.com';

class ChatService {
  constructor() {
    this.sessionId = localStorage.getItem('chatSessionId') || null;
    this.modelos = [];
    this.modeloSeleccionado = null;
  }

  // 1. Cargar modelos disponibles
  async cargarModelos() {
    const response = await fetch(`${API_BASE_URL}/api/modelos-groq`);
    const data = await response.json();
    this.modelos = data.modelos;
    
    if (this.modelos.length > 0) {
      this.modeloSeleccionado = this.modelos[0].id;
    }
    
    return this.modelos;
  }

  // 2. Enviar mensaje
  async enviarMensaje(mensaje, modelo = null) {
    const body = {
      message: mensaje,
      modelo: modelo || this.modeloSeleccionado,
      sessionId: this.sessionId
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Guardar sessionId la primera vez
    if (!this.sessionId && data.sessionId) {
      this.sessionId = data.sessionId;
      localStorage.setItem('chatSessionId', this.sessionId);
    }

    return data;
  }

  // 3. Obtener historial
  async obtenerHistorial() {
    if (!this.sessionId) return [];
    
    const response = await fetch(
      `${API_BASE_URL}/api/chat/historial/${this.sessionId}`
    );
    const data = await response.json();
    return data.historial || [];
  }

  // 4. Nueva conversación
  async nuevaConversacion() {
    if (this.sessionId) {
      await fetch(`${API_BASE_URL}/api/chat/${this.sessionId}`, {
        method: 'DELETE'
      });
    }
    
    this.sessionId = null;
    localStorage.removeItem('chatSessionId');
  }

  // 5. Cambiar modelo
  cambiarModelo(modeloId) {
    this.modeloSeleccionado = modeloId;
  }
}

// Uso
const chat = new ChatService();

// Al cargar la página
chat.cargarModelos().then(() => {
  console.log('Modelos cargados:', chat.modelos);
});

// Enviar mensaje
async function enviarMensaje() {
  const input = document.getElementById('mensaje-input');
  const mensaje = input.value;
  
  const resultado = await chat.enviarMensaje(mensaje);
  
  // Renderizar respuesta en Markdown
  renderizarRespuesta(resultado.response, resultado.intencion);
  
  input.value = '';
}
```

### Ejemplo Completo: React

```jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatComponent() {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);

  const API_BASE_URL = 'https://proyecto-azure-backend.onrender.com';

  // Cargar modelos al iniciar
  useEffect(() => {
    async function cargarModelos() {
      const response = await fetch(`${API_BASE_URL}/api/modelos-groq`);
      const data = await response.json();
      setModelos(data.modelos);
      if (data.modelos.length > 0) {
        setModeloSeleccionado(data.modelos[0].id);
      }
    }

    // Cargar sessionId del localStorage
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      cargarHistorial(savedSessionId);
    }

    cargarModelos();
  }, []);

  // Cargar historial
  async function cargarHistorial(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat/historial/${sessionId}`);
    const data = await response.json();
    setMensajes(data.historial || []);
  }

  // Enviar mensaje
  async function enviarMensaje(texto) {
    setCargando(true);
    
    try {
      const body = {
        message: texto,
        modelo: modeloSeleccionado,
        sessionId: sessionId
      };

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      // Guardar sessionId la primera vez
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('chatSessionId', data.sessionId);
      }

      // Agregar mensajes al historial
      setMensajes(prev => [
        ...prev,
        { role: 'user', content: texto },
        { 
          role: 'assistant', 
          content: data.response,
          intencion: data.intencion
        }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  }

  // Nueva conversación
  async function nuevaConversacion() {
    if (sessionId) {
      await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
        method: 'DELETE'
      });
    }
    
    setSessionId(null);
    setMensajes([]);
    localStorage.removeItem('chatSessionId');
  }

  // Manejar submit del formulario
  function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.mensaje;
    if (input.value.trim()) {
      enviarMensaje(input.value);
      input.value = '';
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <select 
          value={modeloSeleccionado || ''} 
          onChange={(e) => setModeloSeleccionado(e.target.value)}
        >
          {modelos.map(modelo => (
            <option key={modelo.id} value={modelo.id}>
              {modelo.nombre}
            </option>
          ))}
        </select>
        
        <button onClick={nuevaConversacion}>Nueva Conversación</button>
      </div>

      <div className="chat-messages">
        {mensajes.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && msg.intencion && (
              <div className="intencion-badge">
                {msg.intencion === 'bd' && '🗄️ Base de Datos'}
                {msg.intencion === 'web' && '🌐 Búsqueda Web'}
                {msg.intencion === 'general' && '💡 General'}
              </div>
            )}
            {msg.role === 'assistant' ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
        {cargando && <div className="loading">Pensando...</div>}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input 
          type="text" 
          name="mensaje" 
          placeholder="Escribe tu mensaje..."
          disabled={cargando}
        />
        <button type="submit" disabled={cargando}>Enviar</button>
      </form>
    </div>
  );
}

export default ChatComponent;
```

---

## ✅ Checklist de Implementación

Usa esta lista para asegurarte de que implementaste todo correctamente:

### Selección de Modelos
- [ ] Cargar modelos disponibles al iniciar la aplicación
- [ ] Mostrar un selector (dropdown) con los modelos disponibles
- [ ] Enviar el modelo seleccionado en cada petición al chat
- [ ] Manejar el caso cuando no hay modelos disponibles

### Memoria de Conversación
- [ ] Guardar el `sessionId` que devuelve el backend
- [ ] Enviar el `sessionId` en cada mensaje
- [ ] Persistir el `sessionId` en localStorage
- [ ] Cargar el `sessionId` al iniciar la aplicación
- [ ] Implementar botón "Nueva Conversación" que limpie el sessionId
- [ ] Opcional: Cargar el historial al iniciar si hay sessionId guardado

### Renderizado de Markdown
- [ ] Instalar librería para renderizar Markdown (`react-markdown` o `marked`)
- [ ] Renderizar las respuestas del chat como Markdown (no texto plano)
- [ ] Agregar estilos CSS para que el Markdown se vea bien
- [ ] Probar que los encabezados, listas, negritas, etc. se renderizan correctamente

### Detección de Intención
- [ ] Mostrar indicador visual del tipo de intención (opcional pero recomendado)
- [ ] Usar la información de `intencion` para analytics o mejoras de UX
- [ ] Manejar los tres tipos: `"bd"`, `"web"`, `"general"`

### Endpoints Adicionales
- [ ] Implementar función para obtener historial de conversación
- [ ] Implementar función para limpiar conversación
- [ ] Manejar errores de red y respuestas del servidor

### UX/UI
- [ ] Mostrar estado de carga mientras se procesa el mensaje
- [ ] Manejar errores y mostrarlos al usuario
- [ ] Validar que el mensaje no esté vacío antes de enviar
- [ ] Deshabilitar el botón de enviar mientras se procesa
- [ ] Scroll automático al último mensaje

---

## 🚨 Errores Comunes y Soluciones

### Error: "Las respuestas se ven sin formato"
**Solución**: No estás renderizando el Markdown. Instala `react-markdown` o `marked` y renderiza las respuestas.

### Error: "El bot no recuerda la conversación anterior"
**Solución**: No estás enviando el `sessionId` en las peticiones. Asegúrate de guardarlo y enviarlo.

### Error: "No puedo cambiar de modelo"
**Solución**: Verifica que estás enviando el parámetro `modelo` en el body de la petición.

### Error: "El sessionId se pierde al recargar la página"
**Solución**: Guarda el `sessionId` en `localStorage` y cárgalo al iniciar la aplicación.

---

## 📚 Recursos Adicionales

- **Documentación completa de la API**: Ver `API_FRONTEND.md`
- **Base URL**: `https://proyecto-azure-backend.onrender.com`
- **Health Check**: `https://proyecto-azure-backend.onrender.com/health`

---

## 🎉 ¡Listo!

Con esta guía deberías poder implementar completamente el nuevo sistema de chat con todas sus funcionalidades. Si tienes dudas, revisa los ejemplos de código o consulta la documentación completa de la API.

