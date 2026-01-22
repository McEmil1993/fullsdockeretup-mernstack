const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
  },
  attendance: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: ['present', 'absent', 'late', 'excused'],
    lowercase: true,
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
}, {
  timestamps: true,
});

// Compound index to ensure uniqueness per schedule+student+date+term+school_year
attendanceSchema.index({ scheduleId: 1, student_id: 1, date: 1, term: 1, school_year: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

