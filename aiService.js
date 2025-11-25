import axios from 'axios';
import natural from 'natural';
import { config } from './config.js';
import * as db from './database.js';

// Almacenamiento de conversaciones en memoria (sessionId -> objeto con historial y metadata)
const conversaciones = new Map();

// Configurar Natural para español
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmerEs;
const TfIdf = natural.TfIdf;

// Cache de intenciones detectadas para evitar llamadas repetidas
const cacheIntenciones = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Rol del sistema para el bot
const SYSTEM_ROLE = `Eres un asistente especializado en tecnología y productos tecnológicos de una tienda online.
Tu función es ayudar a los clientes con información sobre productos tecnológicos, especificaciones técnicas, comparaciones y recomendaciones.

FORMATO DE RESPUESTA:
- SIEMPRE responde en formato Markdown para mejor legibilidad
- Usa encabezados (##, ###) para organizar la información
- Usa listas con viñetas (-) o numeradas (1.) cuando sea apropiado
- Usa **negrita** para resaltar información importante
- Usa \`código\` para nombres de productos, modelos o términos técnicos
- Usa tablas cuando compares productos o muestres especificaciones
- Usa bloques de código (\`\`\`) solo si es necesario para código técnico
- Separa párrafos con líneas en blanco para mejor legibilidad

IMPORTANTE:
- Solo debes responder preguntas relacionadas con tecnología, productos tecnológicos, especificaciones técnicas, y temas relacionados.
- Si te preguntan algo fuera del contexto de tecnología, debes educadamente redirigir la conversación hacia temas tecnológicos.
- Cuando el usuario pregunte sobre información específica de la tienda (como cantidad de productos, usuarios registrados, stock, ventas, etc.), debes indicar que necesitas consultar la base de datos.
- Para preguntas generales sobre tecnología (historia, fechas de lanzamiento de productos famosos, especificaciones técnicas generales), puedes responder directamente sin consultar la BD.

Ejemplos de preguntas que requieren consulta a BD:
- "¿Cuántos laptops hay en stock?"
- "¿Cuántos usuarios están registrados?"
- "¿Qué productos de Apple tienen?"
- "¿Cuál es el precio del iPhone 15 Pro?"
- "¿Hay stock del PlayStation 5?"

Ejemplos de preguntas que NO requieren consulta a BD:
- "¿Cuándo salió la Nintendo Switch?"
- "¿Qué es un SSD?"
- "¿Cuál es la diferencia entre RAM y almacenamiento?"
- "¿Qué procesador es mejor, Intel o AMD?"

Ejemplo de formato de respuesta:
## Información del Producto

El **iPhone 15 Pro** es un smartphone avanzado con las siguientes características:

### Especificaciones principales:
- **Procesador**: A17 Pro
- **Almacenamiento**: 256GB
- **Cámara**: 48MP
- **Pantalla**: 6.1" Super Retina

### Precio y Disponibilidad
- **Precio**: $999.99
- **Stock disponible**: 50 unidades

¿Te gustaría más información sobre este producto?`;

/**
 * Detecta la intención usando NLP mejorado con Natural + LLM
 * Retorna: 'bd', 'web', o 'general'
 */
