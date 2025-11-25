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
    // PostgreSQL - Crear tablas automáticamente si no existen
    try {
      await pool.query('SELECT 1');
      console.log('Base de datos PostgreSQL conectada correctamente');
      
      // Crear tablas si no existen
      await pool.query(`
        CREATE TABLE IF NOT EXISTS productos (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          precio DECIMAL(10, 2) NOT NULL,
          stock INTEGER NOT NULL,
          descripcion TEXT,
          marca VARCHAR(100),
          especificaciones TEXT,
          fecha_lanzamiento VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          telefono VARCHAR(50),
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_compras INTEGER DEFAULT 0,
          activo BOOLEAN DEFAULT true
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ventas (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER,
          producto_id INTEGER,
          cantidad INTEGER NOT NULL,
          precio_total DECIMAL(10, 2) NOT NULL,
          fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS modelos (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          tipo VARCHAR(100) NOT NULL,
          marca VARCHAR(100),
          especificaciones TEXT,
          descripcion TEXT,
          datos_adicionales JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Crear índices si no existen
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)
      `).catch(() => {}); // Ignorar si ya existe
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_modelos_tipo ON modelos(tipo)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_modelos_marca ON modelos(marca)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id ON ventas(usuario_id)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_ventas_producto_id ON ventas(producto_id)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)
      `).catch(() => {});
      
      console.log('✅ Tablas de PostgreSQL creadas/verificadas correctamente');
      
      // Verificar si hay datos, si no, insertar datos de ejemplo
      const productosCount = await pool.query('SELECT COUNT(*) as count FROM productos');
      if (parseInt(productosCount.rows[0].count) === 0) {
        console.log('📦 Insertando datos de ejemplo...');
        // Insertar productos de ejemplo
        await pool.query(`
          INSERT INTO productos (nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento) VALUES
          ('Laptop Dell XPS 15', 'Laptops', 1299.99, 25, 'Laptop de alto rendimiento con procesador Intel i7, 16GB RAM, SSD 512GB', 'Dell', 'Intel i7-12700H, 16GB DDR4, SSD 512GB NVMe, Pantalla 15.6" FHD', '2023-03-15'),
          ('MacBook Pro 14" M3', 'Laptops', 1999.99, 15, 'MacBook Pro con chip M3, perfecta para profesionales creativos', 'Apple', 'Apple M3, 16GB RAM, SSD 512GB, Pantalla 14.2" Retina', '2023-10-30'),
          ('iPhone 15 Pro', 'Smartphones', 999.99, 50, 'El smartphone más avanzado de Apple con chip A17 Pro', 'Apple', 'A17 Pro, 256GB almacenamiento, Cámara 48MP, Pantalla 6.1" Super Retina', '2023-09-22'),
          ('Samsung Galaxy S24 Ultra', 'Smartphones', 1199.99, 35, 'Smartphone flagship con S Pen y cámara de 200MP', 'Samsung', 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED', '2024-01-17'),
          ('PlayStation 5', 'Gaming', 499.99, 45, 'Consola de videojuegos de última generación', 'Sony', 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing', '2020-11-12')
        `);
        
        // Insertar usuarios de ejemplo
        await pool.query(`
          INSERT INTO usuarios (nombre, email, telefono, total_compras) VALUES
          ('Juan Pérez', 'juan.perez@email.com', '+34 600 123 456', 3),
          ('María García', 'maria.garcia@email.com', '+34 600 234 567', 5),
          ('Carlos López', 'carlos.lopez@email.com', '+34 600 345 678', 2)
        `);
        
        console.log('✅ Datos de ejemplo insertados');
      }
      
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
