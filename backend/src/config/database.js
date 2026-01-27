const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');
const Schedule = require('../models/Schedule');
const AssessmentHighestScores = require('../models/AssessmentHighestScores');

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

const createDefaultHighestScores = async () => {
  try {
    // Get all schedules
    const schedules = await Schedule.find({ status: 'active' });
    
    if (schedules.length === 0) {
      console.log('No active schedules found. Skipping default highest scores creation.');
      return;
    }

    const defaultHighestScores = {
      quizzes: {
        quiz_1: 10,
        quiz_2: 10,
        quiz_3: 10,
        quiz_4: 10,
        quiz_5: 10,
        quiz_6: 10,
        quiz_7: 10,
        quiz_8: 10,
        quiz_9: 10,
        quiz_10: 10,
      },
      activities: {
        activity_1: 20,
        activity_2: 20,
        activity_3: 20,
        activity_4: 20,
        activity_5: 20,
        activity_6: 20,
        activity_7: 20,
        activity_8: 20,
        activity_9: 20,
        activity_10: 20,
      },
      oral: {
        oral_1: 20,
        oral_2: 20,
        oral_3: 20,
        oral_4: 20,
        oral_5: 20,
      },
      projects: {
        project_1: 20,
        project_2: 20,
        project_3: 20,
        project_4: 20,
        project_5: 20,
      },
      attendance: 10,
      exam_score: 50,
    };

    const terms = ['prelim', 'midterm', 'semi-final', 'final'];
    let createdCount = 0;
    let skippedCount = 0;

    for (const schedule of schedules) {
      const school_year = schedule.academic_year || '2025-2026';
      
      for (const term of terms) {
        const existing = await AssessmentHighestScores.findOne({
          scheduleId: schedule._id,
          school_year,
          term,
        });

        if (!existing) {
          await AssessmentHighestScores.create({
            scheduleId: schedule._id,
            school_year,
            term,
            highest_scores: defaultHighestScores,
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      }
    }

    if (createdCount > 0) {
      console.log(`Default highest scores created: ${createdCount} entries`);
    }
    if (skippedCount > 0) {
      console.log(`Default highest scores already exist: ${skippedCount} entries skipped`);
    }
  } catch (error) {
    console.error('Error creating default highest scores:', error.message);
  }
};

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
    
    // Create default highest scores for all active schedules
    await createDefaultHighestScores();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
