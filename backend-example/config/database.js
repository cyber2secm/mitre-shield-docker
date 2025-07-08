const mongoose = require('mongoose');

// Database configuration for different environments
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  
  // Default configuration
  const config = {
    uri: mongoUri || 'mongodb://localhost:27017/mitre-shield',
    options: {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      family: 4
    }
  };

  // Cloud Run / Production adjustments
  if (env === 'production') {
    config.options.serverSelectionTimeoutMS = 30000;
    config.options.connectTimeoutMS = 30000;
  }

  return config;
};

// Connection with retry logic
const connectWithRetry = async (maxRetries = 5) => {
  const config = getDatabaseConfig();
  let retries = 0;
  
  // Reduce retries for production/Cloud Run to fail faster
  if (process.env.NODE_ENV === 'production') {
    maxRetries = 3;
  }
  
  console.log(`🔌 Attempting to connect to database...`);
  console.log(`📍 URI: ${config.uri.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
  
  while (retries < maxRetries) {
    try {
      await mongoose.connect(config.uri, config.options);
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries} failed:`, err.message);
      
      if (retries >= maxRetries) {
        console.error('❌ Max MongoDB connection retries reached.');
        
        // For Cloud Run, we might want to continue with limited functionality
        if (process.env.NODE_ENV === 'production') {
          console.log('⚠️ Running in production mode without database - limited functionality');
          return false;
        } else {
          throw new Error('Database connection failed');
        }
      }
      
      // Wait before retrying (exponential backoff, shorter in production)
      const baseDelay = process.env.NODE_ENV === 'production' ? 1000 : 2000;
      const delay = Math.pow(2, retries) * baseDelay;
      console.log(`⏳ Retrying MongoDB connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Mock data for when database is not available
const getMockData = () => ({
  techniques: [
    {
      technique_id: 'T1059',
      name: 'Command and Scripting Interpreter',
      description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.',
      tactic: 'Execution',
      platforms: ['Linux', 'macOS', 'Windows'],
      data_sources: ['Command: Command Execution', 'Process: Process Creation'],
      detection: 'Monitor executed commands and arguments for suspicious activity.',
      mitigations: ['M1038', 'M1049'],
      sub_techniques: ['T1059.001', 'T1059.002', 'T1059.003']
    },
    {
      technique_id: 'T1055',
      name: 'Process Injection',
      description: 'Adversaries may inject code into processes in order to evade process-based defenses.',
      tactic: 'Defense Evasion',
      platforms: ['Linux', 'macOS', 'Windows'],
      data_sources: ['Process: OS API Execution', 'Process: Process Access'],
      detection: 'Monitor for suspicious process access patterns and API calls.',
      mitigations: ['M1040', 'M1019'],
      sub_techniques: ['T1055.001', 'T1055.002', 'T1055.003']
    }
  ],
  rules: [
    {
      rule_id: 'R001',
      name: 'Suspicious Command Execution',
      description: 'Detect suspicious command line execution patterns',
      technique_id: 'T1059',
      platform: 'Windows',
      rule_type: 'Detection',
      status: 'Active'
    }
  ]
});

module.exports = {
  connectWithRetry,
  getDatabaseConfig,
  getMockData
}; 