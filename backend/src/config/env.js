const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'mock',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'mock',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  rateLimitMax: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  emailFromSupport: process.env.EMAIL_FROM_SUPPORT || 'support@example.com',
  emailFromOrders: process.env.EMAIL_FROM_ORDERS || 'orders@example.com',
  emailFromAuth: process.env.EMAIL_FROM_AUTH || 'auth@example.com',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',
};

if (!process.env.JWT_ACCESS_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_ACCESS_SECRET is required in environment variables');
}

if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_REFRESH_SECRET is required in environment variables');
}
