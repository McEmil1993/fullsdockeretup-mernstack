const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Schedule ID is required'],
    index: true,
  },
  student_id: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true,
    index: true,
  },
  school_year: {
    type: String,
    required: [true, 'School year is required'],
    trim: true,
    index: true,
  },
  term: {
    type: String,
    required: [true, 'Term is required'],
    enum: ['prelim', 'midterm', 'semi-final', 'final'],
    lowercase: true,
    index: true,
  },
  scores: {
    quizzes: {
      quiz_1: { type: Number, default: 0, min: 0 },
      quiz_2: { type: Number, default: 0, min: 0 },
      quiz_3: { type: Number, default: 0, min: 0 },
      quiz_4: { type: Number, default: 0, min: 0 },
      quiz_5: { type: Number, default: 0, min: 0 },
      quiz_6: { type: Number, default: 0, min: 0 },
      quiz_7: { type: Number, default: 0, min: 0 },
      quiz_8: { type: Number, default: 0, min: 0 },
      quiz_9: { type: Number, default: 0, min: 0 },
      quiz_10: { type: Number, default: 0, min: 0 },
    },
    activities: {
      activity_1: { type: Number, default: 0, min: 0 },
      activity_2: { type: Number, default: 0, min: 0 },
      activity_3: { type: Number, default: 0, min: 0 },
      activity_4: { type: Number, default: 0, min: 0 },
      activity_5: { type: Number, default: 0, min: 0 },
      activity_6: { type: Number, default: 0, min: 0 },
      activity_7: { type: Number, default: 0, min: 0 },
      activity_8: { type: Number, default: 0, min: 0 },
      activity_9: { type: Number, default: 0, min: 0 },
      activity_10: { type: Number, default: 0, min: 0 },
    },
    oral: {
      oral_1: { type: Number, default: 0, min: 0 },
      oral_2: { type: Number, default: 0, min: 0 },
      oral_3: { type: Number, default: 0, min: 0 },
      oral_4: { type: Number, default: 0, min: 0 },
      oral_5: { type: Number, default: 0, min: 0 },
    },
    projects: {
      project_1: { type: Number, default: 0, min: 0 },
      project_2: { type: Number, default: 0, min: 0 },
      project_3: { type: Number, default: 0, min: 0 },
      project_4: { type: Number, default: 0, min: 0 },
      project_5: { type: Number, default: 0, min: 0 },
    },
    attendance: { type: Number, default: 0, min: 0 },
    exam_score: { type: Number, default: 0, min: 0 },
  },
}, {
  timestamps: true,
});

// Compound index to ensure uniqueness per schedule+student+school_year+term
assessmentSchema.index({ scheduleId: 1, student_id: 1, school_year: 1, term: 1 }, { unique: true });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;

