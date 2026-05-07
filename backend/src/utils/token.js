const jwt = require('jsonwebtoken');

const { config } = require('../config/env');

const signAuthToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

const verifyAuthToken = (token) => jwt.verify(token, config.auth.jwtSecret);

module.exports = { signAuthToken, verifyAuthToken };