async function detectarIntencion(mensaje) {
  // Verificar cache primero
  const cacheKey = mensaje.toLowerCase().trim();
  const cached = cacheIntenciones.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.intencion;
  }
  
  const mensajeLower = mensaje.toLowerCase();
  
  // 1. Detección rápida con patrones mejorados
  const patronesBD = [
    'cuántos', 'cuántas', 'cuánto', 'cuánta',
    'hay en stock', 'hay disponibles', 'tienen en',
    'precio de', 'cuesta', 'vale',
    'qué productos', 'qué modelos',
    'stock de', 'disponibilidad de',
    'usuarios registrados', 'clientes registrados',
    'ventas', 'compras realizadas',
    'categoría', 'categorías',
    'marca', 'marcas',
    'estadísticas', 'estadistica',
    'listar productos', 'mostrar productos',
    'inventario', 'catálogo', 'catalogo',
    'disponible', 'tienen', 'tienes'
  ];
  
  const patronesWeb = [
    'cuándo salió', 'cuando salio',
    'qué es', 'que es',
    'historia de', 'origen de',
    'diferencia entre', 'comparar',
    'mejor que', 'vs', 'versus',
    'cómo funciona', 'como funciona',
    'características de', 'especificaciones técnicas generales',
    'qué significa', 'que significa',
    'definición', 'definicion'
  ];
  
  // 2. Usar NLP con Natural para análisis más profundo
  const tokens = tokenizer.tokenize(mensajeLower) || [];
  const stems = tokens.map(t => stemmer.stem(t));
  
  // Palabras clave con pesos para BD
  const palabrasBD = {
    'stock': 3, 'precio': 3, 'dispon': 2, 'producto': 2,
    'usuario': 2, 'venta': 2, 'categoria': 2, 'marca': 2,
    'inventario': 2, 'catalogo': 2, 'cuanto': 2, 'cuanta': 2
  };
  
  // Palabras clave con pesos para Web
  const palabrasWeb = {
    'historia': 3, 'cuando': 2, 'salió': 2, 'definicion': 3,
    'significa': 2, 'funciona': 2, 'diferencia': 2, 'compar': 2,
    'mejor': 2, 'versus': 2, 'vs': 2, 'origen': 2
  };
  
  let scoreBD = 0;
  let scoreWeb = 0;
  
  stems.forEach(stem => {
    Object.keys(palabrasBD).forEach(palabra => {
      if (stem.includes(palabra)) {
        scoreBD += palabrasBD[palabra];
      }
    });
    Object.keys(palabrasWeb).forEach(palabra => {
      if (stem.includes(palabra)) {
        scoreWeb += palabrasWeb[palabra];
      }
    });
  });
  
  // Verificar patrones completos también
  if (patronesBD.some(p => mensajeLower.includes(p))) {
    scoreBD += 5;
  }
  if (patronesWeb.some(p => mensajeLower.includes(p))) {
    scoreWeb += 5;
  }
  
  // Si hay una diferencia clara, usar esa intención
  if (scoreBD > scoreWeb && scoreBD >= 3) {
    const intencion = 'bd';
    cacheIntenciones.set(cacheKey, { intencion, timestamp: Date.now() });
    return intencion;
  }
  
  if (scoreWeb > scoreBD && scoreWeb >= 3) {
    const intencion = 'web';
    cacheIntenciones.set(cacheKey, { intencion, timestamp: Date.now() });
    return intencion;
  }
  
  // 3. Si no hay certeza, usar el LLM para clasificar (más preciso)
  try {
    const prompt = `Analiza esta pregunta y clasifícala en UNA de estas categorías:
- "bd": Si necesita consultar la base de datos de la tienda (stock, precios específicos, productos disponibles en la tienda, usuarios registrados, ventas)
- "web": Si necesita información general de internet (historia, fechas de lanzamiento, especificaciones técnicas generales, comparaciones, qué es algo)
- "general": Si es una pregunta general sobre tecnología que no requiere BD ni web

Pregunta: "${mensaje}"

Responde SOLO con una palabra: "bd", "web" o "general"`;

    const response = await axios.post(
      config.groq.apiUrl,
      {
        model: 'llama-3.1-8b-instant', // Modelo rápido para clasificación
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Baja temperatura para respuestas consistentes
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const intencion = response.data.choices[0].message.content.trim().toLowerCase();
    let resultado = 'general';
    
    if (intencion.includes('bd')) resultado = 'bd';
    else if (intencion.includes('web')) resultado = 'web';
    
    // Guardar en cache
    cacheIntenciones.set(cacheKey, { intencion: resultado, timestamp: Date.now() });
    return resultado;
  } catch (error) {
    console.error('Error en detección de intención con LLM, usando fallback:', error.message);
    // Fallback: usar detección básica
    const intencion = scoreBD >= scoreWeb ? 'bd' : 'general';
    cacheIntenciones.set(cacheKey, { intencion, timestamp: Date.now() });
    return intencion;
  }
}

/**
 * Detecta si la pregunta requiere consultar la base de datos (función legacy, mantenida para compatibilidad)
 */
function necesitaConsultaBD(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  const palabrasClaveBD = [
    'cuántos', 'cuántas', 'cuánto', 'cuánta',
    'hay en stock', 'hay disponibles', 'tienen en',
    'usuarios registrados', 'clientes registrados',
    'precio de', 'cuesta', 'vale',
    'qué productos', 'qué modelos',
    'stock de', 'disponibilidad de',
    'ventas', 'compras realizadas',
    'categoría', 'categorías',
    'marca', 'marcas',
    'estadísticas', 'estadistica'
  ];
  return palabrasClaveBD.some(palabra => mensajeLower.includes(palabra));
}

/**
 * Obtiene información de la BD basada en la pregunta del usuario
 */
async function obtenerInfoBD(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  let info = null;
  
  // Detectar tipo de consulta
  if (mensajeLower.includes('cuántos') || mensajeLower.includes('cuántas')) {
    if (mensajeLower.includes('laptop') || mensajeLower.includes('portátil')) {
      const laptops = await db.getProductosPorCategoria('Laptops');
      info = `Hay ${laptops.length} laptops disponibles en nuestra tienda.`;
    } else if (mensajeLower.includes('smartphone') || mensajeLower.includes('teléfono') || mensajeLower.includes('telefono')) {
      const smartphones = await db.getProductosPorCategoria('Smartphones');
      info = `Hay ${smartphones.length} smartphones disponibles en nuestra tienda.`;
    } else if (mensajeLower.includes('usuario') || mensajeLower.includes('cliente')) {
      const total = await db.contarUsuarios();
      const activos = await db.contarUsuariosActivos();
      info = `Tenemos ${total.total} usuarios registrados, de los cuales ${activos.total} están activos.`;
    } else if (mensajeLower.includes('producto')) {
      const total = await db.contarProductos();
      info = `Tenemos ${total.total} productos tecnológicos en nuestro catálogo.`;
    } else if (mensajeLower.includes('venta')) {
      const total = await db.contarVentas();
      info = `Se han realizado ${total.total} ventas en total.`;
    } else {
      // Consulta general de estadísticas
      const stats = await db.getEstadisticas();
      info = `Estadísticas de la tienda:\n- Total de productos: ${stats.totalProductos}\n- Total de usuarios: ${stats.totalUsuarios}\n- Usuarios activos: ${stats.totalUsuariosActivos}\n- Total de ventas: ${stats.totalVentas}`;
    }
  } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('vale')) {
    // Buscar producto por nombre
    const terminos = mensajeLower.split(' ').filter(p => p.length > 3);
    for (const termino of terminos) {
      const productos = await db.buscarProductos(termino);
      if (productos.length > 0) {
        const producto = productos[0];
        info = `El ${producto.nombre} tiene un precio de $${producto.precio} y hay ${producto.stock} unidades en stock.`;
        break;
      }
    }
  } else if (mensajeLower.includes('qué productos') || mensajeLower.includes('qué modelos')) {
    if (mensajeLower.includes('apple')) {
      const productos = await db.buscarProductos('Apple');
      info = `Productos de Apple disponibles:\n${productos.map(p => `- ${p.nombre} ($${p.precio}, Stock: ${p.stock})`).join('\n')}`;
    } else if (mensajeLower.includes('samsung')) {
      const productos = await db.buscarProductos('Samsung');
      info = `Productos de Samsung disponibles:\n${productos.map(p => `- ${p.nombre} ($${p.precio}, Stock: ${p.stock})`).join('\n')}`;
    } else {
      const productos = await db.getProductos();
      const categorias = [...new Set(productos.map(p => p.categoria))];
      info = `Tenemos productos en las siguientes categorías:\n${categorias.map(c => `- ${c}`).join('\n')}`;
    }
  } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible')) {
    const terminos = mensajeLower.split(' ').filter(p => p.length > 3);
    for (const termino of terminos) {
      const productos = await db.buscarProductos(termino);
      if (productos.length > 0) {
        const producto = productos[0];
        info = `El ${producto.nombre} tiene ${producto.stock} unidades disponibles en stock.`;
        break;
      }
    }
  } else if (mensajeLower.includes('categoría') || mensajeLower.includes('categoria')) {
    const stats = await db.getEstadisticas();
    info = `Productos por categoría:\n${stats.productosPorCategoria.map(c => `- ${c.categoria}: ${c.cantidad} productos`).join('\n')}`;
  }
  
  return info;
}

