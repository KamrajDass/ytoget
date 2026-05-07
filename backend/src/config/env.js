const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isLiveDb = String(process.env.USE_LIVE_DB || 'false').toLowerCase() === 'true';

const config = {
  port: Number(process.env.PORT || 4000),
  mongodb: {
    localUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopco',
    liveUri: process.env.MONGODB_URI_LIVE || '',
    useLive: isLiveDb,
    maxRetries: Number(process.env.MONGODB_MAX_RETRIES || 20),
    retryDelayMs: Number(process.env.MONGODB_RETRY_DELAY_MS || 3000),
    serverSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000)
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ''
  },
  bunny: {
    storageZone: process.env.BUNNY_STORAGE_ZONE || '',
    apiKey: process.env.BUNNY_API_KEY || '',
    pullZoneBaseUrl: process.env.BUNNY_PULL_ZONE_BASE_URL || '',
    storageHost: process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com',
    pathPrefix: process.env.BUNNY_PATH_PREFIX || 'products'
  }
};

module.exports = { config };
