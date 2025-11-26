import { initDatabase } from '../database.js';
import { db } from '../database.js';

// Inicializar base de datos
initDatabase();

// Datos falsos de productos tecnológicos
const productos = [
  {
    nombre: 'Laptop Dell XPS 15',
    categoria: 'Laptops',
    precio: 1299.99,
    stock: 25,
    descripcion: 'Laptop de alto rendimiento con procesador Intel i7, 16GB RAM, SSD 512GB',
    marca: 'Dell',
    especificaciones: 'Intel i7-12700H, 16GB DDR4, SSD 512GB NVMe, Pantalla 15.6" FHD',
    fecha_lanzamiento: '2023-03-15'
  },
  {
    nombre: 'MacBook Pro 14" M3',
    categoria: 'Laptops',
    precio: 1999.99,
    stock: 15,
    descripcion: 'MacBook Pro con chip M3, perfecta para profesionales creativos',
    marca: 'Apple',
    especificaciones: 'Apple M3, 16GB RAM, SSD 512GB, Pantalla 14.2" Retina',
    fecha_lanzamiento: '2023-10-30'
  },
  {
    nombre: 'Laptop HP Pavilion 15',
    categoria: 'Laptops',
    precio: 699.99,
    stock: 40,
    descripcion: 'Laptop económica ideal para trabajo y estudio',
    marca: 'HP',
    especificaciones: 'AMD Ryzen 5, 8GB RAM, SSD 256GB, Pantalla 15.6" HD',
    fecha_lanzamiento: '2023-01-20'
  },
  {
    nombre: 'Laptop Lenovo ThinkPad X1',
    categoria: 'Laptops',
    precio: 1499.99,
    stock: 20,
    descripcion: 'Laptop empresarial ultraportátil y resistente',
    marca: 'Lenovo',
    especificaciones: 'Intel i7-1355U, 16GB RAM, SSD 512GB, Pantalla 14" FHD',
    fecha_lanzamiento: '2023-05-10'
  },
  {
    nombre: 'iPhone 15 Pro',
    categoria: 'Smartphones',
    precio: 999.99,
    stock: 50,
    descripcion: 'El smartphone más avanzado de Apple con chip A17 Pro',
    marca: 'Apple',
    especificaciones: 'A17 Pro, 256GB almacenamiento, Cámara 48MP, Pantalla 6.1" Super Retina',
    fecha_lanzamiento: '2023-09-22'
  },
  {
    nombre: 'Samsung Galaxy S24 Ultra',
    categoria: 'Smartphones',
    precio: 1199.99,
    stock: 35,
    descripcion: 'Smartphone flagship con S Pen y cámara de 200MP',
    marca: 'Samsung',
    especificaciones: 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED',
    fecha_lanzamiento: '2024-01-17'
  },
  {
    nombre: 'Google Pixel 8 Pro',
    categoria: 'Smartphones',
    precio: 899.99,
    stock: 30,
    descripcion: 'Smartphone con IA avanzada y cámara excepcional',
    marca: 'Google',
    especificaciones: 'Tensor G3, 128GB, Cámara 50MP, Pantalla 6.7" LTPO OLED',
    fecha_lanzamiento: '2023-10-04'
  },
  {
    nombre: 'iPad Pro 12.9" M2',
    categoria: 'Tablets',
    precio: 1099.99,
    stock: 20,
    descripcion: 'Tablet profesional con chip M2 y pantalla Liquid Retina XDR',
    marca: 'Apple',
    especificaciones: 'Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil',
    fecha_lanzamiento: '2022-10-26'
  },
  {
    nombre: 'Samsung Galaxy Tab S9',
    categoria: 'Tablets',
    precio: 799.99,
    stock: 25,
    descripcion: 'Tablet Android premium con S Pen incluido',
    marca: 'Samsung',
    especificaciones: 'Snapdragon 8 Gen 2, 256GB, Pantalla 11" AMOLED, S Pen incluido',
    fecha_lanzamiento: '2023-08-11'
  },
  {
    nombre: 'Nintendo Switch OLED',
    categoria: 'Gaming',
    precio: 349.99,
    stock: 60,
    descripcion: 'Consola portátil con pantalla OLED mejorada',
    marca: 'Nintendo',
    especificaciones: 'Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos',
    fecha_lanzamiento: '2021-10-08'
  },
  {
    nombre: 'PlayStation 5',
    categoria: 'Gaming',
    precio: 499.99,
    stock: 45,
    descripcion: 'Consola de videojuegos de última generación',
    marca: 'Sony',
    especificaciones: 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing',
    fecha_lanzamiento: '2020-11-12'
  },
  {
    nombre: 'Xbox Series X',
    categoria: 'Gaming',
    precio: 499.99,
    stock: 40,
    descripcion: 'Consola más potente de Microsoft',
    marca: 'Microsoft',
    especificaciones: 'AMD Zen 2, 16GB GDDR6, SSD 1TB, 4K 120fps',
    fecha_lanzamiento: '2020-11-10'
  },
  {
    nombre: 'Monitor LG UltraGear 27"',
    categoria: 'Monitores',
    precio: 399.99,
    stock: 30,
    descripcion: 'Monitor gaming 4K con 144Hz y HDR',
    marca: 'LG',
    especificaciones: '27" 4K UHD, 144Hz, HDR10, G-Sync Compatible',
    fecha_lanzamiento: '2023-06-15'
  },
  {
    nombre: 'Monitor Dell UltraSharp 32"',
    categoria: 'Monitores',
    precio: 599.99,
    stock: 20,
    descripcion: 'Monitor profesional para diseño y edición',
    marca: 'Dell',
    especificaciones: '32" 4K UHD, 99% sRGB, USB-C, Pantalla IPS',
    fecha_lanzamiento: '2023-04-20'
  },
  {
    nombre: 'Teclado Mecánico Logitech MX',
    categoria: 'Periféricos',
    precio: 149.99,
    stock: 50,
    descripcion: 'Teclado mecánico inalámbrico con retroiluminación RGB',
    marca: 'Logitech',
    especificaciones: 'Switches mecánicos, RGB, Bluetooth y USB, Batería recargable',
    fecha_lanzamiento: '2023-02-10'
  },
  {
    nombre: 'Mouse Logitech G Pro X',
    categoria: 'Periféricos',
    precio: 129.99,
    stock: 55,
    descripcion: 'Mouse gaming profesional ultra ligero',
    marca: 'Logitech',
    especificaciones: '25K DPI, 63g peso, RGB, Batería 70 horas',
    fecha_lanzamiento: '2023-03-05'
  },
  {
    nombre: 'Auriculares Sony WH-1000XM5',
    categoria: 'Audio',
    precio: 399.99,
    stock: 35,
    descripcion: 'Auriculares inalámbricos con cancelación de ruido activa',
    marca: 'Sony',
    especificaciones: 'Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio',
    fecha_lanzamiento: '2022-05-12'
  },
  {
    nombre: 'AirPods Pro 2',
    categoria: 'Audio',
    precio: 249.99,
    stock: 60,
    descripcion: 'Auriculares inalámbricos con cancelación de ruido activa',
    marca: 'Apple',
    especificaciones: 'Cancelación de ruido activa, 6h batería, Estuche con carga MagSafe',
    fecha_lanzamiento: '2022-09-23'
  },
  {
    nombre: 'SSD Samsung 980 PRO 1TB',
    categoria: 'Almacenamiento',
    precio: 129.99,
    stock: 80,
    descripcion: 'SSD NVMe de alto rendimiento para gaming y trabajo',
    marca: 'Samsung',
    especificaciones: '1TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura',
    fecha_lanzamiento: '2020-09-22'
  },
  {
    nombre: 'Disco Duro Externo Seagate 2TB',
    categoria: 'Almacenamiento',
    precio: 79.99,
    stock: 70,
    descripcion: 'Disco duro externo portátil USB 3.0',
    marca: 'Seagate',
    especificaciones: '2TB, USB 3.0, Compatible con PC y Mac',
    fecha_lanzamiento: '2022-01-15'
  }
];

