const attendanceService = require('../services/attendanceService');

class AttendanceController {
  // Create or update attendance record
  async createOrUpdateAttendance(req, res) {
    try {
      const { scheduleId, student_id, date, attendance, school_year, term } = req.body;

      if (!scheduleId || !student_id || !date || !attendance || !school_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, student_id, date, attendance, school_year, and term are required',
        });
      }

      const result = await attendanceService.createOrUpdateAttendance({
        scheduleId,
        student_id,
        date,
        attendance,
        school_year,
        term,
      });

      res.status(200).json({
        success: true,
        message: 'Attendance saved successfully',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to save attendance',
      });
    }
  }

  // Get attendance records
  async getAttendance(req, res) {
    try {
      const {
        scheduleId,
        date,
        school_year,
        term,
        student_id,
        page = 1,
        limit = 100,
      } = req.body;

      if (!scheduleId || !date || !school_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, date, school_year, and term are required',
        });
      }

      const result = await attendanceService.getAttendance({
        scheduleId,
        date,
        school_year,
        term,
        student_id,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.attendances,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendance',
      });
    }
  }

  // Get attendance summary
  async getAttendanceSummary(req, res) {
    try {
      const { scheduleId, school_year, term } = req.body;

      if (!scheduleId || !school_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId, school_year, and term are required',
        });
      }

      const result = await attendanceService.getAttendanceSummary(scheduleId, school_year, term);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get attendance summary',
      });
    }
  }
}

module.exports = new AttendanceController();

