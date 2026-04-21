const express = require('express');
const Joi = require('joi');
const prisma = require('./prisma');
const logger = require('../shared/logger');
const { publish } = require('../event-bus');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());

const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().max(100).allow(''),
  stock: Joi.number().integer().min(0).default(0)
});

// Initialize database (Prisma auto-creates tables)
const initDB = async () => {
  try {
    // Prisma automatically creates tables on first connection
    // Seed sample data if empty
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      await prisma.product.createMany({
        data: [
          { name: 'Laptop', price: 1200.00, description: 'High performance laptop', category: 'Electronics', stock: 50 },
          { name: 'Smartphone', price: 800.00, description: 'Latest smartphone', category: 'Electronics', stock: 100 },
          { name: 'Headphones', price: 150.00, description: 'Noise-cancelling headphones', category: 'Audio', stock: 200 }
        ]
      });
      logger.info('Sample products inserted');
    }
    logger.info('Products table initialized');
  } catch (err) {
    logger.error('Failed to initialize products table', { error: err.message });
    throw err;
  }
};

// Get all products
app.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json(products);
  } catch (err) {
    logger.error('Get products error', { error: err.message });
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    logger.error('Get product error', { error: err.message });
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product
app.post('/', async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, price, description, category, stock } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        price,
        description: description || '',
        category: category || '',
        stock: stock || 0
      }
    });

    logger.info('Product created', { productId: product.id, name });
    res.status(201).json(product);

    // Publish product created event
    publish({
      type: 'PRODUCT_CREATED',
      data: product
    });
  } catch (err) {
    logger.error('Create product error', { error: err.message });
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Product already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, price, description, category, stock } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(stock !== undefined && { stock })
      }
    });

    logger.info('Product updated', { productId: id });
    res.json(product);

    // Publish product updated event
    publish({
      type: 'PRODUCT_UPDATED',
      data: product
    });
  } catch (err) {
    logger.error('Update product error', { error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    logger.info('Product deleted', { productId: id });
    res.json({ message: 'Product deleted successfully' });

    // Publish product deleted event
    publish({
      type: 'PRODUCT_DELETED',
      data: { id: parseInt(id) }
    });
  } catch (err) {
    logger.error('Delete product error', { error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

// Initialize and start
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await initDB();

    const server = app.listen(PORT, () => {
      logger.info(`Product service running on port ${PORT}`);
      console.log(`Product service running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await prisma.$disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await prisma.$disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error('Failed to start product service', { error: err.message });
    process.exit(1);
  }
};

startServer();

module.exports = app;
