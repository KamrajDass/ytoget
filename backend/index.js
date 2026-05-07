const { onRequest } = require('firebase-functions/v2/https');

const app = require('./app');

exports.api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '1GiB'
  },
  app
);
