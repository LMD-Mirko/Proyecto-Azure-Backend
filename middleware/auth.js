import { obtenerUsuarioDesdeToken } from '../authService.js';

/**
 * Middleware para verificar autenticación con JWT
 */
export const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autenticación requerido',
        message: 'Debes incluir un token JWT en el header Authorization: Bearer <token>'
      });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    const usuario = await obtenerUsuarioDesdeToken(token);
    
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido o expirado',
      message: error.message 
    });
  }
};

/**
 * Middleware opcional - agrega usuario si existe token, pero no requiere autenticación
 */
export const autenticarOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const usuario = await obtenerUsuarioDesdeToken(token);
      req.usuario = usuario;
    }
    
    next();
  } catch (error) {
    // Si falla, continuar sin usuario (es opcional)
    next();
  }
};

