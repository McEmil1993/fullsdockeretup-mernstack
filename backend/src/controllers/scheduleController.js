const scheduleService = require('../services/scheduleService');

class ScheduleController {
  async createSchedule(req, res) {
    try {
      // Accept schedule data directly from root level (not nested in "schedule" object)
      const scheduleData = req.body;

      const schedule = await scheduleService.createSchedule(scheduleData);

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create schedule',
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const { scheduleId, ...updateData } = req.body;

      // Remove scheduleId from updateData if present (already destructured, but just in case)
      delete updateData.scheduleId;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'Schedule ID is required',
        });
      }

      // Check if at least one field is provided for update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided for update',
        });
      }

      const schedule = await scheduleService.updateSchedule(scheduleId, updateData);

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule,
      });
    } catch (error) {
      const statusCode = error.message === 'Schedule not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update schedule',
      });
    }
  }

  async updateScheduleStatus(req, res) {
    try {
      const { scheduleId, status } = req.body;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'Schedule ID is required',
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const schedule = await scheduleService.updateScheduleStatus(scheduleId, status);

      res.status(200).json({
        success: true,
        message: 'Schedule status updated successfully',
        data: schedule,
      });
    } catch (error) {
      const statusCode = error.message === 'Schedule not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update schedule status',
      });
    }
  }

  async getScheduleById(req, res) {
    try {
      const { scheduleId } = req.body;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'Schedule ID is required',
        });
      }

      const schedule = await scheduleService.getScheduleById(scheduleId);

      res.status(200).json({
        success: true,
        message: 'Schedule retrieved successfully',
        data: schedule,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || 'Schedule not found',
      });
    }
  }

  async getAllSchedules(req, res) {
    try {
      const { page, limit, semester, academic_year, status, subject_code, block } = req.body;

      const filters = {};
      if (semester) filters.semester = semester;
      if (academic_year) filters.academic_year = academic_year;
      if (status) filters.status = status;
      if (subject_code) filters.subject_code = subject_code;
      if (block) filters.block = block;

      const result = await scheduleService.getAllSchedules(page, limit, filters);

      res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: result.data,
        count: result.count,
        page: result.page,
        total_count: result.total_count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve schedules',
      });
    }
  }
}

module.exports = new ScheduleController();

