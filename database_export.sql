PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE productos (
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
    );
INSERT INTO productos VALUES(1,'Laptop Dell XPS 15','Laptops',1299.990000000000009,25,'Laptop de alto rendimiento con procesador Intel i7, 16GB RAM, SSD 512GB','Dell','Intel i7-12700H, 16GB DDR4, SSD 512GB NVMe, Pantalla 15.6" FHD','2023-03-15','2025-11-25 19:58:34');
INSERT INTO productos VALUES(2,'MacBook Pro 14" M3','Laptops',1999.990000000000009,15,'MacBook Pro con chip M3, perfecta para profesionales creativos','Apple','Apple M3, 16GB RAM, SSD 512GB, Pantalla 14.2" Retina','2023-10-30','2025-11-25 19:58:34');
INSERT INTO productos VALUES(3,'Laptop HP Pavilion 15','Laptops',699.990000000000009,40,'Laptop económica ideal para trabajo y estudio','HP','AMD Ryzen 5, 8GB RAM, SSD 256GB, Pantalla 15.6" HD','2023-01-20','2025-11-25 19:58:34');
INSERT INTO productos VALUES(4,'Laptop Lenovo ThinkPad X1','Laptops',1499.990000000000009,20,'Laptop empresarial ultraportátil y resistente','Lenovo','Intel i7-1355U, 16GB RAM, SSD 512GB, Pantalla 14" FHD','2023-05-10','2025-11-25 19:58:34');
INSERT INTO productos VALUES(5,'iPhone 15 Pro','Smartphones',999.990000000000009,50,'El smartphone más avanzado de Apple con chip A17 Pro','Apple','A17 Pro, 256GB almacenamiento, Cámara 48MP, Pantalla 6.1" Super Retina','2023-09-22','2025-11-25 19:58:34');
INSERT INTO productos VALUES(6,'Samsung Galaxy S24 Ultra','Smartphones',1199.990000000000009,35,'Smartphone flagship con S Pen y cámara de 200MP','Samsung','Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED','2024-01-17','2025-11-25 19:58:34');
INSERT INTO productos VALUES(7,'Google Pixel 8 Pro','Smartphones',899.990000000000009,30,'Smartphone con IA avanzada y cámara excepcional','Google','Tensor G3, 128GB, Cámara 50MP, Pantalla 6.7" LTPO OLED','2023-10-04','2025-11-25 19:58:34');
INSERT INTO productos VALUES(8,'iPad Pro 12.9" M2','Tablets',1099.990000000000009,20,'Tablet profesional con chip M2 y pantalla Liquid Retina XDR','Apple','Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil','2022-10-26','2025-11-25 19:58:34');
INSERT INTO productos VALUES(9,'Samsung Galaxy Tab S9','Tablets',799.990000000000009,25,'Tablet Android premium con S Pen incluido','Samsung','Snapdragon 8 Gen 2, 256GB, Pantalla 11" AMOLED, S Pen incluido','2023-08-11','2025-11-25 19:58:34');
INSERT INTO productos VALUES(10,'Nintendo Switch OLED','Gaming',349.990000000000009,60,'Consola portátil con pantalla OLED mejorada','Nintendo','Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos','2021-10-08','2025-11-25 19:58:34');
INSERT INTO productos VALUES(11,'PlayStation 5','Gaming',499.990000000000009,45,'Consola de videojuegos de última generación','Sony','AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing','2020-11-12','2025-11-25 19:58:34');
INSERT INTO productos VALUES(12,'Xbox Series X','Gaming',499.990000000000009,40,'Consola más potente de Microsoft','Microsoft','AMD Zen 2, 16GB GDDR6, SSD 1TB, 4K 120fps','2020-11-10','2025-11-25 19:58:34');
INSERT INTO productos VALUES(13,'Monitor LG UltraGear 27"','Monitores',399.990000000000009,30,'Monitor gaming 4K con 144Hz y HDR','LG','27" 4K UHD, 144Hz, HDR10, G-Sync Compatible','2023-06-15','2025-11-25 19:58:34');
INSERT INTO productos VALUES(14,'Monitor Dell UltraSharp 32"','Monitores',599.990000000000009,20,'Monitor profesional para diseño y edición','Dell','32" 4K UHD, 99% sRGB, USB-C, Pantalla IPS','2023-04-20','2025-11-25 19:58:34');
INSERT INTO productos VALUES(15,'Teclado Mecánico Logitech MX','Periféricos',149.990000000000009,50,'Teclado mecánico inalámbrico con retroiluminación RGB','Logitech','Switches mecánicos, RGB, Bluetooth y USB, Batería recargable','2023-02-10','2025-11-25 19:58:34');
INSERT INTO productos VALUES(16,'Mouse Logitech G Pro X','Periféricos',129.990000000000009,55,'Mouse gaming profesional ultra ligero','Logitech','25K DPI, 63g peso, RGB, Batería 70 horas','2023-03-05','2025-11-25 19:58:34');
INSERT INTO productos VALUES(17,'Auriculares Sony WH-1000XM5','Audio',399.990000000000009,35,'Auriculares inalámbricos con cancelación de ruido activa','Sony','Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio','2022-05-12','2025-11-25 19:58:34');
INSERT INTO productos VALUES(18,'AirPods Pro 2','Audio',249.990000000000009,60,'Auriculares inalámbricos con cancelación de ruido activa','Apple','Cancelación de ruido activa, 6h batería, Estuche con carga MagSafe','2022-09-23','2025-11-25 19:58:34');
INSERT INTO productos VALUES(19,'SSD Samsung 980 PRO 1TB','Almacenamiento',129.990000000000009,80,'SSD NVMe de alto rendimiento para gaming y trabajo','Samsung','1TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura','2020-09-22','2025-11-25 19:58:34');
INSERT INTO productos VALUES(20,'Disco Duro Externo Seagate 2TB','Almacenamiento',79.98999999999999489,70,'Disco duro externo portátil USB 3.0','Seagate','2TB, USB 3.0, Compatible con PC y Mac','2022-01-15','2025-11-25 19:58:34');
CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefono TEXT,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_compras INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1
    );
