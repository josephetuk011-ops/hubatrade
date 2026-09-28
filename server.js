import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set');
  process.exit(1);
}

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection with retry logic
let dbConnected = false;

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    dbConnected = true;
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Retrying in 5 seconds...');
    setTimeout(connectDatabase, 5000);
  }
};

connectDatabase();

// Monitor database connection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  dbConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
    paystack: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'not_configured'
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import vendorRoutes from './routes/vendors.js';
import providerRoutes from './routes/providers.js';

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/providers', providerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hubatrade API',
    version: '1.0.0',
    docs: 'Check /api/health for status'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Hubatrade Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Paystack: ${process.env.PAYSTACK_SECRET_KEY ? '✅ Active' : '⚠️ Not configured'}`);
  console.log(`🗄️ Database: ${dbConnected ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/products`);
  console.log(`   - POST /api/orders`);
  console.log(`   - POST /api/payments/initialize\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⛔ SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

export default app;
