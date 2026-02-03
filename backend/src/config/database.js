const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');

const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        name: 'Administrator',
        email: adminEmail,
        password: 'admin123!!',
        role: 'admin',
        status: 'active',
      });

      await admin.save();
      console.log('Default admin user created successfully');
    } else {
      console.log('Default admin user already exists');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error.message);
  }
};

const createDefaultAppSettings = async () => {
  try {
    const existingSettings = await AppSettings.findOne();

    if (!existingSettings) {
      await AppSettings.create({
        darkMode: false,
        fontFamily: 'Poppins',
        fontSize: '13px',
        activeSchoolYear: '2025-2026',
        activeTerm: 'Prelim',
        sideNavColor: '#1e293b',
        topNavColor: '#ffffff',
        sideNavFontColor: '#e2e8f0',
        sideNavHoverColor: '#ffffff',
        sideNavActiveColor: '#ffffff',
        topNavFontColor: '#1f2937',
        loginBackgroundType: 'color',
        loginBackgroundColor: '#d6d6d6',
        loginBackgroundImage: '',
        loginFormBgColor: '#ffffff',
        loginFormBgOpacity: 89,
      });
      console.log('Default app settings created successfully');
    } else {
      console.log('Default app settings already exists');
    }
  } catch (error) {
    console.error('Error creating default app settings:', error.message);
  }
};

// Removed: createDefaultHighestScores - Student management feature removed

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      '';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully');
    
    // Create default admin user after connection
    await createDefaultAdmin();
    
    // Create default app settings after connection
    await createDefaultAppSettings();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
