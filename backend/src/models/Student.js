const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  middle_initial: {
    type: String,
    trim: true,
    maxlength: [1, 'Middle initial must be a single character'],
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['MALE', 'FEMALE', 'OTHER'],
    uppercase: true,
  },
  course_year: {
    type: String,
    required: [true, 'Course year is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped'],
    default: 'active',
    required: true,
  },
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

