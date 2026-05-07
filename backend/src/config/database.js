const mongoose = require('mongoose');

const { config } = require('./env');
const { bootstrapData } = require('../services/bootstrapData');

const getMongoUri = () => {
  if (config.mongodb.useLive && config.mongodb.liveUri) {
    return config.mongodb.liveUri;
  }
  return config.mongodb.localUri;
};

const connectDatabase = async () => {
  const uri = getMongoUri();
  const maxRetries = Math.max(1, Number(config.mongodb.maxRetries || 1));
  const retryDelayMs = Math.max(500, Number(config.mongodb.retryDelayMs || 3000));
  const serverSelectionTimeoutMs = Math.max(1000, Number(config.mongodb.serverSelectionTimeoutMs || 5000));

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: serverSelectionTimeoutMs });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      const reason = error && error.message ? error.message : 'Unknown connection error';

      console.error(`MongoDB connect attempt ${attempt}/${maxRetries} failed: ${reason}`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  if (lastError) {
    if (lastError.message && lastError.message.includes('127.0.0.1:27017')) {
      console.error('MongoDB is refusing localhost connections. Verify that MongoDB service is running and listening on 127.0.0.1:27017.');
    }
    throw lastError;
  }

  await bootstrapData();
  console.log(`MongoDB connected (${config.mongodb.useLive ? 'live' : 'local'})`);
};

module.exports = { connectDatabase };