/**
 * Modelos disponibles de Groq
 */
export const MODELOS_GROQ = [
  {
    id: 'llama-3.3-70b-versatile',
    nombre: 'Llama 3.3 70B Versatile',
    descripcion: 'Modelo versátil y potente para tareas generales',
    provider: 'meta-llama'
  },
  {
    id: 'llama-3.1-70b-versatile',
    nombre: 'Llama 3.1 70B Versatile',
    descripcion: 'Versión anterior del modelo versátil',
    provider: 'meta-llama'
  },
  {
    id: 'llama-3.1-8b-instant',
    nombre: 'Llama 3.1 8B Instant',
    descripcion: 'Modelo rápido y ligero para respuestas instantáneas',
    provider: 'meta-llama'
  },
  {
    id: 'llama-3.1-405b-reasoning',
    nombre: 'Llama 3.1 405B Reasoning',
    descripcion: 'Modelo avanzado para razonamiento complejo',
    provider: 'meta-llama'
  },
  {
    id: 'mixtral-8x7b-32768',
    nombre: 'Mixtral 8x7B',
    descripcion: 'Modelo Mixtral de alta calidad',
    provider: 'mixtral'
  },
  {
    id: 'gemma2-9b-it',
    nombre: 'Gemma2 9B',
    descripcion: 'Modelo Gemma2 optimizado para instrucciones',
    provider: 'google'
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    nombre: 'Llama 4 Scout 17B',
    descripcion: 'Modelo especializado en instrucciones',
    provider: 'meta-llama'
  }
];

