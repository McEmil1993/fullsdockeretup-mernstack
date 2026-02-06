/**
 * Initialization Script
 * Run this to initialize default roles and permissions
 * Usage: node scripts/initialize.js
 */

const mongoose = require('mongoose');
const roleService = require('../src/services/roleService');
const permissionService = require('../src/services/permissionService');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_info_tmc';

async function initialize() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Initializing Permissions...');
    const permissionsResult = await permissionService.initializeDefaultPermissions();
    console.log(`✅ ${permissionsResult.message}`);
    console.log(`   Total permissions: ${permissionsResult.count}`);

    console.log('\n👥 Initializing Roles...');
    const rolesResult = await roleService.initializeDefaultRoles();
    console.log(`✅ ${rolesResult.message}`);

    console.log('\n🎉 Initialization Complete!');
    console.log('\n📊 Summary:');
    console.log('   - Roles: superadmin, admin, user');
    console.log('   - Permissions: All modules including Roles & Permissions Management');
    console.log('   - Ready to use! 🚀');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run initialization
initialize();
