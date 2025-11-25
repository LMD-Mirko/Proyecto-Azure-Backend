import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { db, pool } from './database.js';

const JWT_SECRET = config.auth.jwtSecret;
const JWT_EXPIRES_IN = config.auth.jwtExpiresIn;

/**
 * Registra un nuevo usuario
 */
export async function registrarUsuario(datosUsuario) {
  const { nombreCompleto, email, password, telefono } = datosUsuario;
  
  // Validaciones
  if (!nombreCompleto || !email || !password) {
    throw new Error('Nombre completo, email y contraseña son requeridos');
  }
  
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Verificar si el email ya existe
  const usuarioExistente = await buscarUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }
  
  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Insertar usuario
  if (config.database.usePostgres) {
    const result = await pool.query(`
      INSERT INTO usuarios (nombre_completo, email, password, telefono, metodo_auth)
      VALUES ($1, $2, $3, $4, 'local')
      RETURNING id, nombre_completo, email, telefono, fecha_registro, metodo_auth
    `, [nombreCompleto, email, passwordHash, telefono || null]);
    
    return result.rows[0];
  } else {
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre_completo, email, password, telefono, metodo_auth)
      VALUES (?, ?, ?, ?, 'local')
    `);
    
    const result = stmt.run(nombreCompleto, email, passwordHash, telefono || null);
    return await buscarUsuarioPorId(result.lastInsertRowid);
  }
}

/**
 * Autentica un usuario con email y password
 */
export async function autenticarUsuario(email, password) {
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos');
  }
  
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }
  
  // Verificar si es usuario local (tiene password)
  if (!usuario.password) {
    throw new Error('Usuario no tiene contraseña configurada');
  }
  
  // Verificar contraseña
  const passwordValido = await bcrypt.compare(password, usuario.password);
  if (!passwordValido) {
    throw new Error('Credenciales inválidas');
  }
  
  // Actualizar fecha de último login
  await actualizarUltimoLogin(usuario.id);
  
  // Generar token JWT
  const token = generarToken(usuario);
  
  // Retornar usuario sin password
  const { password: _, ...usuarioSinPassword } = usuario;
  
  return {
    usuario: usuarioSinPassword,
    token
  };
}

/**
 * Busca un usuario por email
 */
export async function buscarUsuarioPorEmail(email) {
  if (config.database.usePostgres) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
    return stmt.get(email) || null;
  }
}

/**
 * Busca un usuario por ID
 */
export async function buscarUsuarioPorId(id) {
  if (config.database.usePostgres) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
    return stmt.get(id) || null;
  }
}

/**
 * Busca todos los usuarios (sin contraseñas)
 */
export async function buscarTodosLosUsuarios() {
  if (config.database.usePostgres) {
    const result = await pool.query(`
      SELECT id, nombre_completo, email, telefono, fecha_registro, 
             fecha_ultimo_login, total_compras, activo
      FROM usuarios
      ORDER BY fecha_registro DESC
    `);
    return result.rows;
  } else {
    const stmt = db.prepare(`
      SELECT id, nombre_completo, email, telefono, fecha_registro, 
             fecha_ultimo_login, total_compras, activo
      FROM usuarios
      ORDER BY fecha_registro DESC
    `);
    return stmt.all();
  }
}

/**
 * Elimina un usuario (soft delete - marca como inactivo)
 */
export async function eliminarUsuario(usuarioId) {
  if (config.database.usePostgres) {
    await pool.query(`
      UPDATE usuarios 
      SET activo = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [usuarioId]);
  } else {
    const stmt = db.prepare(`
      UPDATE usuarios 
      SET activo = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(usuarioId);
  }
}

/**
 * Actualiza la fecha de último login
 */
async function actualizarUltimoLogin(usuarioId) {
  if (config.database.usePostgres) {
    await pool.query(`
      UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = $1
    `, [usuarioId]);
  } else {
    const stmt = db.prepare('UPDATE usuarios SET fecha_ultimo_login = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(usuarioId);
  }
}

/**
 * Genera un token JWT
 */
export function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    email: usuario.email,
    nombreCompleto: usuario.nombre_completo || usuario.nombre
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica un token JWT
 */
export function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Obtiene el usuario desde el token
 */
export async function obtenerUsuarioDesdeToken(token) {
  try {
    const decoded = verificarToken(token);
    const usuario = await buscarUsuarioPorId(decoded.id);
    
    if (!usuario || !usuario.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }
    
    const { password: _, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  } catch (error) {
    throw new Error('Token inválido o usuario no encontrado');
  }
}

/**
 * Actualiza el perfil del usuario
 */
export async function actualizarPerfil(usuarioId, datosActualizacion) {
  const { nombreCompleto, telefono } = datosActualizacion;
  const campos = [];
  const valores = [];
  
  if (nombreCompleto) {
    campos.push('nombre_completo');
    valores.push(nombreCompleto);
  }
  
  if (telefono !== undefined) {
    campos.push('telefono');
    valores.push(telefono);
  }
  
  if (campos.length === 0) {
    throw new Error('No hay campos para actualizar');
  }
  
  if (config.database.usePostgres) {
    const setClause = campos.map((campo, index) => `${campo} = $${index + 1}`).join(', ');
    valores.push(usuarioId);
    
    const result = await pool.query(`
      UPDATE usuarios 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${valores.length}
      RETURNING id, nombre_completo, email, telefono, avatar_url, metodo_auth, fecha_registro
    `, valores);
    
    return result.rows[0];
  } else {
    const setClause = campos.map(campo => `${campo} = ?`).join(', ');
    valores.push(usuarioId);
    
    const stmt = db.prepare(`
      UPDATE usuarios 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(...valores);
    return await buscarUsuarioPorId(usuarioId);
  }
}

/**
 * Cambia la contraseña del usuario
 */
export async function cambiarPassword(usuarioId, passwordActual, passwordNueva) {
  const usuario = await buscarUsuarioPorId(usuarioId);
  
  if (!usuario || !usuario.password) {
    throw new Error('Usuario no encontrado o no tiene contraseña local');
  }
  
  // Verificar contraseña actual
  const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
  if (!passwordValido) {
    throw new Error('Contraseña actual incorrecta');
  }
  
  if (passwordNueva.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
  }
  
  // Hash de la nueva contraseña
  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  
  // Actualizar
  if (config.database.usePostgres) {
    await pool.query(`
      UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [passwordHash, usuarioId]);
  } else {
    const stmt = db.prepare('UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(passwordHash, usuarioId);
  }
  
  return { mensaje: 'Contraseña actualizada correctamente' };
}

