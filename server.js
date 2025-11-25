import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './database.js';
import { chatWithAI, getModelosDisponibles } from './aiService.js';
import * as db from './database.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar base de datos
(async () => {
  await initDatabase();
})();

// Rutas

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Backend con IA Groq y Base de Datos',
    status: 'running',
    ai_provider: 'Groq',
    model: config.groq.model
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Endpoint para obtener modelos disponibles de Groq
app.get('/api/modelos-groq', (req, res) => {
  try {
    const modelos = getModelosDisponibles();
    res.json({ 
      success: true, 
      total: modelos.length,
      modelos 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint principal de chat con IA
app.post('/api/chat', async (req, res) => {
  try {
    const { message, modelo } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'El campo "message" es requerido y debe ser un string' 
      });
    }
    
    // Si se proporciona un modelo, validarlo; si no, usar el del config
    const result = await chatWithAI(message, modelo);
    
    res.json({
      success: true,
      response: result.response,
      necesitaConsultaBD: result.necesitaConsultaBD,
      modelo: result.modelo
    });
    
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud',
      message: error.message 
    });
  }
});

// Endpoints de base de datos (opcionales, para debugging)

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await db.getProductos();
    res.json({ success: true, productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener productos por categoría
app.get('/api/productos/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const productos = await db.getProductosPorCategoria(categoria);
    res.json({ success: true, productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar productos
app.get('/api/productos/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Parámetro "q" es requerido' });
    }
    const productos = await db.buscarProductos(q);
    res.json({ success: true, productos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.getEstadisticas();
    res.json({ success: true, estadisticas: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await db.getUsuarios();
    res.json({ success: true, usuarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ENDPOINTS DE MODELOS ==========

// GET - Obtener todos los modelos
app.get('/api/modelos', async (req, res) => {
  try {
    const { tipo, marca, buscar } = req.query;
    
    let modelos;
    
    if (buscar) {
      modelos = await db.buscarModelos(buscar);
    } else if (tipo) {
      modelos = await db.getModelosPorTipo(tipo);
    } else if (marca) {
      modelos = await db.getModelosPorMarca(marca);
    } else {
      modelos = await db.getModelos();
    }
    
    // Parsear datos_adicionales si es JSON (PostgreSQL ya lo devuelve como objeto)
    const modelosParsed = modelos.map(modelo => {
      if (modelo.datos_adicionales && typeof modelo.datos_adicionales === 'string') {
        try {
          modelo.datos_adicionales = JSON.parse(modelo.datos_adicionales);
        } catch (e) {
          // Si no es JSON válido, dejarlo como está
        }
      }
      return modelo;
    });
    
    res.json({ 
      success: true, 
      total: modelosParsed.length,
      modelos: modelosParsed 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener estadísticas de modelos (debe ir antes de /:id)
app.get('/api/modelos/estadisticas', async (req, res) => {
  try {
    const total = await db.contarModelos();
    const modelos = await db.getModelos();
    
    // Agrupar por tipo
    const porTipo = {};
    modelos.forEach(modelo => {
      if (!porTipo[modelo.tipo]) {
        porTipo[modelo.tipo] = 0;
      }
      porTipo[modelo.tipo]++;
    });
    
    // Agrupar por marca
    const porMarca = {};
    modelos.forEach(modelo => {
      if (modelo.marca) {
        if (!porMarca[modelo.marca]) {
          porMarca[modelo.marca] = 0;
        }
        porMarca[modelo.marca]++;
      }
    });
    
    res.json({ 
      success: true, 
      estadisticas: {
        total: total.total,
        porTipo,
        porMarca
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener un modelo por ID
app.get('/api/modelos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const modelo = await db.getModeloPorId(id);
    
    if (!modelo) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    
    // Parsear datos_adicionales si es JSON (PostgreSQL ya lo devuelve como objeto)
    if (modelo.datos_adicionales && typeof modelo.datos_adicionales === 'string') {
      try {
        modelo.datos_adicionales = JSON.parse(modelo.datos_adicionales);
      } catch (e) {
        // Si no es JSON válido, dejarlo como está
      }
    }
    
    res.json({ success: true, modelo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear un nuevo modelo
app.post('/api/modelos', async (req, res) => {
  try {
    const { nombre, tipo, marca, especificaciones, descripcion, datos_adicionales } = req.body;
    
    if (!nombre || !tipo) {
      return res.status(400).json({ 
        error: 'Los campos "nombre" y "tipo" son requeridos' 
      });
    }
    
    const nuevoModelo = await db.crearModelo({
      nombre,
      tipo,
      marca,
      especificaciones,
      descripcion,
      datos_adicionales
    });
    
    // Parsear datos_adicionales si es JSON (PostgreSQL ya lo devuelve como objeto)
    if (nuevoModelo.datos_adicionales && typeof nuevoModelo.datos_adicionales === 'string') {
      try {
        nuevoModelo.datos_adicionales = JSON.parse(nuevoModelo.datos_adicionales);
      } catch (e) {
        // Si no es JSON válido, dejarlo como está
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Modelo creado correctamente',
      modelo: nuevoModelo 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar un modelo
app.put('/api/modelos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, marca, especificaciones, descripcion, datos_adicionales } = req.body;
    
    const modeloExistente = await db.getModeloPorId(id);
    if (!modeloExistente) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    
    const modeloActualizado = await db.actualizarModelo(id, {
      nombre: nombre || modeloExistente.nombre,
      tipo: tipo || modeloExistente.tipo,
      marca: marca !== undefined ? marca : modeloExistente.marca,
      especificaciones: especificaciones !== undefined ? especificaciones : modeloExistente.especificaciones,
      descripcion: descripcion !== undefined ? descripcion : modeloExistente.descripcion,
      datos_adicionales: datos_adicionales !== undefined ? datos_adicionales : modeloExistente.datos_adicionales
    });
    
    // Parsear datos_adicionales si es JSON (PostgreSQL ya lo devuelve como objeto)
    if (modeloActualizado.datos_adicionales && typeof modeloActualizado.datos_adicionales === 'string') {
      try {
        modeloActualizado.datos_adicionales = JSON.parse(modeloActualizado.datos_adicionales);
      } catch (e) {
        // Si no es JSON válido, dejarlo como está
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Modelo actualizado correctamente',
      modelo: modeloActualizado 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar un modelo
app.delete('/api/modelos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const modelo = await db.getModeloPorId(id);
    if (!modelo) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    
    await db.eliminarModelo(id);
    
    res.json({ 
      success: true, 
      message: 'Modelo eliminado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🤖 Modelo de IA: ${config.groq.model}`);
  console.log(`📊 Base de datos inicializada`);
});

