/**
 * Script para poblar la base de datos con datos de demostración.
 * Ejecutar: node seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');
const MenuItem = require('./models/MenuItem');
const Post = require('./models/Post');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function seed() {
  console.log('Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Conectado.');

  // ── Crear usuario vendedor (tienda de ropa) ──
  let seller = await User.findOne({ username: 'kronostienda' });
  if (!seller) {
    const hash = await bcryptjs.hash('kronos123', 10);
    seller = await User.create({
      username: 'kronostienda',
      email: 'tienda@kronos.app',
      password: hash,
      firstName: 'Kronos',
      lastName: 'Tienda',
      role: 'seller',
      bio: 'Tienda oficial de ropa Kronos',
      avatar: 'https://ui-avatars.com/api/?name=Kronos+Tienda&background=7c3aed&color=fff&size=150',
    });
    console.log('Vendedor creado:', seller._id);
  } else {
    console.log('Vendedor ya existe:', seller._id);
  }

  // ── Productos de ropa ──
  const existingProducts = await Product.countDocuments({ seller: seller._id });
  if (existingProducts === 0) {
    await Product.insertMany([
      {
        seller: seller._id,
        name: 'Playera Kronos Negra',
        description: 'Playera premium con logo Kronos bordado, tela 100% algodón.',
        price: 299,
        originalPrice: 399,
        category: 'shirts',
        images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80'],
        sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 10 }, { size: 'L', stock: 8 }, { size: 'XL', stock: 4 }],
        colors: ['Negro'],
        rating: 4.8,
        inStock: true,
      },
      {
        seller: seller._id,
        name: 'Sudadera Morada Kronos',
        description: 'Sudadera con capucha, diseño exclusivo Kronos. Cálida y cómoda.',
        price: 599,
        originalPrice: 799,
        category: 'outerwear',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80'],
        sizes: [{ size: 'S', stock: 3 }, { size: 'M', stock: 7 }, { size: 'L', stock: 5 }],
        colors: ['Morado', 'Negro'],
        rating: 4.9,
        inStock: true,
      },
      {
        seller: seller._id,
        name: 'Jogger Urbano',
        description: 'Pantalón jogger estilo streetwear, cintura elástica, bolsillos laterales.',
        price: 449,
        category: 'pants',
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80'],
        sizes: [{ size: 'S', stock: 4 }, { size: 'M', stock: 9 }, { size: 'L', stock: 6 }, { size: 'XL', stock: 2 }],
        colors: ['Gris', 'Negro'],
        rating: 4.6,
        inStock: true,
      },
      {
        seller: seller._id,
        name: 'Tenis Kronos Run',
        description: 'Tenis deportivos ligeros con suela antideslizante y plantilla ergonómica.',
        price: 1299,
        originalPrice: 1599,
        category: 'shoes',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'],
        sizes: [{ size: '25', stock: 3 }, { size: '26', stock: 5 }, { size: '27', stock: 4 }, { size: '28', stock: 3 }],
        colors: ['Blanco/Negro', 'Todo negro'],
        rating: 4.7,
        inStock: true,
      },
      {
        seller: seller._id,
        name: 'Vestido Galaxia',
        description: 'Vestido corto con estampado galáctico, corte tipo A. Ideal para salir.',
        price: 699,
        category: 'dresses',
        images: ['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80'],
        sizes: [{ size: 'XS', stock: 2 }, { size: 'S', stock: 4 }, { size: 'M', stock: 6 }, { size: 'L', stock: 3 }],
        colors: ['Azul galaxia', 'Negro'],
        rating: 4.5,
        inStock: true,
      },
    ]);
    console.log('5 productos creados.');
  } else {
    console.log(`Ya hay ${existingProducts} productos. No se crearon nuevos.`);
  }

  // ── Crear usuarios restaurante ──
  const restaurantes = [
    {
      username: 'tacoselgrito',
      email: 'tacos@kronos.app',
      firstName: 'Tacos',
      lastName: 'El Grito',
      bio: 'Los mejores tacos de la ciudad 🌮 | Entrega en 30 min',
      avatar: 'https://images.unsplash.com/photo-1565299715199-866c917206bb?w=150&q=80',
      items: [
        { name: 'Taco de Pastor', description: 'Carnita marinada, piña, cilantro y cebolla', price: 22, category: 'Tacos', preparationTime: 10 },
        { name: 'Taco de Suadero', description: 'Carne de res suave, tortilla de maíz', price: 25, category: 'Tacos', preparationTime: 10 },
        { name: 'Orden de Quesadillas', description: '2 quesadillas con queso Oaxaca y tu elección de carne', price: 85, category: 'Quesadillas', preparationTime: 15 },
        { name: 'Refresco', description: 'Refresco de lata 355ml', price: 20, category: 'Bebidas', preparationTime: 2 },
        { name: 'Agua de Horchata', description: 'Agua fresca de horchata 500ml', price: 25, category: 'Bebidas', preparationTime: 2 },
      ],
    },
    {
      username: 'pizzastellas',
      email: 'pizza@kronos.app',
      firstName: 'Pizzas',
      lastName: 'Stellas',
      bio: 'Pizza artesanal al horno de piedra 🍕 | Delivery en 45 min',
      avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&q=80',
      items: [
        { name: 'Pizza Margarita', description: 'Salsa de tomate, mozzarella fresca y albahaca', price: 149, category: 'Pizzas', preparationTime: 25 },
        { name: 'Pizza BBQ Pollo', description: 'Salsa BBQ, pollo a la parrilla, cebolla morada', price: 179, category: 'Pizzas', preparationTime: 25 },
        { name: 'Pizza 4 Quesos', description: 'Mozzarella, gouda, parmesano y gorgonzola', price: 189, category: 'Pizzas', preparationTime: 25 },
        { name: 'Alitas BBQ x6', description: '6 alitas a la parrilla con salsa BBQ', price: 99, category: 'Entradas', preparationTime: 20 },
        { name: 'Limonada Fresca', description: 'Limonada natural 500ml', price: 35, category: 'Bebidas', preparationTime: 3 },
      ],
    },
    {
      username: 'sushikyoto',
      email: 'sushi@kronos.app',
      firstName: 'Sushi',
      lastName: 'Kyoto',
      bio: 'Sushi fresco y rolls creativos 🍱 | Pedidos desde $200',
      avatar: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80',
      items: [
        { name: 'Roll California', description: '8 piezas: cangrejo, aguacate, pepino, tobiko', price: 129, category: 'Rolls', preparationTime: 20 },
        { name: 'Roll Spicy Tuna', description: '8 piezas: atún picante, aguacate, sriracha', price: 149, category: 'Rolls', preparationTime: 20 },
        { name: 'Sashimi Salmón x5', description: '5 piezas de salmón fresco', price: 139, category: 'Sashimi', preparationTime: 15 },
        { name: 'Edamame', description: 'Vainas de soya al vapor con sal marina', price: 55, category: 'Entradas', preparationTime: 10 },
        { name: 'Té Verde', description: 'Té verde caliente o helado', price: 30, category: 'Bebidas', preparationTime: 5 },
      ],
    },
  ];

  for (const r of restaurantes) {
    let rest = await User.findOne({ username: r.username });
    if (!rest) {
      const hash = await bcryptjs.hash('kronos123', 10);
      rest = await User.create({
        username: r.username,
        email: r.email,
        password: hash,
        firstName: r.firstName,
        lastName: r.lastName,
        bio: r.bio,
        avatar: r.avatar,
        role: 'seller',
      });
      console.log(`Restaurante creado: ${r.username} (${rest._id})`);
    } else {
      console.log(`Restaurante ya existe: ${r.username}`);
    }

    const existing = await MenuItem.countDocuments({ restaurant: rest._id });
    if (existing === 0) {
      await MenuItem.insertMany(r.items.map(item => ({ ...item, restaurant: rest._id })));
      console.log(`  → ${r.items.length} items de menú creados.`);
    }
  }

  // ── Post de bienvenida ──
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    const kronosUser = await User.findOne({ username: 'kronostienda' });
    if (kronosUser) {
      await Post.create({
        author: kronosUser._id,
        content: '¡Bienvenido a Kronos! 🚀 La super app donde puedes socializar, comprar ropa, pedir comida y mucho más. ¡Empieza explorando!',
        visibility: 'public',
      });
      console.log('Post de bienvenida creado.');
    }
  }

  console.log('\n✅ Seed completado exitosamente.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
