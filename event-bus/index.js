const { createClient } = require('redis');
const logger = require('../shared/logger');

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redis = createClient({
  url: redisUrl,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  }
});

let isConnected = false;

const connect = async () => {
  try {
    await redis.connect();
    isConnected = true;
    logger.info('Event bus connected to Redis');
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
    isConnected = false;
  }
};

redis.on('error', (err) => {
  logger.error('Redis Client Error', { error: err.message });
  isConnected = false;
});

redis.on('connect', () => {
  logger.info('Event bus connected to Redis');
  isConnected = true;
});

redis.on('disconnect', () => {
  logger.warn('Event bus disconnected from Redis');
  isConnected = false;
});

// Publish an event to a channel
async function publish(event) {
  if (!isConnected) {
    logger.warn('Redis not connected, event not published', { eventType: event.type });
    return;
  }

  try {
    const { type, data, timestamp = new Date().toISOString() } = event;
    const payload = JSON.stringify({ type, data, timestamp });

    await redis.publish('events', payload);
    logger.debug('Event published', { eventType: type });
  } catch (err) {
    logger.error('Failed to publish event', { error: err.message });
  }
}

// Subscribe to events (for services to consume)
async function subscribe(handler) {
  try {
    await connect();

    const subscriber = redis.duplicate();
    await subscriber.connect();
    await subscriber.subscribe('events', (message) => {
      try {
        const event = JSON.parse(message);
        handler(event);
      } catch (err) {
        logger.error('Failed to parse event message', { error: err.message });
      }
    });

    logger.info('Subscribed to events channel');
    return subscriber;
  } catch (err) {
    logger.error('Failed to subscribe to events', { error: err.message });
    throw err;
  }
}

// Get Redis client for direct operations
function getClient() {
  return redis;
}

// Initialize connection on startup
connect().catch(() => {
  logger.warn('Initial Redis connection failed, will retry automatically');
});

module.exports = {
  publish,
  subscribe,
  getClient,
  connect
};
