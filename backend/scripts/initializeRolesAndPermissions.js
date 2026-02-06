/**
 * Script to initialize default roles and permissions
 * Run this once after setting up the database
 * 
 * Usage: node backend/scripts/initializeRolesAndPermissions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const roleService = require('../src/services/roleService');
const permissionService = require('../src/services/permissionService');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_info_tmc';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const initializeRolesAndPermissions = async () => {
  try {
    console.log('🚀 Initializing roles and permissions...\n');

    // Initialize permissions first
    console.log('📋 Creating permission catalog...');
    const permResult = await permissionService.initializeDefaultPermissions();
    console.log(`✅ ${permResult.message} (${permResult.count} permissions)\n`);

    // Initialize roles with default permissions
    console.log('👥 Creating default roles...');
    const roleResult = await roleService.initializeDefaultRoles();
    console.log(`✅ ${roleResult.message}\n`);

    console.log('🎉 Initialization completed successfully!');
    console.log('\nDefault roles created:');
    console.log('  - superadmin (Full Access)');
    console.log('  - admin (Administrative Access)');
    console.log('  - user (Basic User Access)');
    console.log('\n💡 You can now manage roles at: /role-permissions');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the initialization
(async () => {
  await connectDB();
  await initializeRolesAndPermissions();
})();
