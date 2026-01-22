const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject_code: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true,
  },
  academic_year: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
  },
  units: {
    type: Number,
    required: [true, 'Units is required'],
    min: [1, 'Units must be at least 1'],
  },
  days: {
    type: String,
    required: [true, 'Days is required'],
    trim: true,
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true,
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
  },
  block: {
    type: String,
    required: false,
    default: null,
    trim: true,
  },
  students: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: 'Students must be an array',
    },
  },
  student_count: {
    type: Number,
    default: 0,
    min: [0, 'Student count cannot be negative'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active',
    required: true,
  },
}, {
  timestamps: true,
});

// Auto-calculate student_count before save
scheduleSchema.pre('save', function(next) {
  if (this.isModified('students')) {
    this.student_count = this.students.length;
  }
  next();
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;