// Añadimos más productos de ejemplo para mejorar las vistas
productos.push(
  {
    nombre: 'Router ASUS ROG AXE300',
    categoria: 'Redes',
    precio: 299.99,
    stock: 25,
    descripcion: 'Router WiFi 6E para gaming y altas velocidades',
    marca: 'ASUS',
    especificaciones: 'WiFi 6E, Tri-band, 10Gbps WAN',
    fecha_lanzamiento: '2024-02-10'
  },
  {
    nombre: 'Cámara Canon EOS R6',
    categoria: 'Cámaras',
    precio: 2499.99,
    stock: 10,
    descripcion: 'Cámara mirrorless profesional con estabilización',
    marca: 'Canon',
    especificaciones: 'CMOS 20MP, 4K60, IBIS',
    fecha_lanzamiento: '2021-07-15'
  },
  {
    nombre: 'Google Nest Audio',
    categoria: 'Smart Home',
    precio: 99.99,
    stock: 50,
    descripcion: 'Altavoz inteligente con Google Assistant',
    marca: 'Google',
    especificaciones: 'Altavoz inteligente, alta calidad de sonido',
    fecha_lanzamiento: '2021-10-05'
  },
  {
    nombre: 'Fitbit Charge 6',
    categoria: 'Wearables',
    precio: 179.99,
    stock: 60,
    descripcion: 'Pulsera de actividad con GPS y monitoreo avanzado de salud',
    marca: 'Fitbit',
    especificaciones: 'Monitor de ritmo cardíaco, GPS integrado',
    fecha_lanzamiento: '2024-01-20'
  }
);