INSERT INTO usuarios VALUES(1,'Juan Pérez','juan.perez@email.com','+34 600 123 456','2025-11-25 19:58:34',3,1);
INSERT INTO usuarios VALUES(2,'María García','maria.garcia@email.com','+34 600 234 567','2025-11-25 19:58:34',5,1);
INSERT INTO usuarios VALUES(3,'Carlos López','carlos.lopez@email.com','+34 600 345 678','2025-11-25 19:58:34',2,1);
INSERT INTO usuarios VALUES(4,'Ana Martínez','ana.martinez@email.com','+34 600 456 789','2025-11-25 19:58:34',7,1);
INSERT INTO usuarios VALUES(5,'Luis Rodríguez','luis.rodriguez@email.com','+34 600 567 890','2025-11-25 19:58:34',1,1);
INSERT INTO usuarios VALUES(6,'Laura Sánchez','laura.sanchez@email.com','+34 600 678 901','2025-11-25 19:58:34',4,1);
INSERT INTO usuarios VALUES(7,'Pedro Fernández','pedro.fernandez@email.com','+34 600 789 012','2025-11-25 19:58:34',6,1);
INSERT INTO usuarios VALUES(8,'Sofía Torres','sofia.torres@email.com','+34 600 890 123','2025-11-25 19:58:34',2,1);
INSERT INTO usuarios VALUES(9,'Miguel Ruiz','miguel.ruiz@email.com','+34 600 901 234','2025-11-25 19:58:34',3,1);
INSERT INTO usuarios VALUES(10,'Elena Díaz','elena.diaz@email.com','+34 600 012 345','2025-11-25 19:58:34',8,1);
CREATE TABLE ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_total REAL NOT NULL,
      fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