/**
 * Obtiene los modelos disponibles de Groq
 */
export function getModelosDisponibles() {
  return MODELOS_GROQ;
}

/**
 * Valida si un modelo es válido
 */
export function esModeloValido(modelo) {
  return MODELOS_GROQ.some(m => m.id === modelo);
}

/**
 * Genera un resumen del contexto cuando el historial es muy largo
 */
async function generarResumenContexto(historialAntiguo) {
  if (historialAntiguo.length === 0) return '';
  
  try {
    const contexto = historialAntiguo
      .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
      .join('\n');
    
    const prompt = `Resume brevemente esta conversación anterior manteniendo solo la información relevante para el contexto futuro. Máximo 100 palabras. Usa formato Markdown si es necesario.

Conversación:
${contexto}

Resumen:`;

    const response = await axios.post(
      config.groq.apiUrl,
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generando resumen:', error.message);
    return '';
  }
}

/**
 * Optimiza el historial para mantener contexto sin exceder tokens
 */
function optimizarHistorial(historial, maxMensajes = 12) {
  if (historial.length <= maxMensajes) {
    return { historialUsar: historial, historialAntiguo: [] };
  }
  
  // Mantener los últimos N mensajes
  const historialUsar = historial.slice(-maxMensajes);
  const historialAntiguo = historial.slice(0, historial.length - maxMensajes);
  
  return { historialUsar, historialAntiguo };
}

/**
 * Envía mensaje a Groq API con memoria mejorada y detección avanzada
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} modelo - Modelo a usar (opcional, usa el del config si no se proporciona)
 * @param {string} sessionId - ID de sesión para mantener memoria (opcional)
 * @param {Array} historial - Historial de mensajes previos (opcional)
 */
export async function chatWithAI(userMessage, modelo = null, sessionId = null, historial = []) {
  try {
    // Usar el modelo proporcionado o el del config
    const modeloAUsar = modelo || config.groq.model;
    
    // Verificar si el modelo es válido
    if (!esModeloValido(modeloAUsar)) {
      throw new Error(`Modelo "${modeloAUsar}" no es válido. Modelos disponibles: ${MODELOS_GROQ.map(m => m.id).join(', ')}`);
    }
    
    // Obtener historial de la sesión si existe
    let historialCompleto = historial;
    if (sessionId && conversaciones.has(sessionId)) {
      historialCompleto = conversaciones.get(sessionId).historial || [];
    }
    
    // Optimizar historial: mantener últimos mensajes y resumir los antiguos
    const { historialUsar, historialAntiguo } = optimizarHistorial(historialCompleto, 12);
    let resumenContexto = '';
    
    // Si hay historial antiguo, generar resumen
    if (historialAntiguo.length > 0) {
      resumenContexto = await generarResumenContexto(historialAntiguo);
    }
    
    // Detectar intención usando detección mejorada con NLP
    const intencion = await detectarIntencion(userMessage);
    
    let contextoBD = '';
    let necesitaBD = false;
    let instruccionWeb = '';
    
    // Procesar según la intención detectada
    if (intencion === 'bd') {
      necesitaBD = true;
      const infoBD = await obtenerInfoBD(userMessage);
      if (infoBD) {
        contextoBD = `\n\nINFORMACIÓN DE LA BASE DE DATOS:\n${infoBD}\n\nUsa esta información para responder al usuario de manera natural y completa en formato Markdown. Organiza la información con encabezados, listas y formato apropiado.`;
      }
    } else if (intencion === 'web') {
      instruccionWeb = '\n\nIMPORTANTE: Esta pregunta requiere información general de internet. Responde con conocimiento general sobre tecnología, historia, especificaciones técnicas generales, comparaciones, etc. SIEMPRE usa formato Markdown para estructurar tu respuesta.';
    }
    
    // Construir array de mensajes con historial optimizado
    const messages = [
      {
        role: 'system',
        content: SYSTEM_ROLE + contextoBD + instruccionWeb + 
          (resumenContexto ? `\n\nCONTEXTO DE CONVERSACIÓN ANTERIOR:\n${resumenContexto}` : '')
      }
    ];
    
    // Agregar historial reciente optimizado
    if (historialUsar && historialUsar.length > 0) {
      messages.push(...historialUsar);
    }
    
    // Agregar el nuevo mensaje del usuario
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Llamar a Groq API con configuración optimizada
    const response = await axios.post(
      config.groq.apiUrl,
      {
        model: modeloAUsar,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiResponse = response.data.choices[0].message.content;
    
    // Guardar en memoria mejorada si hay sessionId
    if (sessionId) {
      if (!conversaciones.has(sessionId)) {
        conversaciones.set(sessionId, {
          historial: [],
          createdAt: Date.now(),
          lastActivity: Date.now(),
          totalMessages: 0
        });
      }
      
      const sesion = conversaciones.get(sessionId);
      sesion.historial.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      );
      sesion.lastActivity = Date.now();
      sesion.totalMessages += 2;
      
      // Limpiar sesiones antiguas (más de 24 horas sin actividad)
      limpiarSesionesAntiguas();
    }
    
    return {
      response: aiResponse,
      necesitaConsultaBD: necesitaBD,
      intencion: intencion,
      modelo: modeloAUsar,
      sessionId: sessionId,
      tieneContexto: historialUsar.length > 0 || resumenContexto.length > 0
    };
    
  } catch (error) {
    console.error('Error al comunicarse con Groq API:', error.response?.data || error.message);
    throw new Error(`Error al procesar la solicitud: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Limpia sesiones antiguas para liberar memoria
 */
function limpiarSesionesAntiguas() {
  const ahora = Date.now();
  const TIEMPO_EXPIRACION = 24 * 60 * 60 * 1000; // 24 horas
  
  for (const [sessionId, sesion] of conversaciones.entries()) {
    if (ahora - sesion.lastActivity > TIEMPO_EXPIRACION) {
      conversaciones.delete(sessionId);
      console.log(`Sesión ${sessionId} eliminada por inactividad`);
    }
  }
}

/**
 * Obtiene el historial de una conversación
 * @param {string} sessionId - ID de la sesión
 * @returns {Array} Historial de mensajes
 */
export function obtenerHistorial(sessionId) {
  const sesion = conversaciones.get(sessionId);
  return sesion ? sesion.historial : [];
}

/**
 * Obtiene información completa de una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} Información de la sesión
 */
export function obtenerInfoSesion(sessionId) {
  const sesion = conversaciones.get(sessionId);
  if (!sesion) return null;
  
  return {
    sessionId: sessionId,
    historial: sesion.historial,
    createdAt: sesion.createdAt,
    lastActivity: sesion.lastActivity,
    totalMessages: sesion.totalMessages,
    duracionMinutos: Math.floor((sesion.lastActivity - sesion.createdAt) / 60000)
  };
}

/**
 * Limpia una conversación de la memoria
 * @param {string} sessionId - ID de la sesión
 */
export function limpiarConversacion(sessionId) {
  conversaciones.delete(sessionId);
}

/**
 * Obtiene todas las sesiones activas (útil para debugging)
 * @returns {Array} Array de sessionIds
 */
export function obtenerSesionesActivas() {
  return Array.from(conversaciones.keys());
}

