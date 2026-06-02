const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' }); // 15 minutes as per doc
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtRefreshExpiresIn }); // 30 days
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyToken, verifyAccessToken: verifyToken };
