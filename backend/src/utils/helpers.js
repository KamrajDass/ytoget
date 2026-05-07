const crypto = require('crypto');

const createSlug = (input) =>
  String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const randomToken = () => crypto.randomBytes(24).toString('hex');

module.exports = { createSlug, randomToken };
