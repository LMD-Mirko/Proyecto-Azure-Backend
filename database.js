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
          nombre_completo VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          telefono VARCHAR(50),
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_compras INTEGER DEFAULT 0,
          activo BOOLEAN DEFAULT true,
          -- Campos para OAuth
          google_id VARCHAR(255) UNIQUE,
          avatar_url TEXT,
          metodo_auth VARCHAR(50) DEFAULT 'local',
          email_verificado BOOLEAN DEFAULT false,
          token_verificacion VARCHAR(255),
          fecha_ultimo_login TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Crear índices para mejor rendimiento
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)
      `).catch(() => {});
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id)
      `).catch(() => {});
      
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
      
      // Migrar estructura de tabla usuarios si es necesario
      await migrarTablaUsuarios();
      
      // Crear usuarios por defecto si no existen
          await crearUsuariosPorDefecto();
      
      // Verificar si hay datos, si no, insertar datos de ejemplo
      const productosCount = await pool.query('SELECT COUNT(*) as count FROM productos');
      if (parseInt(productosCount.rows[0].count) === 0) {
        console.log('📦 Insertando datos de ejemplo (productos)...');

        // Productos de ejemplo más completos para las vistas
        await pool.query(`
          INSERT INTO productos (nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento) VALUES
          ('Laptop Dell XPS 15', 'Laptops', 1299.99, 25, 'Laptop de alto rendimiento con procesador Intel i7, 16GB RAM, SSD 512GB', 'Dell', 'Intel i7-12700H, 16GB DDR4, SSD 512GB NVMe, Pantalla 15.6" FHD', '2023-03-15'),
          ('MacBook Pro 14" M3', 'Laptops', 1999.99, 15, 'MacBook Pro con chip M3, perfecta para profesionales creativos', 'Apple', 'Apple M3, 16GB RAM, SSD 512GB, Pantalla 14.2" Retina', '2023-10-30'),
          ('Laptop HP Pavilion 15', 'Laptops', 699.99, 40, 'Laptop económica ideal para trabajo y estudio', 'HP', 'AMD Ryzen 5, 8GB RAM, SSD 256GB, Pantalla 15.6" HD', '2023-01-20'),
          ('Lenovo ThinkPad X1', 'Laptops', 1499.99, 20, 'Laptop empresarial ultraportátil y resistente', 'Lenovo', 'Intel i7-1355U, 16GB RAM, SSD 512GB, Pantalla 14" FHD', '2023-05-10'),
          ('iPhone 15 Pro', 'Smartphones', 999.99, 50, 'El smartphone más avanzado de Apple con chip A17 Pro', 'Apple', 'A17 Pro, 256GB almacenamiento, Cámara 48MP, Pantalla 6.1" Super Retina', '2023-09-22'),
          ('Samsung Galaxy S24 Ultra', 'Smartphones', 1199.99, 35, 'Smartphone flagship con S Pen y cámara de 200MP', 'Samsung', 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED', '2024-01-17'),
          ('Google Pixel 8 Pro', 'Smartphones', 899.99, 30, 'Smartphone con IA avanzada y cámara excepcional', 'Google', 'Tensor G3, 128GB, Cámara 50MP, Pantalla 6.7" LTPO OLED', '2023-10-04'),
          ('iPad Pro 12.9" M2', 'Tablets', 1099.99, 20, 'Tablet profesional con chip M2 y pantalla Liquid Retina XDR', 'Apple', 'Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil', '2022-10-26'),
          ('Nintendo Switch OLED', 'Gaming', 349.99, 60, 'Consola portátil con pantalla OLED mejorada', 'Nintendo', 'Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos', '2021-10-08'),
          ('PlayStation 5', 'Gaming', 499.99, 45, 'Consola de videojuegos de última generación', 'Sony', 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing', '2020-11-12'),
          ('Xbox Series X', 'Gaming', 499.99, 40, 'Consola potente de Microsoft', 'Microsoft', 'AMD Zen 2, 16GB GDDR6, SSD 1TB, 4K 120fps', '2020-11-10'),
          ('Monitor LG UltraGear 27"', 'Monitores', 399.99, 30, 'Monitor gaming 4K con 144Hz y HDR', 'LG', '27" 4K UHD, 144Hz, HDR10, G-Sync Compatible', '2023-06-15'),
          ('Auriculares Sony WH-1000XM5', 'Audio', 399.99, 35, 'Auriculares inalámbricos con cancelación de ruido activa', 'Sony', 'Cancelación de ruido ANC, 30h batería, Bluetooth 5.2', '2022-05-12'),
          ('AirPods Pro 2', 'Audio', 249.99, 60, 'Auriculares inalámbricos con cancelación de ruido activa', 'Apple', 'Cancelación de ruido activa, Estuche con carga MagSafe', '2022-09-23'),
          ('SSD Samsung 980 PRO 1TB', 'Almacenamiento', 129.99, 80, 'SSD NVMe de alto rendimiento para gaming y trabajo', 'Samsung', '1TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura', '2020-09-22'),
          ('Router ASUS ROG AXE300', 'Redes', 299.99, 25, 'Router WiFi 6E para gaming y altas velocidades', 'ASUS', 'WiFi 6E, Tri-band, 10Gbps WAN', '2024-02-10'),
          ('Cámara Canon EOS R6', 'Cámaras', 2499.99, 10, 'Cámara mirrorless profesional con estabilización', 'Canon', 'CMOS 20MP, 4K60, IBIS', '2021-07-15'),
          ('Impresora HP LaserJet Pro', 'Impresoras', 199.99, 30, 'Impresora láser monocromo para oficina pequeña', 'HP', 'Monocromo, USB, Ethernet, Wi-Fi', '2022-08-05')
        `);

        console.log('✅ Productos de ejemplo insertados');
      }

      // Insertar modelos por defecto si no existen
      const modelosCount = await pool.query('SELECT COUNT(*) as count FROM modelos');
      if (parseInt(modelosCount.rows[0].count) === 0) {
        console.log('📦 Insertando datos de ejemplo (modelos)...');
        await pool.query(`
          INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales) VALUES
          ('iPhone 15 Pro Max', 'Smartphone', 'Apple', 'A17 Pro, 256GB, Cámara 48MP, Pantalla 6.7"', 'Smartphone premium con cámara profesional', $1::jsonb),
          ('Samsung Galaxy S24 Ultra', 'Smartphone', 'Samsung', 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP', 'Smartphone flagship con S Pen', $2::jsonb),
          ('MacBook Pro 16" M3 Max', 'Laptop', 'Apple', 'M3 Max, 36GB RAM, SSD 1TB', 'Laptop profesional para creativos', $3::jsonb),
          ('PlayStation 5', 'Consola', 'Sony', 'AMD Zen 2, 16GB GDDR6, SSD 825GB', 'Consola de última generación', $4::jsonb),
          ('Nintendo Switch OLED', 'Consola', 'Nintendo', 'Pantalla OLED 7", 64GB', 'Consola portátil', $5::jsonb)
        `, [
          JSON.stringify({ precio: 1199, stock: 50, colores: ['Titanio', 'Azul'] }),
          JSON.stringify({ precio: 1299, stock: 35, colores: ['Negro', 'Violeta'] }),
          JSON.stringify({ precio: 3999, stock: 15 }),
          JSON.stringify({ precio: 499, stock: 45 }),
          JSON.stringify({ precio: 349, stock: 60 })
        ]);

        console.log('✅ Modelos de ejemplo insertados');
      }

      // Insertar ventas de ejemplo si no existen
      const ventasCount = await pool.query('SELECT COUNT(*) as count FROM ventas');
      if (parseInt(ventasCount.rows[0].count) === 0) {
        console.log('📦 Insertando ventas de ejemplo (Postgres)...');
        await pool.query(`
          INSERT INTO ventas (usuario_id, producto_id, cantidad, precio_total) VALUES
          (1, 1, 1, 1299.99),
          (2, 5, 2, 1999.98),
          (3, 10, 1, 349.99),
          (4, 2, 1, 1999.99),
          (5, 11, 1, 499.99),
          (6, 13, 2, 799.98),
          (7, 17, 1, 2499.99),
          (7, 18, 1, 199.99)
        `);
        console.log('✅ Ventas de ejemplo insertadas (Postgres)');
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
        nombre_completo TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        telefono TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_compras INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        -- Campos para OAuth
        google_id TEXT UNIQUE,
        avatar_url TEXT,
        metodo_auth TEXT DEFAULT 'local',
        email_verificado INTEGER DEFAULT 0,
        token_verificacion TEXT,
        fecha_ultimo_login DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear índices
    db.exec(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id)`);

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

    // Crear usuarios por defecto si no existen
    await crearUsuariosPorDefecto();

    // Si no hay productos -> insertar datos de ejemplo para vistas (SQLite)
    try {
      const productosCountStmt = db.prepare('SELECT COUNT(*) as count FROM productos');
      const productosCount = productosCountStmt.get();
      if (productosCount && productosCount.count === 0) {
        console.log('📦 Insertando datos de ejemplo (productos) en SQLite...');
        const insert = db.prepare(`
          INSERT INTO productos (nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const ejemplos = [
          ['Router ASUS ROG AXE300', 'Redes', 299.99, 25, 'Router WiFi 6E para gaming y altas velocidades', 'ASUS', 'WiFi 6E, Tri-band, 10Gbps WAN', '2024-02-10'],
          ['Cámara Canon EOS R6', 'Cámaras', 2499.99, 10, 'Cámara mirrorless profesional con estabilización', 'Canon', 'CMOS 20MP, 4K60, IBIS', '2021-07-15'],
          ['Impresora HP LaserJet Pro', 'Impresoras', 199.99, 30, 'Impresora láser monocromo para oficina pequeña', 'HP', 'Monocromo, USB, Ethernet, Wi-Fi', '2022-08-05'],
          ['Google Nest Audio', 'Smart Home', 99.99, 50, 'Altavoz inteligente para reproducir música y controlar tu casa', 'Google', 'Altavoz inteligente con Google Assistant', '2021-10-05'],
          ['Ring Video Doorbell', 'Smart Home', 129.99, 40, 'Timbre inteligente con video y detección de movimiento', 'Ring', 'Video 1080p, detección de movimiento', '2020-06-01'],
          ['Fitbit Charge 6', 'Wearables', 179.99, 60, 'Pulsera de actividad con GPS y monitoreo avanzado de salud', 'Fitbit', 'GPS, Monitor de sueño, SpO2', '2024-01-20'],
          ['DJI Mini 4', 'Drones', 899.99, 12, 'Drone compacto para fotografía aérea', 'DJI', '4K, 3-ejes, 30min vuelo', '2023-09-10'],
          ['Logitech StreamCam', 'Cámaras', 169.99, 35, 'Cámara para streaming 1080p/60fps', 'Logitech', 'USB-C, 1080p/60fps, autofoco', '2022-03-12']
        ];

        const insertMany = db.transaction((items) => {
          for (const it of items) insert.run(...it);
        });

        insertMany(ejemplos);
        console.log('✅ Productos de ejemplo insertados (SQLite)');
      }

      // Insertar ventas de ejemplo en SQLite si no existen
      try {
        const ventasCountStmt = db.prepare('SELECT COUNT(*) as count FROM ventas');
        const ventasCount = ventasCountStmt.get();
        if (ventasCount && ventasCount.count === 0) {
          console.log('📦 Insertando ventas de ejemplo (SQLite)...');
          const insertVenta = db.prepare(`
            INSERT INTO ventas (usuario_id, producto_id, cantidad, precio_total) VALUES (?, ?, ?, ?)
          `);

          const ventasEjemplo = [
            [1, 1, 1, 1299.99],
            [2, 5, 2, 1999.98],
            [3, 10, 1, 349.99],
            [4, 2, 1, 1999.99],
            [5, 11, 1, 499.99],
            [6, 13, 2, 799.98]
          ];

          const insertManyVentas = db.transaction((items) => {
            for (const v of items) insertVenta.run(...v);
          });

          insertManyVentas(ventasEjemplo);
          console.log('✅ Ventas de ejemplo insertadas (SQLite)');
        }
      } catch (e) {
        console.error('⚠️ Error al insertar ventas SQLite:', e.message);
      }

      // Modelos en SQLite
      const modelosCountStmt = db.prepare('SELECT COUNT(*) as count FROM modelos');
      const modelosCount = modelosCountStmt.get();
      if (modelosCount && modelosCount.count === 0) {
        console.log('📦 Insertando datos de ejemplo (modelos) en SQLite...');

        const insertModelo = db.prepare(`
          INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const modelosEjemplo = [
          ['Google Nest Audio', 'Smart Speaker', 'Google', 'Altavoz inteligente, 1 unidad', 'Altavoz inteligente para el hogar', JSON.stringify({precio:99, stock:50})],
          ['Bose QuietComfort 45', 'Audio', 'Bose', 'Cancelación de ruido, 24h batería', 'Auriculares premium', JSON.stringify({precio:349, stock:20})],
          ['Fitbit Charge 6', 'Wearable', 'Fitbit', 'Fitness tracker, GPS integrado', 'Pulsera de actividad avanzada', JSON.stringify({precio:179, stock:60})],
          ['DJI Mini 4', 'Drone', 'DJI', '4K, 3-eixos, 30min vuelo', 'Drone compacto', JSON.stringify({precio:899, stock:12})]
        ];

        const insertManyModelos = db.transaction((items) => {
          for (const m of items) insertModelo.run(...m);
        });

        insertManyModelos(modelosEjemplo);
        console.log('✅ Modelos de ejemplo insertados (SQLite)');
      }
    } catch (error) {
      console.error('⚠️ Error al insertar seeds adicionales en SQLite:', error.message);
    }
  }
}

// Función para migrar la tabla usuarios si tiene estructura antigua
async function migrarTablaUsuarios() {
  if (!usePostgres) return;
  
  try {
    // Verificar si existe la columna nombre_completo
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'nombre_completo'
    `);
    
    // Si no existe nombre_completo, verificar si existe nombre (estructura antigua)
    if (checkColumn.rows.length === 0) {
      const checkOldColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'nombre'
      `);
      
      if (checkOldColumn.rows.length > 0) {
        console.log('🔄 Migrando tabla usuarios: renombrando columna "nombre" a "nombre_completo"');
        // Renombrar columna nombre a nombre_completo
        await pool.query(`
          ALTER TABLE usuarios RENAME COLUMN nombre TO nombre_completo
        `);
        console.log('✅ Columna renombrada correctamente');
      }
    }
    
    // Verificar y agregar columnas faltantes si es necesario
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
    `);
    
    const columnNames = columns.rows.map(row => row.column_name);
    
    // Agregar columnas que puedan faltar
    if (!columnNames.includes('password')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN password VARCHAR(255)`);
      console.log('✅ Columna "password" agregada');
    }
    
    if (!columnNames.includes('telefono')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(50)`);
      console.log('✅ Columna "telefono" agregada');
    }
    
    if (!columnNames.includes('metodo_auth')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN metodo_auth VARCHAR(50) DEFAULT 'local'`);
      console.log('✅ Columna "metodo_auth" agregada');
    }
    
    if (!columnNames.includes('email_verificado')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN DEFAULT false`);
      console.log('✅ Columna "email_verificado" agregada');
    }
    
    if (!columnNames.includes('fecha_ultimo_login')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN fecha_ultimo_login TIMESTAMP`);
      console.log('✅ Columna "fecha_ultimo_login" agregada');
    }
    
    if (!columnNames.includes('updated_at')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('✅ Columna "updated_at" agregada');
    }
    
  } catch (error) {
    console.error('⚠️ Error en migración de tabla usuarios:', error.message);
    // No lanzar error para no detener el inicio del servidor
  }
}

// Función para crear usuarios por defecto
async function crearUsuariosPorDefecto() {
  const bcrypt = await import('bcrypt');
  
  const usuariosPorDefecto = [
    {
      nombreCompleto: 'Mirko Limas',
      email: 'limasmirko@gmail.com',
      password: '1234567lp'
    },
    {
      nombreCompleto: 'Shandler',
      email: 'shandler@gmail.com',
      password: '1234567lp'
    }
  ];

  // Añadir más usuarios por defecto para poblar las vistas
  usuariosPorDefecto.push(
    { nombreCompleto: 'Juan Pérez', email: 'juan.perez@email.com', password: '1234567lp' },
    { nombreCompleto: 'María García', email: 'maria.garcia@email.com', password: '1234567lp' },
    { nombreCompleto: 'Carlos López', email: 'carlos.lopez@email.com', password: '1234567lp' },
    { nombreCompleto: 'Ana Martínez', email: 'ana.martinez@email.com', password: '1234567lp' },
    { nombreCompleto: 'Laura Sánchez', email: 'laura.sanchez@email.com', password: '1234567lp' }
  );
  
  try {
    for (const usuario of usuariosPorDefecto) {
      // Verificar si el usuario ya existe
      let usuarioExistente;
      
      if (usePostgres) {
        const result = await pool.query('SELECT id FROM usuarios WHERE email = $1', [usuario.email]);
        usuarioExistente = result.rows[0];
      } else {
        const stmt = db.prepare('SELECT id FROM usuarios WHERE email = ?');
        usuarioExistente = stmt.get(usuario.email);
      }
      
      if (!usuarioExistente) {
        // Hash de la contraseña
        const passwordHash = await bcrypt.default.hash(usuario.password, 10);
        
        // Insertar usuario
        if (usePostgres) {
          await pool.query(`
            INSERT INTO usuarios (nombre_completo, email, password, metodo_auth, activo, email_verificado)
            VALUES ($1, $2, $3, 'local', true, true)
            ON CONFLICT (email) DO NOTHING
          `, [usuario.nombreCompleto, usuario.email, passwordHash]);
          console.log(`✅ Usuario por defecto creado: ${usuario.email}`);
        } else {
          const stmt = db.prepare(`
            INSERT INTO usuarios (nombre_completo, email, password, metodo_auth, activo, email_verificado)
            VALUES (?, ?, ?, 'local', 1, 1)
          `);
          try {
            stmt.run(usuario.nombreCompleto, usuario.email, passwordHash);
            console.log(`✅ Usuario por defecto creado: ${usuario.email}`);
          } catch (error) {
            // Ignorar si ya existe (UNIQUE constraint)
            if (!error.message.includes('UNIQUE constraint')) {
              throw error;
            }
          }
        }
      } else {
        console.log(`ℹ️  Usuario ya existe: ${usuario.email}`);
      }
    }
  } catch (error) {
    console.error('Error creando usuarios por defecto:', error);
    // No lanzar error para no detener el inicio del servidor
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

// Exportar db y pool para uso en otros módulos
export { db, pool };
