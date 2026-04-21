const express = require('express');
const Joi = require('joi');
const db = require('../shared/db');
const logger = require('../shared/logger');
const validators = require('../shared/validators');
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

// Initialize database tables
const initDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        description TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data if table is empty
    const result = await db.query('SELECT COUNT(*) as count FROM products');
    if (result.rows[0].count === 0) {
      await db.query(`
        INSERT INTO products (name, price, description, category, stock) VALUES
        ('Laptop', 1200.00, 'High performance laptop', 'Electronics', 50),
        ('Smartphone', 800.00, 'Latest smartphone', 'Electronics', 100),
        ('Headphones', 150.00, 'Noise-cancelling headphones', 'Audio', 200)
      `);
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

    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND price >= $${paramCount}`;
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND price <= $${paramCount}`;
      params.push(maxPrice);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get products error', { error: err.message });
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, price, description, category, stock, created_at, updated_at FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get product error', { error: err.message });
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product (no auth needed for now, but could be added)
app.post('/', async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, price, description = '', category = '', stock = 0 } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, price, description, category, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, price, description, category, stock, created_at, updated_at`,
      [name, price, description, category, stock]
    );

    logger.info('Product created', { productId: result.rows[0].id, name });
    res.status(201).json(result.rows[0]);

    // Publish product created event
    publish({
      type: 'PRODUCT_CREATED',
      data: result.rows[0]
    });
  } catch (err) {
    logger.error('Create product error', { error: err.message });
    if (err.code === '23505') {
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

    const result = await db.query(
      `UPDATE products
       SET name = $1, price = $2, description = COALESCE($3, description),
           category = COALESCE($4, category), stock = COALESCE($5, stock),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, price, description, category, stock, created_at, updated_at`,
      [name, price, description, category, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('Product updated', { productId: id });
    res.json(result.rows[0]);

    // Publish product updated event
    publish({
      type: 'PRODUCT_UPDATED',
      data: result.rows[0]
    });
  } catch (err) {
    logger.error('Update product error', { error: err.message });
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('Product deleted', { productId: id });
    res.json({ message: 'Product deleted successfully' });

    // Publish product deleted event
    publish({
      type: 'PRODUCT_DELETED',
      data: { id }
    });
  } catch (err) {
    logger.error('Delete product error', { error: err.message });
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
    // Wait for DB connection
    const dbConnected = await db.connectWithRetry();
    if (!dbConnected) {
      logger.error('Failed to connect to database after retries');
      process.exit(1);
    }

    await initDB();

    const server = app.listen(PORT, () => {
      logger.info(`Product service running on port ${PORT}`);
      console.log(`Product service running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
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
