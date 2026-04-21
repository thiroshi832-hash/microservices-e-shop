const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'gateway-error.log', level: 'error' })
  ]
});

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// JWT verification for protected routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwt = require('jsonwebtoken');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Token verification failed', { error: err.message });
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Routes without authentication (public)
app.use('/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/users': '/'
  },
  onError: (err, req, res) => {
    logger.error('User service proxy error', { error: err.message });
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

app.use('/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/products': '/'
  },
  onError: (err, req, res) => {
    logger.error('Product service proxy error', { error: err.message });
    res.status(503).json({ error: 'Product service unavailable' });
  }
}));

// Orders require authentication
app.use('/orders', verifyToken, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:5003',
  changeOrigin: true,
  pathRewrite: {
    '^/orders': '/'
  },
  onError: (err, req, res) => {
    logger.error('Order service proxy error', { error: err.message });
    res.status(503).json({ error: 'Order service unavailable' });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;
