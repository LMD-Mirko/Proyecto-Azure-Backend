import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './database.js';
import { chatWithAI, getModelosDisponibles, obtenerHistorial, limpiarConversacion, obtenerInfoSesion } from './aiService.js';
import * as db from './database.js';
import {
  registrarUsuario,
  autenticarUsuario,
  buscarUsuarioPorId,
  buscarTodosLosUsuarios,
  actualizarPerfil,
  cambiarPassword,
  eliminarUsuario,
  generarToken
} from './authService.js';
import { autenticar, autenticarOpcional } from './middleware/auth.js';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos antes de iniciar el servidor
let dbInitialized = false;

(async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    await initDatabase();
    dbInitialized = true;
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
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

// ========== RUTAS DE AUTENTICACIÓN ==========

// POST - Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombreCompleto, email, password, telefono } = req.body;
    
    if (!nombreCompleto || !email || !password) {
      return res.status(400).json({
        error: 'Nombre completo, email y contraseña son requeridos'
      });
    }
    
    const usuario = await registrarUsuario({
      nombreCompleto,
      email,
      password,
      telefono
    });
    
    // Generar token
    const { password: _, ...usuarioSinPassword } = usuario;
    const token = generarToken(usuario);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      usuario: usuarioSinPassword,
      token
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// POST - Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }
    
    const resultado = await autenticarUsuario(email, password);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      ...resultado
    });
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
});

// GET - Obtener perfil del usuario autenticado
app.get('/api/auth/perfil', autenticar, async (req, res) => {
  try {
    const usuario = await buscarUsuarioPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const { password: _, ...usuarioSinPassword } = usuario;
    
    res.json({
      success: true,
      usuario: usuarioSinPassword
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
});

// PUT - Actualizar perfil
app.put('/api/auth/perfil', autenticar, async (req, res) => {
  try {
    const { nombreCompleto, telefono } = req.body;
    const usuarioActualizado = await actualizarPerfil(req.usuario.id, {
      nombreCompleto,
      telefono
    });
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// PUT - Cambiar contraseña
app.put('/api/auth/cambiar-password', autenticar, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }
    
    const resultado = await cambiarPassword(
      req.usuario.id,
      passwordActual,
      passwordNueva
    );
    
    res.json({
      success: true,
      ...resultado
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// GET - Verificar token
app.get('/api/auth/verify', autenticar, (req, res) => {
  res.json({
    success: true,
    usuario: req.usuario,
    message: 'Token válido'
  });
});

// ========== CRUD DE USUARIOS ==========

// GET - Obtener todos los usuarios (solo usuario autenticado)
app.get('/api/usuarios', autenticar, async (req, res) => {
  try {
    const usuarios = await buscarTodosLosUsuarios();
    res.json({
      success: true,
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// GET - Obtener un usuario por ID
app.get('/api/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id);
    
    // Solo puede ver su propio perfil
    if (req.usuario.id !== usuarioId) {
      return res.status(403).json({
        error: 'No tienes permiso para ver este usuario'
      });
    }
    
    const usuario = await buscarUsuarioPorId(usuarioId);
    
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }
    
    const { password: _, ...usuarioSinPassword } = usuario;
    
    res.json({
      success: true,
      usuario: usuarioSinPassword
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
});

// PUT - Actualizar usuario (solo propio perfil)
app.put('/api/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id);
    
    // Solo puede actualizar su propio perfil
    if (req.usuario.id !== usuarioId) {
      return res.status(403).json({
        error: 'No tienes permiso para actualizar este usuario'
      });
    }
    
    const { nombreCompleto, telefono } = req.body;
    const usuarioActualizado = await actualizarPerfil(usuarioId, {
      nombreCompleto,
      telefono
    });
    
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// DELETE - Eliminar usuario (solo propio perfil)
app.delete('/api/usuarios/:id', autenticar, async (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id);
    
    // Solo puede eliminar su propia cuenta
    if (req.usuario.id !== usuarioId) {
      return res.status(403).json({
        error: 'No tienes permiso para eliminar este usuario'
      });
    }
    
    await eliminarUsuario(usuarioId);
    
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
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

// Endpoint principal de chat con IA (con memoria y detección mejorada)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, modelo, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'El campo "message" es requerido y debe ser un string' 
      });
    }
    
    // Generar sessionId si no existe
    const sesion = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Obtener historial si existe
    const historial = sessionId ? obtenerHistorial(sessionId) : [];
    
    // Llamar al chat con memoria
    const result = await chatWithAI(message, modelo, sesion, historial);
    
    res.json({
      success: true,
      response: result.response,
      necesitaConsultaBD: result.necesitaConsultaBD,
      intencion: result.intencion, // Nueva: tipo de intención detectada
      modelo: result.modelo,
      sessionId: result.sessionId // Devolver el sessionId para que el frontend lo use
    });
    
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud',
      message: error.message 
    });
  }
});

// Endpoint para obtener el historial de una conversación
app.get('/api/chat/historial/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const historial = obtenerHistorial(sessionId);
    
    res.json({
      success: true,
      sessionId: sessionId,
      total: historial.length,
      historial: historial
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener información completa de una sesión
app.get('/api/chat/sesion/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const infoSesion = obtenerInfoSesion(sessionId);
    
    if (!infoSesion) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sesión no encontrada' 
      });
    }
    
    res.json({
      success: true,
      sesion: infoSesion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para limpiar una conversación
app.delete('/api/chat/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    limpiarConversacion(sessionId);
    
    res.json({ 
      success: true, 
      message: 'Conversación limpiada correctamente',
      sessionId: sessionId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Iniciar servidor después de inicializar la base de datos
const PORT = config.port;

// Función para iniciar el servidor después de inicializar la base de datos
async function iniciarServidor() {
  // Esperar a que la base de datos se inicialice
  while (!dbInitialized) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🤖 Modelo de IA: ${config.groq.model}`);
    console.log(`📊 Base de datos: ${config.database.usePostgres ? 'PostgreSQL (Render)' : 'SQLite (Local)'}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Iniciar el servidor
iniciarServidor().catch(error => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

