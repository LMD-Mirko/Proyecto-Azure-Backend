import Database from 'better-sqlite3';
import { config } from '../config.js';

const db = new Database(config.database.path);

// Datos de ejemplo para la tabla modelos
const modelosEjemplo = [
  {
    nombre: 'iPhone 15 Pro Max',
    tipo: 'Smartphone',
    marca: 'Apple',
    especificaciones: 'A17 Pro, 256GB, Cámara 48MP, Pantalla 6.7" Super Retina XDR',
    descripcion: 'El smartphone más avanzado de Apple con chip A17 Pro y cámara profesional',
    datos_adicionales: {
      precio: 1199,
      stock: 50,
      colores: ['Titanio Natural', 'Titanio Azul', 'Titanio Blanco', 'Titanio Negro'],
      año_lanzamiento: 2023
    }
  },
  {
    nombre: 'Samsung Galaxy S24 Ultra',
    tipo: 'Smartphone',
    marca: 'Samsung',
    especificaciones: 'Snapdragon 8 Gen 3, 256GB, Cámara 200MP, Pantalla 6.8" Dynamic AMOLED',
    descripcion: 'Smartphone flagship con S Pen y cámara de 200MP',
    datos_adicionales: {
      precio: 1299,
      stock: 35,
      colores: ['Negro', 'Violeta', 'Gris', 'Amarillo'],
      año_lanzamiento: 2024
    }
  },
  {
    nombre: 'MacBook Pro 16" M3 Max',
    tipo: 'Laptop',
    marca: 'Apple',
    especificaciones: 'Apple M3 Max, 36GB RAM, SSD 1TB, Pantalla 16.2" Liquid Retina XDR',
    descripcion: 'Laptop profesional de alto rendimiento para creativos',
    datos_adicionales: {
      precio: 3999,
      stock: 15,
      procesador: 'M3 Max',
      memoria: '36GB',
      almacenamiento: '1TB SSD'
    }
  },
  {
    nombre: 'Dell XPS 15',
    tipo: 'Laptop',
    marca: 'Dell',
    especificaciones: 'Intel i7-13700H, 16GB RAM, SSD 512GB, Pantalla 15.6" OLED',
    descripcion: 'Laptop premium con pantalla OLED y excelente rendimiento',
    datos_adicionales: {
      precio: 1899,
      stock: 25,
      procesador: 'Intel i7-13700H',
      memoria: '16GB DDR5',
      almacenamiento: '512GB NVMe'
    }
  },
  {
    nombre: 'PlayStation 5',
    tipo: 'Consola',
    marca: 'Sony',
    especificaciones: 'AMD Zen 2, 16GB GDDR6, SSD 825GB, Ray Tracing, 4K 120fps',
    descripcion: 'Consola de videojuegos de última generación',
    datos_adicionales: {
      precio: 499,
      stock: 45,
      versiones: ['Standard', 'Digital Edition'],
      año_lanzamiento: 2020
    }
  },
  {
    nombre: 'Nintendo Switch OLED',
    tipo: 'Consola',
    marca: 'Nintendo',
    especificaciones: 'Pantalla OLED 7", 64GB almacenamiento, Joy-Con incluidos',
    descripcion: 'Consola portátil con pantalla OLED mejorada',
    datos_adicionales: {
      precio: 349,
      stock: 60,
      colores: ['Blanco', 'Neón Rojo/Azul'],
      año_lanzamiento: 2021
    }
  },
  {
    nombre: 'iPad Pro 12.9" M2',
    tipo: 'Tablet',
    marca: 'Apple',
    especificaciones: 'Apple M2, 256GB, Pantalla 12.9" Liquid Retina XDR, Compatible con Apple Pencil',
    descripcion: 'Tablet profesional con chip M2 y pantalla Liquid Retina XDR',
    datos_adicionales: {
      precio: 1099,
      stock: 20,
      tamaños: ['11"', '12.9"'],
      año_lanzamiento: 2022
    }
  },
  {
    nombre: 'Monitor LG UltraGear 27"',
    tipo: 'Monitor',
    marca: 'LG',
    especificaciones: '27" 4K UHD, 144Hz, HDR10, G-Sync Compatible, IPS',
    descripcion: 'Monitor gaming 4K con alta frecuencia de refresco',
    datos_adicionales: {
      precio: 599,
      stock: 30,
      resolucion: '3840x2160',
      frecuencia: '144Hz',
      panel: 'IPS'
    }
  },
  {
    nombre: 'Auriculares Sony WH-1000XM5',
    tipo: 'Audio',
    marca: 'Sony',
    especificaciones: 'Cancelación de ruido ANC, 30h batería, Bluetooth 5.2, Hi-Res Audio',
    descripcion: 'Auriculares inalámbricos premium con cancelación de ruido activa',
    datos_adicionales: {
      precio: 399,
      stock: 35,
      bateria: '30 horas',
      conectividad: 'Bluetooth 5.2',
      cancelacion_ruido: true
    }
  },
  {
    nombre: 'SSD Samsung 980 PRO 2TB',
    tipo: 'Almacenamiento',
    marca: 'Samsung',
    especificaciones: '2TB NVMe PCIe 4.0, 7000MB/s lectura, 5000MB/s escritura',
    descripcion: 'SSD NVMe de alto rendimiento para gaming y trabajo profesional',
    datos_adicionales: {
      precio: 199,
      stock: 80,
      capacidad: '2TB',
      velocidad_lectura: '7000MB/s',
      velocidad_escritura: '5000MB/s',
      interfaz: 'PCIe 4.0'
    }
  }
];

