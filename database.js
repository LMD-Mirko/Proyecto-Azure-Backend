import Database from 'better-sqlite3';
import { config } from './config.js';

const db = new Database(config.database.path);

// Crear tablas
export function initDatabase() {
  // Tabla de productos tecnológicos
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

  // Tabla de usuarios registrados
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

  // Tabla de ventas
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

  // Tabla de modelos (flexible para diferentes tipos de datos tecnológicos)
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

// Funciones para consultar productos
export function getProductos() {
  return db.prepare('SELECT * FROM productos').all();
}

export function getProductosPorCategoria(categoria) {
  return db.prepare('SELECT * FROM productos WHERE categoria = ?').all(categoria);
}

export function getProductoPorId(id) {
  return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
}

export function contarProductos() {
  return db.prepare('SELECT COUNT(*) as total FROM productos').get();
}

export function contarProductosPorCategoria(categoria) {
  return db.prepare('SELECT COUNT(*) as total FROM productos WHERE categoria = ?').get(categoria);
}

export function buscarProductos(termino) {
  return db.prepare(`
    SELECT * FROM productos 
    WHERE nombre LIKE ? OR descripcion LIKE ? OR marca LIKE ?
  `).all(`%${termino}%`, `%${termino}%`, `%${termino}%`);
}

// Funciones para consultar usuarios
export function getUsuarios() {
  return db.prepare('SELECT * FROM usuarios').all();
}

export function contarUsuarios() {
  return db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
}

export function contarUsuariosActivos() {
  return db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1').get();
}

// Funciones para consultar ventas
export function getVentas() {
  return db.prepare('SELECT * FROM ventas').all();
}

export function contarVentas() {
  return db.prepare('SELECT COUNT(*) as total FROM ventas').get();
}

export function getVentasPorUsuario(usuarioId) {
  return db.prepare('SELECT * FROM ventas WHERE usuario_id = ?').all(usuarioId);
}

// Función para obtener estadísticas generales
export function getEstadisticas() {
  const totalProductos = contarProductos().total;
  const totalUsuarios = contarUsuarios().total;
  const totalUsuariosActivos = contarUsuariosActivos().total;
  const totalVentas = contarVentas().total;
  
  const productosPorCategoria = db.prepare(`
    SELECT categoria, COUNT(*) as cantidad 
    FROM productos 
    GROUP BY categoria
  `).all();

  return {
    totalProductos,
    totalUsuarios,
    totalUsuariosActivos,
    totalVentas,
    productosPorCategoria
  };
}

// Funciones para consultar modelos
export function getModelos() {
  return db.prepare('SELECT * FROM modelos ORDER BY created_at DESC').all();
}

export function getModeloPorId(id) {
  return db.prepare('SELECT * FROM modelos WHERE id = ?').get(id);
}

export function getModelosPorTipo(tipo) {
  return db.prepare('SELECT * FROM modelos WHERE tipo = ? ORDER BY created_at DESC').all(tipo);
}

export function getModelosPorMarca(marca) {
  return db.prepare('SELECT * FROM modelos WHERE marca = ? ORDER BY created_at DESC').all(marca);
}

export function buscarModelos(termino) {
  return db.prepare(`
    SELECT * FROM modelos 
    WHERE nombre LIKE ? OR descripcion LIKE ? OR marca LIKE ? OR tipo LIKE ?
    ORDER BY created_at DESC
  `).all(`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`);
}

export function crearModelo(modelo) {
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
    modelo.datos_adicionales ? JSON.stringify(modelo.datos_adicionales) : null
  );
  
  return getModeloPorId(result.lastInsertRowid);
}

export function actualizarModelo(id, modelo) {
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
    modelo.datos_adicionales ? JSON.stringify(modelo.datos_adicionales) : null,
    id
  );
  
  return getModeloPorId(id);
}

export function eliminarModelo(id) {
  const stmt = db.prepare('DELETE FROM modelos WHERE id = ?');
  return stmt.run(id);
}

export function contarModelos() {
  return db.prepare('SELECT COUNT(*) as total FROM modelos').get();
}

export function contarModelosPorTipo(tipo) {
  return db.prepare('SELECT COUNT(*) as total FROM modelos WHERE tipo = ?').get(tipo);
}

export { db };