// Datos falsos de usuarios
const usuarios = [
  { nombre: 'Juan Pérez', email: 'juan.perez@email.com', telefono: '+34 600 123 456', total_compras: 3 },
  { nombre: 'María García', email: 'maria.garcia@email.com', telefono: '+34 600 234 567', total_compras: 5 },
  { nombre: 'Carlos López', email: 'carlos.lopez@email.com', telefono: '+34 600 345 678', total_compras: 2 },
  { nombre: 'Ana Martínez', email: 'ana.martinez@email.com', telefono: '+34 600 456 789', total_compras: 7 },
  { nombre: 'Luis Rodríguez', email: 'luis.rodriguez@email.com', telefono: '+34 600 567 890', total_compras: 1 },
  { nombre: 'Laura Sánchez', email: 'laura.sanchez@email.com', telefono: '+34 600 678 901', total_compras: 4 },
  { nombre: 'Pedro Fernández', email: 'pedro.fernandez@email.com', telefono: '+34 600 789 012', total_compras: 6 },
  { nombre: 'Sofía Torres', email: 'sofia.torres@email.com', telefono: '+34 600 890 123', total_compras: 2 },
  { nombre: 'Miguel Ruiz', email: 'miguel.ruiz@email.com', telefono: '+34 600 901 234', total_compras: 3 },
  { nombre: 'Elena Díaz', email: 'elena.diaz@email.com', telefono: '+34 600 012 345', total_compras: 8 }
];

// Usuarios adicionales
usuarios.push(
  { nombre: 'Oscar Muñoz', email: 'oscar.munoz@email.com', telefono: '+34 600 111 222', total_compras: 2 },
  { nombre: 'Patricia Vega', email: 'patricia.vega@email.com', telefono: '+34 600 222 333', total_compras: 4 }
);

// Insertar productos
const insertProducto = db.prepare(`
  INSERT INTO productos (nombre, categoria, precio, stock, descripcion, marca, especificaciones, fecha_lanzamiento)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertManyProductos = db.transaction((productos) => {
  for (const producto of productos) {
    insertProducto.run(
      producto.nombre,
      producto.categoria,
      producto.precio,
      producto.stock,
      producto.descripcion,
      producto.marca,
      producto.especificaciones,
      producto.fecha_lanzamiento
    );
  }
});

// Insertar usuarios
const insertUsuario = db.prepare(`
  INSERT INTO usuarios (nombre, email, telefono, total_compras)
  VALUES (?, ?, ?, ?)
`);

const insertManyUsuarios = db.transaction((usuarios) => {
  for (const usuario of usuarios) {
    insertUsuario.run(
      usuario.nombre,
      usuario.email,
      usuario.telefono,
      usuario.total_compras
    );
  }
});

// Insertar algunas ventas de ejemplo
const insertVenta = db.prepare(`
  INSERT INTO ventas (usuario_id, producto_id, cantidad, precio_total)
  VALUES (?, ?, ?, ?)
`);

try {
  insertManyProductos(productos);
  console.log(`✅ Insertados ${productos.length} productos`);
  
  insertManyUsuarios(usuarios);
  console.log(`✅ Insertados ${usuarios.length} usuarios`);
  
  // Crear algunas ventas de ejemplo
  insertVenta.run(1, 1, 1, 1299.99);
  insertVenta.run(2, 5, 2, 1999.98);
  insertVenta.run(3, 10, 1, 349.99);
  insertVenta.run(4, 2, 1, 1999.99);
  insertVenta.run(5, 15, 1, 149.99);
  insertVenta.run(6, 18, 1, 299.99);
  insertVenta.run(7, 19, 2, 2499.98);
  console.log('✅ Insertadas 5 ventas de ejemplo');
  
  console.log('\n🎉 Base de datos poblada correctamente!');
} catch (error) {
  console.error('❌ Error al poblar la base de datos:', error);
}

db.close();

