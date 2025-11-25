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
function obtenerInfoBD(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  let info = null;
  
  // Detectar tipo de consulta
  if (mensajeLower.includes('cuántos') || mensajeLower.includes('cuántas')) {
    if (mensajeLower.includes('laptop') || mensajeLower.includes('portátil')) {
      const laptops = db.getProductosPorCategoria('Laptops');
      info = `Hay ${laptops.length} laptops disponibles en nuestra tienda.`;
    } else if (mensajeLower.includes('smartphone') || mensajeLower.includes('teléfono') || mensajeLower.includes('telefono')) {
      const smartphones = db.getProductosPorCategoria('Smartphones');
      info = `Hay ${smartphones.length} smartphones disponibles en nuestra tienda.`;
    } else if (mensajeLower.includes('usuario') || mensajeLower.includes('cliente')) {
      const total = db.contarUsuarios();
      const activos = db.contarUsuariosActivos();
      info = `Tenemos ${total.total} usuarios registrados, de los cuales ${activos.total} están activos.`;
    } else if (mensajeLower.includes('producto')) {
      const total = db.contarProductos();
      info = `Tenemos ${total.total} productos tecnológicos en nuestro catálogo.`;
    } else if (mensajeLower.includes('venta')) {
      const total = db.contarVentas();
      info = `Se han realizado ${total.total} ventas en total.`;
    } else {
      // Consulta general de estadísticas
      const stats = db.getEstadisticas();
      info = `Estadísticas de la tienda:\n- Total de productos: ${stats.totalProductos}\n- Total de usuarios: ${stats.totalUsuarios}\n- Usuarios activos: ${stats.totalUsuariosActivos}\n- Total de ventas: ${stats.totalVentas}`;
    }
  } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('vale')) {
    // Buscar producto por nombre
    const terminos = mensajeLower.split(' ').filter(p => p.length > 3);
    for (const termino of terminos) {
      const productos = db.buscarProductos(termino);
      if (productos.length > 0) {
        const producto = productos[0];
        info = `El ${producto.nombre} tiene un precio de $${producto.precio} y hay ${producto.stock} unidades en stock.`;
        break;
      }
    }
  } else if (mensajeLower.includes('qué productos') || mensajeLower.includes('qué modelos')) {
    if (mensajeLower.includes('apple')) {
      const productos = db.buscarProductos('Apple');
      info = `Productos de Apple disponibles:\n${productos.map(p => `- ${p.nombre} ($${p.precio}, Stock: ${p.stock})`).join('\n')}`;
    } else if (mensajeLower.includes('samsung')) {
      const productos = db.buscarProductos('Samsung');
      info = `Productos de Samsung disponibles:\n${productos.map(p => `- ${p.nombre} ($${p.precio}, Stock: ${p.stock})`).join('\n')}`;
    } else {
      const productos = db.getProductos();
      const categorias = [...new Set(productos.map(p => p.categoria))];
      info = `Tenemos productos en las siguientes categorías:\n${categorias.map(c => `- ${c}`).join('\n')}`;
    }
  } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible')) {
    const terminos = mensajeLower.split(' ').filter(p => p.length > 3);
    for (const termino of terminos) {
      const productos = db.buscarProductos(termino);
      if (productos.length > 0) {
        const producto = productos[0];
        info = `El ${producto.nombre} tiene ${producto.stock} unidades disponibles en stock.`;
        break;
      }
    }
  } else if (mensajeLower.includes('categoría') || mensajeLower.includes('categoria')) {
    const stats = db.getEstadisticas();
    info = `Productos por categoría:\n${stats.productosPorCategoria.map(c => `- ${c.categoria}: ${c.cantidad} productos`).join('\n')}`;
  }
  
  return info;
}

/**
 * Envía mensaje a Groq API
 */
export async function chatWithAI(userMessage) {
  try {
    // Verificar si necesita consultar BD
    const necesitaBD = necesitaConsultaBD(userMessage);
    let contextoBD = '';
    
    if (necesitaBD) {
      const infoBD = obtenerInfoBD(userMessage);
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
        model: config.groq.model,
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
      modelo: config.groq.model
    };
    
  } catch (error) {
    console.error('Error al comunicarse con Groq API:', error.response?.data || error.message);
    throw new Error(`Error al procesar la solicitud: ${error.response?.data?.error?.message || error.message}`);
  }
}

