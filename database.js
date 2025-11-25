import { config } from './config.js';

let db = null;
let pool = null;
const usePostgres = config.database.usePostgres;

// Inicializar conexión según el entorno
if (usePostgres) {
  // PostgreSQL para Render
  const pg = await import('pg');
  const { Pool } = pg.default;
  
  // Render siempre requiere SSL, así que lo habilitamos cuando hay DATABASE_URL
  pool = new Pool({
    connectionString: config.database.url,
    ssl: {
      rejectUnauthorized: false  // Render requiere SSL pero con esta configuración
    }
  });
  
  console.log('📊 Usando PostgreSQL (Render)');
  console.log('🔗 Conectado a:', config.database.url.replace(/:[^:@]+@/, ':****@')); // Ocultar password en logs
} else {
  // SQLite para desarrollo local
  const Database = (await import('better-sqlite3')).default;
  db = new Database(config.database.path);
  console.log('📊 Usando SQLite (Local)');
}

// Helper para convertir SQL de PostgreSQL a SQLite
function convertSQL(sql) {
  if (!usePostgres) {
    // Convertir $1, $2, etc. a ? para SQLite (SQLite usa ? para todos los parámetros)
    return sql.replace(/\$\d+/g, '?');
  }
  return sql;
}

// Helper para ejecutar consultas
async function query(sql, params = []) {
  const finalSQL = convertSQL(sql);
  if (usePostgres) {
    const result = await pool.query(finalSQL, params);
    return result.rows;
  } else {
    const stmt = db.prepare(finalSQL);
    if (finalSQL.trim().toUpperCase().startsWith('SELECT')) {
      return params.length > 0 ? stmt.all(...params) : stmt.all();
    } else {
      return stmt.run(...params);
    }
  }
}

// Helper para obtener un solo registro
async function queryOne(sql, params = []) {
  const finalSQL = convertSQL(sql);
  if (usePostgres) {
    const result = await pool.query(finalSQL, params);
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare(finalSQL);
    return params.length > 0 ? stmt.get(...params) : stmt.get();
  }
}

// Helper para ejecutar comandos (CREATE, INSERT, UPDATE, DELETE)
async function execute(sql, params = []) {
  if (usePostgres) {
    const result = await pool.query(sql, params);
    return result;
  } else {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }
}

// Crear tablas
export async function initDatabase() {
  if (usePostgres) {
    // PostgreSQL - Las tablas se crean con el script SQL en Render
    // Solo verificamos la conexión
    try {
      await pool.query('SELECT 1');
      console.log('Base de datos PostgreSQL conectada correctamente');
    } catch (error) {
      console.error('Error conectando a PostgreSQL:', error);
      throw error;
    }
  } else {
    // SQLite - Crear tablas localmente
    db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER NOT NULL,
        descripcion TEXT,
        marca TEXT,
        especificaciones TEXT,
        fecha_lanzamiento TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefono TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_compras INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        producto_id INTEGER,
        cantidad INTEGER NOT NULL,
        precio_total REAL NOT NULL,
        fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS modelos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        marca TEXT,
        especificaciones TEXT,
        descripcion TEXT,
        datos_adicionales TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Base de datos inicializada correctamente');
  }
}

// Funciones para consultar productos
export async function getProductos() {
  return await query('SELECT * FROM productos');
}

export async function getProductosPorCategoria(categoria) {
  return await query('SELECT * FROM productos WHERE categoria = $1', [categoria]);
}

export async function getProductoPorId(id) {
  return await queryOne('SELECT * FROM productos WHERE id = $1', [id]);
}

export async function contarProductos() {
  const result = await queryOne('SELECT COUNT(*) as total FROM productos');
  return result;
}

export async function contarProductosPorCategoria(categoria) {
  const result = await queryOne('SELECT COUNT(*) as total FROM productos WHERE categoria = $1', [categoria]);
  return result;
}

export async function buscarProductos(termino) {
  const searchTerm = `%${termino}%`;
  return await query(
    `SELECT * FROM productos 
     WHERE nombre LIKE $1 OR descripcion LIKE $2 OR marca LIKE $3`,
    [searchTerm, searchTerm, searchTerm]
  );
}

// Funciones para consultar usuarios
export async function getUsuarios() {
  return await query('SELECT * FROM usuarios');
}

export async function contarUsuarios() {
  const result = await queryOne('SELECT COUNT(*) as total FROM usuarios');
  return result;
}

export async function contarUsuariosActivos() {
  const result = await queryOne('SELECT COUNT(*) as total FROM usuarios WHERE activo = $1', [usePostgres ? true : 1]);
  return result;
}