INSERT INTO ventas VALUES(1,1,1,1,1299.990000000000009,'2025-11-25 19:58:34');
INSERT INTO ventas VALUES(2,2,5,2,1999.980000000000018,'2025-11-25 19:58:34');
INSERT INTO ventas VALUES(3,3,10,1,349.990000000000009,'2025-11-25 19:58:34');
INSERT INTO ventas VALUES(4,4,2,1,1999.990000000000009,'2025-11-25 19:58:34');
INSERT INTO ventas VALUES(5,5,15,1,149.990000000000009,'2025-11-25 19:58:34');
CREATE TABLE modelos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      marca TEXT,
      especificaciones TEXT,
      descripcion TEXT,
      datos_adicionales TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO modelos VALUES(1,'iPhone 15 Pro Max','Smartphone','Apple','A17 Pro, 256GB, Cámara 48MP, Pantalla 6.7" Super Retina XDR','El smartphone más avanzado de Apple con chip A17 Pro y cámara profesional','{"precio":1199,"stock":50,"colores":["Titanio Natural","Titanio Azul","Titanio Blanco","Titanio Negro"],"año_lanzamiento":2023}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(2,'Samsung Galaxy S24 Ultra','Smartphone','Samsung','Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED','Smartphone flagship con S Pen y cámara de 200MP','{"precio":1299,"stock":35,"colores":["Negro","Violeta","Gris","Amarillo"],"año_lanzamiento":2024}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(3,'MacBook Pro 16" M3 Max','Laptop','Apple','Apple M3 Max, 36GB RAM, SSD 1TB, Pantalla 16.2" Liquid Retina XDR','Laptop profesional de alto rendimiento para creativos','{"precio":3999,"stock":15,"procesador":"M3 Max","memoria":"36GB","almacenamiento":"1TB SSD"}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(4,'Dell XPS 15','Laptop','Dell','Intel i7-13700H, 16GB RAM, SSD 512GB, Pantalla 15.6" OLED','Laptop premium con pantalla OLED y excelente rendimiento','{"precio":1899,"stock":25,"procesador":"Intel i7-13700H","memoria":"16GB DDR5","almacenamiento":"512GB NVMe"}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(5,'PlayStation 5','Consola','Sony','AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing, 4K 120fps','Consola de videojuegos de última generación','{"precio":499,"stock":45,"versiones":["Standard","Digital Edition"],"año_lanzamiento":2020}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(6,'Nintendo Switch OLED','Consola','Nintendo','Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos','Consola portátil con pantalla OLED mejorada','{"precio":349,"stock":60,"colores":["Blanco","Neón Rojo/Azul"],"año_lanzamiento":2021}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(7,'iPad Pro 12.9" M2','Tablet','Apple','Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil','Tablet profesional con chip M2 y pantalla Liquid Retina XDR','{"precio":1099,"stock":20,"tamaños":["11\"","12.9\""],"año_lanzamiento":2022}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(8,'Monitor LG UltraGear 27"','Monitor','LG','27" 4K UHD, 144Hz, HDR10, G-Sync Compatible, IPS','Monitor gaming 4K con alta frecuencia de refresco','{"precio":599,"stock":30,"resolucion":"3840x2160","frecuencia":"144Hz","panel":"IPS"}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(9,'Auriculares Sony WH-1000XM5','Audio','Sony','Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio','Auriculares inalámbricos premium con cancelación de ruido activa','{"precio":399,"stock":35,"bateria":"30 horas","conectividad":"Bluetooth 5.2","cancelacion_ruido":true}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(10,'SSD Samsung 980 PRO 2TB','Almacenamiento','Samsung','2TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura','SSD NVMe de alto rendimiento para gaming y trabajo profesional','{"precio":199,"stock":80,"capacidad":"2TB","velocidad_lectura":"7000MB/s","velocidad_escritura":"5000MB/s","interfaz":"PCIe 4.0"}','2025-11-25 19:58:35','2025-11-25 19:58:35');
INSERT INTO modelos VALUES(12,'Modelo de Prueba BD','Gadget','TestBrand',NULL,'Verificando que se guarda en BD','{"precio":199,"stock":15}','2025-11-25 20:03:24','2025-11-25 20:03:24');
INSERT INTO sqlite_sequence VALUES('productos',20);
INSERT INTO sqlite_sequence VALUES('usuarios',10);
INSERT INTO sqlite_sequence VALUES('ventas',5);
INSERT INTO sqlite_sequence VALUES('modelos',12);
COMMIT;
