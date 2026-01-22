const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const appSettingsRoutes = require('./src/routes/appSettingsRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const assessmentRoutes = require('./src/routes/assessmentRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

if (String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin header), and allow configured frontend origins
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/schedules', scheduleRoutes);

app.use('/api/students', studentRoutes);

app.use('/api/assessments', assessmentRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

module.exports = app;

