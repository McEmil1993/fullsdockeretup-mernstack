const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const appSettingsRoutes = require('./src/routes/appSettingsRoutes');
const fileUploadRoutes = require('./src/routes/fileUploadRoutes');
const dockerRoutes = require('./src/routes/dockerRoutes');
const dockerActionLogRoutes = require('./src/routes/dockerActionLogRoutes');
const serverRoutes = require('./src/routes/serverRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const userPreferenceRoutes = require('./src/routes/userPreferenceRoutes');
const markdownDocumentRoutes = require('./src/routes/markdownDocumentRoutes');
const dockerNotificationRoutes = require('./src/routes/dockerNotificationRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

if (String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Log CORS configuration for debugging
console.log('🔒 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins : 'ALL (Development mode)');
console.log('   Credentials:', true);

app.use(
  cors({
    origin(origin, callback) {
      // Log incoming requests for debugging
      if (origin) {
        console.log(`📡 CORS Request from: ${origin}`);
      }
      
      // Allow non-browser tools (no Origin header)
      if (!origin) {
        console.log('✅ Allowing request (no origin header)');
        return callback(null, true);
      }
      
      // In development or if no origins configured, allow all
      if (allowedOrigins.length === 0) {
        console.log('✅ Allowing request (no restrictions configured)');
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ Allowing origin: ${origin}`);
        return callback(null, true);
      }
      
      // Reject if not in allowed list
      console.log(`❌ Blocking origin: ${origin}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/app-settings', appSettingsRoutes);

app.use('/api/file-uploads', fileUploadRoutes);

app.use('/api/docker', dockerRoutes);

app.use('/api/docker-logs', dockerActionLogRoutes);

app.use('/api/servers', serverRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/conversations', conversationRoutes);

app.use('/api/preferences', userPreferenceRoutes);

app.use('/api/documents', markdownDocumentRoutes);

app.use('/api/notifications', dockerNotificationRoutes);

// Serve static files from public/uploads
app.use('/api/uploads', express.static('public/uploads'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

module.exports = app;