// Agregamos más modelos para enriquecer las vistas y demostrar variedad
modelosEjemplo.push(
  {
    nombre: 'Google Nest Audio',
    tipo: 'Smart Speaker',
    marca: 'Google',
    especificaciones: 'Altavoz inteligente, 1 unidad',
    descripcion: 'Altavoz inteligente para reproducir música y controlar dispositivos del hogar',
    datos_adicionales: { precio: 99, stock: 50 }
  },
  {
    nombre: 'Bose QuietComfort 45',
    tipo: 'Audio',
    marca: 'Bose',
    especificaciones: 'Cancelación de ruido, 24h batería',
    descripcion: 'Auriculares premium con excelente cancelación de ruido',
    datos_adicionales: { precio: 349, stock: 20 }
  },
  {
    nombre: 'Fitbit Charge 6',
    tipo: 'Wearable',
    marca: 'Fitbit',
    especificaciones: 'GPS integrado, monitor de sueño',
    descripcion: 'Pulsera de actividad con métricas avanzadas',
    datos_adicionales: { precio: 179, stock: 60 }
  },
  {
    nombre: 'DJI Mini 4',
    tipo: 'Drone',
    marca: 'DJI',
    especificaciones: '4K, 3-ejes, batería 30 min',
    descripcion: 'Drone compacto para fotografía aérea',
    datos_adicionales: { precio: 899, stock: 12 }
  }
);

// Insertar modelos
const insertModelo = db.prepare(`
  INSERT INTO modelos (nombre, tipo, marca, especificaciones, descripcion, datos_adicionales)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertManyModelos = db.transaction((modelos) => {
  for (const modelo of modelos) {
    insertModelo.run(
      modelo.nombre,
      modelo.tipo,
      modelo.marca,
      modelo.especificaciones,
      modelo.descripcion,
      JSON.stringify(modelo.datos_adicionales)
    );
  }
});

try {
  insertManyModelos(modelosEjemplo);
  console.log(`✅ Insertados ${modelosEjemplo.length} modelos de ejemplo`);
  console.log('\n🎉 Modelos poblados correctamente!');
} catch (error) {
  console.error('❌ Error al poblar modelos:', error);
}

db.close();

