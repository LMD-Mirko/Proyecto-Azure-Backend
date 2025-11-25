-- ============================================
-- Base de Datos para PostgreSQL (Render)
-- Proyecto Azure Backend
-- ============================================

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS modelos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE productos (
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
);

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_compras INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true
);

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER NOT NULL,
    precio_total DECIMAL(10, 2) NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: modelos
-- ============================================
CREATE TABLE modelos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    especificaciones TEXT,
    descripcion TEXT,
    datos_adicionales JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERTAR DATOS: productos
-- ============================================
INSERT INTO productos (nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento, created_at) VALUES
('Laptop Dell XPS 15', 'Laptops', 1299.99, 25, 'Laptop de alto rendimiento con procesador Intel i7, 16GB RAM, SSD 512GB', 'Dell', 'Intel i7-12700H, 16GB DDR4, SSD 512GB NVMe, Pantalla 15.6" FHD', '2023-03-15', '2025-11-25 19:58:34'),
('MacBook Pro 14" M3', 'Laptops', 1999.99, 15, 'MacBook Pro con chip M3, perfecta para profesionales creativos', 'Apple', 'Apple M3, 16GB RAM, SSD 512GB, Pantalla 14.2" Retina', '2023-10-30', '2025-11-25 19:58:34'),
('Laptop HP Pavilion 15', 'Laptops', 699.99, 40, 'Laptop económica ideal para trabajo y estudio', 'HP', 'AMD Ryzen 5, 8GB RAM, SSD 256GB, Pantalla 15.6" HD', '2023-01-20', '2025-11-25 19:58:34'),
('Laptop Lenovo ThinkPad X1', 'Laptops', 1499.99, 20, 'Laptop empresarial ultraportátil y resistente', 'Lenovo', 'Intel i7-1355U, 16GB RAM, SSD 512GB, Pantalla 14" FHD', '2023-05-10', '2025-11-25 19:58:34'),
('iPhone 15 Pro', 'Smartphones', 999.99, 50, 'El smartphone más avanzado de Apple con chip A17 Pro', 'Apple', 'A17 Pro, 256GB almacenamiento, Cámara 48MP, Pantalla 6.1" Super Retina', '2023-09-22', '2025-11-25 19:58:34'),
('Samsung Galaxy S24 Ultra', 'Smartphones', 1199.99, 35, 'Smartphone flagship con S Pen y cámara de 200MP', 'Samsung', 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED', '2024-01-17', '2025-11-25 19:58:34'),
('Google Pixel 8 Pro', 'Smartphones', 899.99, 30, 'Smartphone con IA avanzada y cámara excepcional', 'Google', 'Tensor G3, 128GB, Cámara 50MP, Pantalla 6.7" LTPO OLED', '2023-10-04', '2025-11-25 19:58:34'),
('iPad Pro 12.9" M2', 'Tablets', 1099.99, 20, 'Tablet profesional con chip M2 y pantalla Liquid Retina XDR', 'Apple', 'Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil', '2022-10-26', '2025-11-25 19:58:34'),
('Samsung Galaxy Tab S9', 'Tablets', 799.99, 25, 'Tablet Android premium con S Pen incluido', 'Samsung', 'Snapdragon 8 Gen 2, 256GB, Pantalla 11" AMOLED, S Pen incluido', '2023-08-11', '2025-11-25 19:58:34'),
('Nintendo Switch OLED', 'Gaming', 349.99, 60, 'Consola portátil con pantalla OLED mejorada', 'Nintendo', 'Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos', '2021-10-08', '2025-11-25 19:58:34'),
('PlayStation 5', 'Gaming', 499.99, 45, 'Consola de videojuegos de última generación', 'Sony', 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing', '2020-11-12', '2025-11-25 19:58:34'),
('Xbox Series X', 'Gaming', 499.99, 40, 'Consola más potente de Microsoft', 'Microsoft', 'AMD Zen 2, 16GB GDDR6, SSD 1TB, 4K 120fps', '2020-11-10', '2025-11-25 19:58:34'),
('Monitor LG UltraGear 27"', 'Monitores', 399.99, 30, 'Monitor gaming 4K con 144Hz y HDR', 'LG', '27" 4K UHD, 144Hz, HDR10, G-Sync Compatible', '2023-06-15', '2025-11-25 19:58:34'),
('Monitor Dell UltraSharp 32"', 'Monitores', 599.99, 20, 'Monitor profesional para diseño y edición', 'Dell', '32" 4K UHD, 99% sRGB, USB-C, Pantalla IPS', '2023-04-20', '2025-11-25 19:58:34'),
('Teclado Mecánico Logitech MX', 'Periféricos', 149.99, 50, 'Teclado mecánico inalámbrico con retroiluminación RGB', 'Logitech', 'Switches mecánicos, RGB, Bluetooth y USB, Batería recargable', '2023-02-10', '2025-11-25 19:58:34'),
('Mouse Logitech G Pro X', 'Periféricos', 129.99, 55, 'Mouse gaming profesional ultra ligero', 'Logitech', '25K DPI, 63g peso, RGB, Batería 70 horas', '2023-03-05', '2025-11-25 19:58:34'),
('Auriculares Sony WH-1000XM5', 'Audio', 399.99, 35, 'Auriculares inalámbricos con cancelación de ruido activa', 'Sony', 'Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio', '2022-05-12', '2025-11-25 19:58:34'),
('AirPods Pro 2', 'Audio', 249.99, 60, 'Auriculares inalámbricos con cancelación de ruido activa', 'Apple', 'Cancelación de ruido activa, 6h batería, Estuche con carga MagSafe', '2022-09-23', '2025-11-25 19:58:34'),
('SSD Samsung 980 PRO 1TB', 'Almacenamiento', 129.99, 80, 'SSD NVMe de alto rendimiento para gaming y trabajo', 'Samsung', '1TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura', '2020-09-22', '2025-11-25 19:58:34'),
('Disco Duro Externo Seagate 2TB', 'Almacenamiento', 79.99, 70, 'Disco duro externo portátil USB 3.0', 'Seagate', '2TB, USB 3.0, Compatible con PC y Mac', '2022-01-15', '2025-11-25 19:58:34');

-- ============================================
-- INSERTAR DATOS: usuarios
-- ============================================
INSERT INTO usuarios (nombre, email, telefono, fecha_registro, total_compras, activo) VALUES
('Juan Pérez', 'juan.perez@email.com', '+34 600 123 456', '2025-11-25 19:58:34', 3, true),
('María García', 'maria.garcia@email.com', '+34 600 234 567', '2025-11-25 19:58:34', 5, true),
('Carlos López', 'carlos.lopez@email.com', '+34 600 345 678', '2025-11-25 19:58:34', 2, true),
('Ana Martínez', 'ana.martinez@email.com', '+34 600 456 789', '2025-11-25 19:58:34', 7, true),
('Luis Rodríguez', 'luis.rodriguez@email.com', '+34 600 567 890', '2025-11-25 19:58:34', 1, true),
('Laura Sánchez', 'laura.sanchez@email.com', '+34 600 678 901', '2025-11-25 19:58:34', 4, true),
('Pedro Fernández', 'pedro.fernandez@email.com', '+34 600 789 012', '2025-11-25 19:58:34', 6, true),
('Sofía Torres', 'sofia.torres@email.com', '+34 600 890 123', '2025-11-25 19:58:34', 2, true),
('Miguel Ruiz', 'miguel.ruiz@email.com', '+34 600 901 234', '2025-11-25 19:58:34', 3, true),
('Elena Díaz', 'elena.diaz@email.com', '+34 600 012 345', '2025-11-25 19:58:34', 8, true);

-- ============================================
-- INSERTAR DATOS: ventas
-- ============================================
INSERT INTO ventas (usuario_id, producto_id, cantidad, precio_total, fecha_venta) VALUES
(1, 1, 1, 1299.99, '2025-11-25 19:58:34'),
(2, 5, 2, 1999.98, '2025-11-25 19:58:34'),
(3, 10, 1, 349.99, '2025-11-25 19:58:34'),
(4, 2, 1, 1999.99, '2025-11-25 19:58:34'),
(5, 15, 1, 149.99, '2025-11-25 19:58:34');

-- ============================================
-- INSERTAR DATOS: modelos
-- ============================================
INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales, created_at, updated_at) VALUES
('iPhone 15 Pro Max', 'Smartphone', 'Apple', 'A17 Pro, 256GB, Cámara 48MP, Pantalla 6.7" Super Retina XDR', 'El smartphone más avanzado de Apple con chip A17 Pro y cámara profesional', '{"precio":1199,"stock":50,"colores":["Titanio Natural","Titanio Azul","Titanio Blanco","Titanio Negro"],"año_lanzamiento":2023}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Samsung Galaxy S24 Ultra', 'Smartphone', 'Samsung', 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED', 'Smartphone flagship con S Pen y cámara de 200MP', '{"precio":1299,"stock":35,"colores":["Negro","Violeta","Gris","Amarillo"],"año_lanzamiento":2024}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('MacBook Pro 16" M3 Max', 'Laptop', 'Apple', 'Apple M3 Max, 36GB RAM, SSD 1TB, Pantalla 16.2" Liquid Retina XDR', 'Laptop profesional de alto rendimiento para creativos', '{"precio":3999,"stock":15,"procesador":"M3 Max","memoria":"36GB","almacenamiento":"1TB SSD"}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Dell XPS 15', 'Laptop', 'Dell', 'Intel i7-13700H, 16GB RAM, SSD 512GB, Pantalla 15.6" OLED', 'Laptop premium con pantalla OLED y excelente rendimiento', '{"precio":1899,"stock":25,"procesador":"Intel i7-13700H","memoria":"16GB DDR5","almacenamiento":"512GB NVMe"}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('PlayStation 5', 'Consola', 'Sony', 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing, 4K 120fps', 'Consola de videojuegos de última generación', '{"precio":499,"stock":45,"versiones":["Standard","Digital Edition"],"año_lanzamiento":2020}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Nintendo Switch OLED', 'Consola', 'Nintendo', 'Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos', 'Consola portátil con pantalla OLED mejorada', '{"precio":349,"stock":60,"colores":["Blanco","Neón Rojo/Azul"],"año_lanzamiento":2021}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('iPad Pro 12.9" M2', 'Tablet', 'Apple', 'Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil', 'Tablet profesional con chip M2 y pantalla Liquid Retina XDR', '{"precio":1099,"stock":20,"tamaños":["11\"","12.9\""],"año_lanzamiento":2022}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Monitor LG UltraGear 27"', 'Monitor', 'LG', '27" 4K UHD, 144Hz, HDR10, G-Sync Compatible, IPS', 'Monitor gaming 4K con alta frecuencia de refresco', '{"precio":599,"stock":30,"resolucion":"3840x2160","frecuencia":"144Hz","panel":"IPS"}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Auriculares Sony WH-1000XM5', 'Audio', 'Sony', 'Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio', 'Auriculares inalámbricos premium con cancelación de ruido activa', '{"precio":399,"stock":35,"bateria":"30 horas","conectividad":"Bluetooth 5.2","cancelacion_ruido":true}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('SSD Samsung 980 PRO 2TB', 'Almacenamiento', 'Samsung', '2TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura', 'SSD NVMe de alto rendimiento para gaming y trabajo profesional', '{"precio":199,"stock":80,"capacidad":"2TB","velocidad_lectura":"7000MB/s","velocidad_escritura":"5000MB/s","interfaz":"PCIe 4.0"}'::jsonb, '2025-11-25 19:58:35', '2025-11-25 19:58:35'),
('Modelo de Prueba BD', 'Gadget', 'TestBrand', NULL, 'Verificando que se guarda en BD', '{"precio":199,"stock":15}'::jsonb, '2025-11-25 20:03:24', '2025-11-25 20:03:24');

-- ============================================
-- ÍNDICES para mejorar rendimiento
-- ============================================
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_marca ON productos(marca);
CREATE INDEX idx_modelos_tipo ON modelos(tipo);
CREATE INDEX idx_modelos_marca ON modelos(marca);
CREATE INDEX idx_ventas_usuario_id ON ventas(usuario_id);
CREATE INDEX idx_ventas_producto_id ON ventas(producto_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