// Funciones para consultar ventas
export async function getVentas() {
  return await query('SELECT * FROM ventas');
}

export async function contarVentas() {
  const result = await queryOne('SELECT COUNT(*) as total FROM ventas');
  return result;
}

export async function getVentasPorUsuario(usuarioId) {
  return await query('SELECT * FROM ventas WHERE usuario_id = $1', [usuarioId]);
}

// Función para obtener estadísticas generales
export async function getEstadisticas() {
  const totalProductos = await contarProductos();
  const totalUsuarios = await contarUsuarios();
  const totalUsuariosActivos = await contarUsuariosActivos();
  const totalVentas = await contarVentas();
  
  const productosPorCategoria = await query(`
    SELECT categoria, COUNT(*) as cantidad 
    FROM productos 
    GROUP BY categoria
  `);

  return {
    totalProductos: totalProductos.total,
    totalUsuarios: totalUsuarios.total,
    totalUsuariosActivos: totalUsuariosActivos.total,
    totalVentas: totalVentas.total,
    productosPorCategoria
  };
}

// Funciones para consultar modelos
export async function getModelos() {
  return await query('SELECT * FROM modelos ORDER BY created_at DESC');
}

export async function getModeloPorId(id) {
  return await queryOne('SELECT * FROM modelos WHERE id = $1', [id]);
}

export async function getModelosPorTipo(tipo) {
  return await query('SELECT * FROM modelos WHERE tipo = $1 ORDER BY created_at DESC', [tipo]);
}

export async function getModelosPorMarca(marca) {
  return await query('SELECT * FROM modelos WHERE marca = $1 ORDER BY created_at DESC', [marca]);
}

export async function buscarModelos(termino) {
  const searchTerm = `%${termino}%`;
  return await query(`
    SELECT * FROM modelos 
    WHERE nombre LIKE $1 OR descripcion LIKE $2 OR marca LIKE $3 OR tipo LIKE $4
    ORDER BY created_at DESC
  `, [searchTerm, searchTerm, searchTerm, searchTerm]);
}

export async function crearModelo(modelo) {
  const datosAdicionales = modelo.datos_adicionales 
    ? (usePostgres ? JSON.stringify(modelo.datos_adicionales) : JSON.stringify(modelo.datos_adicionales))
    : null;
  
  if (usePostgres) {
    const result = await pool.query(`
      INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `, [
      modelo.nombre,
      modelo.tipo,
      modelo.marca || null,
      modelo.especificaciones || null,
      modelo.descripcion || null,
      datosAdicionales
    ]);
    return result.rows[0];
  } else {
    const stmt = db.prepare(`
      INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      modelo.nombre,
      modelo.tipo,
      modelo.marca || null,
      modelo.especificaciones || null,
      modelo.descripcion || null,
      datosAdicionales
    );
    
    return await getModeloPorId(result.lastInsertRowid);
  }
}

export async function actualizarModelo(id, modelo) {
  const datosAdicionales = modelo.datos_adicionales 
    ? JSON.stringify(modelo.datos_adicionales)
    : null;
  
  if (usePostgres) {
    const result = await pool.query(`
      UPDATE modelos 
      SET nombre = $1, tipo = $2, marca = $3, especificaciones = $4, 
          descripcion = $5, datos_adicionales = $6::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      modelo.nombre,
      modelo.tipo,
      modelo.marca || null,
      modelo.especificaciones || null,
      modelo.descripcion || null,
      datosAdicionales,
      id
    ]);
    return result.rows[0];
  } else {
    const stmt = db.prepare(`
      UPDATE modelos 
      SET nombre = ?, tipo = ?, marca = ?, especificaciones = ?, 
          descripcion = ?, datos_adicionales = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      modelo.nombre,
      modelo.tipo,
      modelo.marca || null,
      modelo.especificaciones || null,
      modelo.descripcion || null,
      datosAdicionales,
      id
    );
    
    return await getModeloPorId(id);
  }
}

export async function eliminarModelo(id) {
  if (usePostgres) {
    return await pool.query('DELETE FROM modelos WHERE id = $1', [id]);
  } else {
    const stmt = db.prepare('DELETE FROM modelos WHERE id = ?');
    return stmt.run(id);
  }
}

export async function contarModelos() {
  const result = await queryOne('SELECT COUNT(*) as total FROM modelos');
  return result;
}

export async function contarModelosPorTipo(tipo) {
  const result = await queryOne('SELECT COUNT(*) as total FROM modelos WHERE tipo = $1', [tipo]);
  return result;
}

// Exportar db solo para SQLite (compatibilidad con scripts existentes)
export { db };
