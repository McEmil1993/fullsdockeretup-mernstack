require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const DockerMonitor = require('./src/dockerMonitor');

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Parse multiple CORS origins (comma-separated)
const allowedOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim());

// Create HTTP server for health checks
const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'websocket', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Default 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Initialize Socket.IO server with HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || 
          origin.includes('markemilcajesdacoylo.online') ||
          origin.includes('localhost')) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const dockerMonitor = new DockerMonitor();

// Store active monitoring intervals per client
const clientMonitors = new Map();

// Start Docker event monitoring (global for all clients)
let dockerEventsProcess = null;
dockerEventsProcess = dockerMonitor.startEventMonitoring((event) => {
  // Broadcast Docker events to all connected clients
  io.emit('dockerEvent', event);
  console.log(`📢 Broadcasting Docker event: ${event.action} - ${event.containerName}`);
});

console.log(`WebSocket service starting on port ${PORT}`);
console.log(`CORS origin: ${CORS_ORIGIN}`);
console.log(`🔍 Docker events monitoring started`);

// Start HTTP server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server listening on 0.0.0.0:${PORT}`);
});

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Send initial connection confirmation
  socket.emit('connected', { 
    message: 'Connected to Docker WebSocket service',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  /**
   * Start Docker monitoring for this client
   */
  socket.on('startDockerMonitoring', async (intervalMs = 5000) => {
    console.log(`🔄 Starting Docker monitoring for ${socket.id} (interval: ${intervalMs}ms)`);
    
    // Clear any existing interval for this client
    if (clientMonitors.has(socket.id)) {
      clearInterval(clientMonitors.get(socket.id));
    }

    // Send initial data immediately
    try {
      const data = await dockerMonitor.getMonitoringData();
      socket.emit('dockerStats', data);
      
      // Send alerts if any
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach(alert => {
          socket.emit('dockerAlert', alert);
        });
      }
    } catch (error) {
      console.error(`❌ Error sending initial data to ${socket.id}:`, error.message);
      socket.emit('dockerError', { 
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Set up recurring monitoring
    const monitorInterval = setInterval(async () => {
      try {
        const data = await dockerMonitor.getMonitoringData();
        socket.emit('dockerStats', data);
        
        // Send alerts if any
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach(alert => {
            socket.emit('dockerAlert', alert);
          });
        }
      } catch (error) {
        console.error(`❌ Error sending monitoring data to ${socket.id}:`, error.message);
        socket.emit('dockerError', { 
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }, intervalMs);

    clientMonitors.set(socket.id, monitorInterval);
  });

  /**
   * Stop Docker monitoring for this client
   */
  socket.on('stopDockerMonitoring', () => {
    console.log(`⏸️  Stopping Docker monitoring for ${socket.id}`);
    
    if (clientMonitors.has(socket.id)) {
      clearInterval(clientMonitors.get(socket.id));
      clientMonitors.delete(socket.id);
    }
  });

  /**
   * Update monitoring interval
   */
  socket.on('updateMonitoringInterval', (newIntervalMs) => {
    console.log(`🔄 Updating monitoring interval for ${socket.id} to ${newIntervalMs}ms`);
    
    // Stop current monitoring
    if (clientMonitors.has(socket.id)) {
      clearInterval(clientMonitors.get(socket.id));
      clientMonitors.delete(socket.id);
    }
    
    // Restart with new interval
    socket.emit('startDockerMonitoring', newIntervalMs);
  });

  /**
   * Test Docker Event Handler (for testing notifications)
   */
  socket.on('testDockerEvent', (event) => {
    console.log(`🧪 Test Docker event received from ${socket.id}:`, event);
    
    // Broadcast to all clients (including sender)
    io.emit('dockerEvent', event);
    console.log(`📢 Broadcasting test Docker event: ${event.action} - ${event.containerName || 'N/A'}`);
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    // Clean up monitoring interval
    if (clientMonitors.has(socket.id)) {
      clearInterval(clientMonitors.get(socket.id));
      clientMonitors.delete(socket.id);
    }
  });

  /**
   * Handle errors
   */
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Handle server errors
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', err);
});

console.log(`✅ Docker WebSocket service is running on port ${PORT}`);
console.log(`📡 Waiting for client connections...`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing WebSocket server...');
  
  // Clear all monitoring intervals
  clientMonitors.forEach((interval, socketId) => {
    clearInterval(interval);
    console.log(`Cleared monitoring for ${socketId}`);
  });
  clientMonitors.clear();
  
  // Kill Docker events process
  if (dockerEventsProcess) {
    dockerEventsProcess.kill();
    console.log('Docker events monitoring stopped');
  }
  
  io.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing WebSocket server...');
  
  // Clear all monitoring intervals
  clientMonitors.forEach((interval, socketId) => {
    clearInterval(interval);
    console.log(`Cleared monitoring for ${socketId}`);
  });
  clientMonitors.clear();
  
  // Kill Docker events process
  if (dockerEventsProcess) {
    dockerEventsProcess.kill();
    console.log('Docker events monitoring stopped');
  }
  
  io.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
