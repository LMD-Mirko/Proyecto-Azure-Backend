import axios from 'axios';
import { config } from './config.js';
import * as db from './database.js';

// Rol del sistema para el bot
const SYSTEM_ROLE = `Eres un asistente especializado en tecnología y productos tecnológicos de una tienda online.
Tu función es ayudar a los clientes con información sobre productos tecnológicos, especificaciones técnicas, comparaciones y recomendaciones.

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
- "¿Qué procesador es mejor, Intel o AMD?"`;

/**
 * Detecta si la pregunta requiere consultar la base de datos
 */
function necesitaConsultaBD(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  
  // Palabras clave que indican necesidad de consultar BD
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
 * Envía mensaje a Groq API
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} modelo - Modelo a usar (opcional, usa el del config si no se proporciona)
 */
export async function chatWithAI(userMessage, modelo = null) {
  try {
    // Usar el modelo proporcionado o el del config
    const modeloAUsar = modelo || config.groq.model;
    
    // Verificar si el modelo es válido
    if (!esModeloValido(modeloAUsar)) {
      throw new Error(`Modelo "${modeloAUsar}" no es válido. Modelos disponibles: ${MODELOS_GROQ.map(m => m.id).join(', ')}`);
    }
    
    // Verificar si necesita consultar BD
    const necesitaBD = necesitaConsultaBD(userMessage);
    let contextoBD = '';
    
    if (necesitaBD) {
      const infoBD = await obtenerInfoBD(userMessage);
      if (infoBD) {
        contextoBD = `\n\nINFORMACIÓN DE LA BASE DE DATOS:\n${infoBD}\n\nUsa esta información para responder al usuario de manera natural y completa.`;
      }
    }
    
    // Preparar mensajes para Groq
    const messages = [
      {
        role: 'system',
        content: SYSTEM_ROLE + contextoBD
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
    
    // Llamar a Groq API
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
    
    return {
      response: aiResponse,
      necesitaConsultaBD: necesitaBD,
      modelo: modeloAUsar
    };
    
  } catch (error) {
    console.error('Error al comunicarse con Groq API:', error.response?.data || error.message);
    throw new Error(`Error al procesar la solicitud: ${error.response?.data?.error?.message || error.message}`);
  }
}

