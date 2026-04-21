const express = require('express');
const axios = require('axios');
const Joi = require('joi');
const db = require('../shared/db');
const logger = require('../shared/logger');
const validators = require('../shared/validators');
const { publish } = require('../event-bus');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

const orderSchema = Joi.object({
  userId: Joi.number().integer().required(),
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

// Initialize database tables
const initDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    `).catch(() => {}); // Ignore if indexes already exist

    logger.info('Orders table initialized');
  } catch (err) {
    logger.error('Failed to initialize orders table', { error: err.message });
    throw err;
  }
};

// Create order
app.post('/', async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, productId, quantity = 1 } = req.body;

    // Fetch user from user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5001';
    const userResponse = await axios.get(`${userServiceUrl}/users/${userId}`);
    const user = userResponse.data;

    // Fetch product from product-service
    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
    const productResponse = await axios.get(`${productServiceUrl}/products/${productId}`);
    const product = productResponse.data;

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Insert order into database
    const result = await db.query(
      `INSERT INTO orders (user_id, product_id, quantity, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, user_id, product_id, quantity, total_price, status, created_at`,
      [userId, productId, quantity, totalPrice]
    );

    const order = result.rows[0];

    logger.info('Order created', {
      orderId: order.id,
      userId,
      productId,
      totalPrice
    });

    // Publish order created event
    publish({
      type: 'ORDER_CREATED',
      data: {
        id: order.id,
        userId,
        productId,
        quantity: order.quantity,
        totalPrice,
        status: order.status
      }
    });

    res.status(201).json({
      id: order.id,
      user,
      product,
      quantity: order.quantity,
      total: order.total_price,
      status: order.status,
      created_at: order.created_at
    });
  } catch (err) {
    logger.error('Create order error', { error: err.message });

    if (err.response) {
      if (err.response.status === 404) {
        return res.status(404).json({ error: 'User or product not found' });
      }
      return res.status(err.response.status).json({ error: err.response.data.error || 'Service error' });
    }

    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders
app.get('/', async (req, res) => {
  try {
    const { userId, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT o.id, o.user_id, o.product_id, o.quantity, o.total_price, o.status, o.created_at,
             u.name as user_name, u.email as user_email,
             p.name as product_name, p.price as product_price
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
    `;
    let params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` WHERE o.user_id = $${paramCount}`;
      params.push(userId);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id,
      user: { id: row.user_id, name: row.user_name, email: row.user_email },
      product: { id: row.product_id, name: row.product_name, price: row.product_price },
      quantity: row.quantity,
      total: row.total_price,
      status: row.status,
      created_at: row.created_at
    }));

    res.json(orders);
  } catch (err) {
    logger.error('Get orders error', { error: err.message });
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order with details
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT o.id, o.user_id, o.product_id, o.quantity, o.total_price, o.status, o.created_at,
             u.name as user_name, u.email as user_email,
             p.name as product_name, p.price as product_price
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      user: { id: row.user_id, name: row.user_name, email: row.user_email },
      product: { id: row.product_id, name: row.product_name, price: row.product_price },
      quantity: row.quantity,
      total: row.total_price,
      status: row.status,
      created_at: row.created_at
    });
  } catch (err) {
    logger.error('Get order error', { error: err.message });
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Update order status
app.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, updated_at',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info('Order status updated', { orderId: id, status });
    res.json(result.rows[0]);

    // Publish order status updated event
    publish({
      type: 'ORDER_STATUS_UPDATED',
      data: { id, status }
    });
  } catch (err) {
    logger.error('Update order status error', { error: err.message });
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info('Order deleted', { orderId: id });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    logger.error('Delete order error', { error: err.message });
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get user's order history
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await db.query(`
      SELECT o.id, o.product_id, o.quantity, o.total_price, o.status, o.created_at,
             p.name as product_name, p.price as product_price
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const orders = result.rows.map(row => ({
      id: row.id,
      product: { id: row.product_id, name: row.product_name, price: row.product_price },
      quantity: row.quantity,
      total: row.total_price,
      status: row.status,
      created_at: row.created_at
    }));

    res.json(orders);
  } catch (err) {
    logger.error('Get user orders error', { error: err.message });
    res.status(500).json({ error: 'Failed to get user orders' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
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
      logger.info(`Order service running on port ${PORT}`);
      console.log(`Order service running on port ${PORT}`);
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
    logger.error('Failed to start order service', { error: err.message });
    process.exit(1);
  }
};

startServer();

module.exports = app;
