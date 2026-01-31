require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

connectDB();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Max file upload size: 10GB`);
});

// Increase timeout for large file uploads (30 minutes for 10GB files)
server.timeout = 1800000; // 30 minutes
server.keepAliveTimeout = 1800000;
server.headersTimeout = 1810000;

