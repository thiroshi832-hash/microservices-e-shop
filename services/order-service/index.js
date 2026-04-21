const express = require('express');
const axios = require('axios');
const Joi = require('joi');
const prisma = require('./prisma');
const logger = require('../shared/logger');
const { publish } = require('../event-bus');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

const orderSchema = Joi.object({
  userId: Joi.number().integer().required(),
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

// Initialize database
const initDB = async () => {
  try {
    // Prisma auto-creates tables on connection
    // Create indexes for better performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    `;
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

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        quantity,
        totalPrice,
        status: 'pending'
      }
    });

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
      total: order.totalPrice,
      status: order.status,
      created_at: order.createdAt
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

    const where = {};
    if (userId) where.userId = parseInt(userId);

    const orders = await prisma.order.findMany({
      where,
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // For each order, fetch user and product details from services
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let user = null;
        let product = null;

        try {
          const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5001';
          const userResponse = await axios.get(`${userServiceUrl}/users/${order.userId}`);
          user = userResponse.data;
        } catch (err) {
          logger.warn('Failed to fetch user', { userId: order.userId });
        }

        try {
          const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
          const productResponse = await axios.get(`${productServiceUrl}/products/${order.productId}`);
          product = productResponse.data;
        } catch (err) {
          logger.warn('Failed to fetch product', { productId: order.productId });
        }

        return {
          id: order.id,
          user,
          product,
          quantity: order.quantity,
          total: order.totalPrice,
          status: order.status,
          created_at: order.createdAt
        };
      })
    );

    res.json(enrichedOrders);
  } catch (err) {
    logger.error('Get orders error', { error: err.message });
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order with details
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch user and product details
    let user = null;
    let product = null;

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5001';
      const userResponse = await axios.get(`${userServiceUrl}/users/${order.userId}`);
      user = userResponse.data;
    } catch (err) {
      logger.warn('Failed to fetch user', { userId: order.userId });
    }

    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
      const productResponse = await axios.get(`${productServiceUrl}/products/${order.productId}`);
      product = productResponse.data;
    } catch (err) {
      logger.warn('Failed to fetch product', { productId: order.productId });
    }

    res.json({
      id: order.id,
      user,
      product,
      quantity: order.quantity,
      total: order.totalPrice,
      status: order.status,
      created_at: order.createdAt
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

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    logger.info('Order status updated', { orderId: id, status });
    res.json({
      id: order.id,
      status: order.status,
      updated_at: order.updatedAt
    });

    // Publish order status updated event
    publish({
      type: 'ORDER_STATUS_UPDATED',
      data: { id: order.id, status }
    });
  } catch (err) {
    logger.error('Update order status error', { error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order
app.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.order.delete({
      where: { id: parseInt(id) }
    });

    logger.info('Order deleted', { orderId: id });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    logger.error('Delete order error', { error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get user's order history
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Fetch product details for each order
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        let product = null;
        try {
          const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002';
          const productResponse = await axios.get(`${productServiceUrl}/products/${order.productId}`);
          product = productResponse.data;
        } catch (err) {
          logger.warn('Failed to fetch product', { productId: order.productId });
        }

        return {
          id: order.id,
          product,
          quantity: order.quantity,
          total: order.totalPrice,
          status: order.status,
          created_at: order.createdAt
        };
      })
    );

    res.json(enrichedOrders);
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
    await prisma.$connect();
    logger.info('Database connected');

    await initDB();

    const server = app.listen(PORT, () => {
      logger.info(`Order service running on port ${PORT}`);
      console.log(`Order service running on port ${PORT}`);
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
        process.exit(1);
      });
    });
  } catch (err) {
    logger.error('Failed to start order service', { error: err.message });
    process.exit(1);
  }
};

startServer();

module.exports = app;
