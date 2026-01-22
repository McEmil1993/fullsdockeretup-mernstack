const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const Assessment = require('../models/Assessment');

class AttendanceService {
  // Create or update attendance record
  async createOrUpdateAttendance(attendanceData) {
    try {
      const {
        scheduleId,
        student_id,
        date,
        attendance,
        school_year,
        term,
      } = attendanceData;

      // Verify schedule exists
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Verify student exists
      const student = await Student.findOne({ student_id });
      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student is in the schedule
      if (!schedule.students.includes(student_id)) {
        throw new Error('Student is not enrolled in this schedule');
      }

      // Find existing attendance record
      const existing = await Attendance.findOne({
        scheduleId,
        student_id,
        date: new Date(date),
        term: term.toLowerCase(),
        school_year,
      });

      let attendanceRecord;
      if (existing) {
        // Update existing
        existing.attendance = attendance.toLowerCase();
        await existing.save();
        attendanceRecord = existing;
      } else {
        // Create new
        attendanceRecord = new Attendance({
          scheduleId,
          student_id,
          date: new Date(date),
          attendance: attendance.toLowerCase(),
          school_year,
          term: term.toLowerCase(),
        });
        await attendanceRecord.save();
      }

      // Update assessment attendance score
      await this.updateAssessmentAttendanceScore(scheduleId, student_id, school_year, term);

      return attendanceRecord;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Attendance record already exists for this schedule, student, date, term, and school year');
      }
      throw error;
    }
  }

  // Update assessment attendance score based on present count
  async updateAssessmentAttendanceScore(scheduleId, student_id, school_year, term) {
    try {
      // Count how many times student was "present" for this schedule+student+term+school_year
      const presentCount = await Attendance.countDocuments({
        scheduleId,
        student_id,
        school_year,
        term: term.toLowerCase(),
        attendance: 'present',
      });

      // Find or create assessment record
      let assessment = await Assessment.findOne({
        scheduleId,
        student_id,
        school_year,
        term: term.toLowerCase(),
      });

      if (assessment) {
        // Update existing assessment
        assessment.scores.attendance = presentCount;
        await assessment.save();
      } else {
        // Create new assessment with default scores, but set attendance
        assessment = new Assessment({
          scheduleId,
          student_id,
          school_year,
          term: term.toLowerCase(),
          scores: {
            quizzes: {},
            activities: {},
            oral: {},
            projects: {},
            attendance: presentCount,
            exam_score: 0,
          },
        });
        await assessment.save();
      }

      return assessment;
    } catch (error) {
      throw error;
    }
  }

  // Get attendance records
  async getAttendance(filters = {}) {
    try {
      const {
        scheduleId,
        student_id,
        school_year,
        term,
        date,
        page = 1,
        limit = 100,
      } = filters;

      const query = {};
      if (scheduleId) query.scheduleId = scheduleId;
      if (student_id) query.student_id = student_id;
      if (school_year) query.school_year = school_year;
      if (term) query.term = term.toLowerCase();
      if (date) query.date = new Date(date);

      const skip = (page - 1) * limit;
      const totalCount = await Attendance.countDocuments(query);
      const attendances = await Attendance.find(query)
        .populate('scheduleId', 'subject_code description')
        .sort({ date: -1, student_id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Populate student details
      if (attendances.length > 0) {
        const studentIds = [...new Set(attendances.map(a => a.student_id))];
        const students = await Student.find({ student_id: { $in: studentIds } })
          .select('student_id last_name first_name middle_initial')
          .lean();

        const studentMap = {};
        students.forEach(s => {
          studentMap[s.student_id] = s;
        });

        attendances.forEach(attendance => {
          const student = studentMap[attendance.student_id];
          attendance.student_info = student ? {
            student_id: student.student_id,
            last_name: student.last_name,
            first_name: student.first_name,
            middle_initial: student.middle_initial,
            full_name: `${student.last_name}, ${student.first_name}${student.middle_initial ? ` ${student.middle_initial}.` : ''}`,
          } : null;
        });
      }

      return {
        attendances,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get attendance summary (count of present/absent per student)
  async getAttendanceSummary(scheduleId, school_year, term) {
    try {
      const attendances = await Attendance.find({
        scheduleId,
        school_year,
        term: term.toLowerCase(),
      }).lean();

      const summary = {};
      attendances.forEach(attendance => {
        const studentId = attendance.student_id;
        if (!summary[studentId]) {
          summary[studentId] = {
            student_id: studentId,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          };
        }
        summary[studentId][attendance.attendance]++;
        summary[studentId].total++;
      });

      return Object.values(summary);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AttendanceService();

