const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const rulesRoutes = require('./routes/rules');
const techniquesRoutes = require('./routes/techniques');
const futureRulesRoutes = require('./routes/futureRules');
const fileRoutes = require('./routes/files');
const analyticsRoutes = require('./routes/analytics');
const { router: mitreRoutes } = require('./routes/mitre');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced MongoDB connection configuration for large datasets
const mongooseOptions = {
  maxPoolSize: 20, // Maximum number of connections in the connection pool
  serverSelectionTimeoutMS: 10000, // How long mongoose will try to connect
  socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  // Use IPv4, skip trying IPv6
  family: 4
};

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Add your production domains here
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://your-production-domain.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Enhanced rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests for some endpoints
  skip: (req, res) => res.statusCode < 400,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// Different rate limits for different types of requests
const generalLimit = createRateLimit(15 * 60 * 1000, 1000, 'Too many requests, please try again later'); // 1000 requests per 15 minutes
const syncLimit = createRateLimit(60 * 60 * 1000, 10, 'Too many sync requests, please try again later'); // 10 sync requests per hour
const authLimit = createRateLimit(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again later'); // 20 auth attempts per 15 minutes

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP for development
}));

// Enhanced request processing middleware
app.use(express.json({ 
  limit: '50mb', // Increase payload limit for large data imports
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 10000 // Allow more parameters for complex queries
}));

app.use(cors(corsOptions));

// Enhanced logging
app.use(morgan('combined', {
  skip: function (req, res) {
    // Skip logging successful requests to reduce noise
    return res.statusCode < 400;
  }
}));

// Apply rate limiting
app.use('/api/auth', authLimit);
app.use('/api/mitre/sync', syncLimit);
app.use('/api', generalLimit);

// Health check endpoint (not rate limited)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    database: global.DATABASE_CONNECTED ? 'connected' : 'not available'
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/techniques', techniquesRoutes);
app.use('/api/future-rules', futureRulesRoutes);
app.use('/api', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mitre', mitreRoutes);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry detected' });
  }
  
  if (err.name === 'MongoTimeoutError') {
    return res.status(503).json({ error: 'Database timeout, please try again later' });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Import database configuration
const { connectWithRetry: dbConnectWithRetry } = require('./config/database');

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('📡 HTTP server closed');
    
    try {
      // Close database connection
      await mongoose.connection.close();
      console.log('🗄️ MongoDB connection closed');
      
      // Exit process
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during graceful shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

// Enhanced process error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process for unhandled rejections in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Memory monitoring
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  console.log('📊 Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
};

// Start server
let server;

const startServer = async () => {
  try {
    // Try to connect to database (won't exit on failure in production)
    const dbConnected = await dbConnectWithRetry();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.log('⚠️ Starting server with limited functionality (no database)');
      
      // Add a global flag to indicate database status
      global.DATABASE_CONNECTED = false;
      
      // Add mock data endpoints when database is not available
      const { getMockData } = require('./config/database');
      const mockData = getMockData();
      
      app.get('/api/techniques', (req, res) => {
        res.json({
          success: true,
          data: mockData.techniques,
          message: 'Limited data - database not available'
        });
      });
      
      app.get('/api/rules', (req, res) => {
        res.json({
          success: true,
          data: mockData.rules,
          message: 'Limited data - database not available'
        });
      });
    } else {
      global.DATABASE_CONNECTED = true;
    }
    
    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${global.DATABASE_CONNECTED ? 'Connected' : 'Not available'}`);
      console.log(`📊 Process ID: ${process.pid}`);
      
      // Log memory usage periodically in development
      if (process.env.NODE_ENV !== 'production') {
        setInterval(logMemoryUsage, 60000); // Every minute
      }
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
    
    // Start scheduler service after server is running (only if database is connected)
    if (global.DATABASE_CONNECTED) {
      try {
        const scheduler = require('./services/scheduler');
        scheduler.start();
      } catch (err) {
        console.error('⚠️ Scheduler service failed to start:', err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer(); 