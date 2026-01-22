/**
 * Script to insert default highest scores for all schedules
 * Run with: node scripts/insertDefaultHighestScores.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('../src/models/Schedule');
const AssessmentHighestScores = require('../src/models/AssessmentHighestScores');

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

const insertDefaultHighestScores = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || '';
    
    if (!mongoURI) {
      console.error('MONGODB_URI is not set in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully');

    // Get all schedules
    const schedules = await Schedule.find();
    
    if (schedules.length === 0) {
      console.log('No schedules found. Please create schedules first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const terms = ['prelim', 'midterm', 'semi-final', 'final'];
    let createdCount = 0;
    let skippedCount = 0;

    for (const schedule of schedules) {
      const school_year = schedule.academic_year || '2025-2026';
      
      console.log(`\nProcessing schedule: ${schedule.subject_code} (${schedule.academic_year})`);
      
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
          console.log(`  ✓ Created highest scores for ${term}`);
          createdCount++;
        } else {
          console.log(`  - Highest scores for ${term} already exists (skipped)`);
          skippedCount++;
        }
      }
    }

    console.log('\n========================================');
    console.log('Summary:');
    console.log(`  Created: ${createdCount} entries`);
    console.log(`  Skipped: ${skippedCount} entries`);
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

insertDefaultHighestScores();

