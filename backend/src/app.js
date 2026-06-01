const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const app = express();

// Trust the proxy since the app is deployed behind DigitalOcean's load balancer.
// This resolves express-rate-limit 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR' errors.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend static files in production
if (env.nodeEnv === 'production') {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../../frontend/out');
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Handle Next.js static routing
    // 1. Try exact path with .html extension (e.g. /products -> /products.html)
    const htmlPath = path.join(frontendPath, `${req.path}.html`);
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }

    // 2. Try exact path as a directory index (e.g. /products/ -> /products/index.html)
    const indexPath = path.join(frontendPath, req.path, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    // 3. Dynamic routes (Next.js exports dynamic routes like /products/[id].html)
    // For specific known dynamic routes, we can handle them manually
    if (req.path.startsWith('/products/') && req.path.split('/').length === 3) {
      const productDynamic = path.join(frontendPath, 'products', '[id].html');
      if (fs.existsSync(productDynamic)) {
         return res.sendFile(productDynamic);
      }
    }
    if (req.path.startsWith('/orders/') && req.path.split('/').length === 3) {
      const orderDynamic = path.join(frontendPath, 'orders', '[id].html');
      if (fs.existsSync(orderDynamic)) {
         return res.sendFile(orderDynamic);
      }
    }

    // 4. Fallback to root index.html (useful for 404s or client-side routing)
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
