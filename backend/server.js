require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

