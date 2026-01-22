const Schedule = require('../models/Schedule');

class ScheduleService {
  async createSchedule(scheduleData) {
    try {
      const {
        subject_code,
        description,
        semester,
        academic_year,
        units,
        days,
        time,
        room,
        block = null,
        students = [],
        status = 'active',
      } = scheduleData;

      // Check for duplicate schedule
      // A schedule is considered duplicate if it has the same:
      // - days, time, and room
      const existingSchedule = await Schedule.findOne({
        days: days, // String format: "TTH"
        time: time, // String format: "10:00 AM - 11:30 AM"
        room: room,
      });

      if (existingSchedule) {
        throw new Error('Schedule already exists with the same days, time, and room');
      }

      // Auto-calculate student_count from students array
      const student_count = students.length;

      const schedule = new Schedule({
        subject_code,
        description,
        semester,
        academic_year,
        units,
        days,
        time,
        room,
        block,
        students,
        student_count,
        status,
      });

      await schedule.save();

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  async updateSchedule(scheduleId, updateData) {
    try {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Prepare data for duplicate check (use updated values if provided, otherwise use existing)
      const checkData = {
        room: updateData.room !== undefined ? updateData.room : schedule.room,
        days: updateData.days !== undefined ? updateData.days : schedule.days,
        time: updateData.time !== undefined ? updateData.time : schedule.time,
      };

      // Check for duplicate schedule (excluding current schedule)
      // Only check if any of the key fields are being updated
      const isUpdatingKeyFields = 
        updateData.room !== undefined ||
        updateData.days !== undefined ||
        updateData.time !== undefined;

      if (isUpdatingKeyFields) {
        const existingSchedule = await Schedule.findOne({
          _id: { $ne: scheduleId }, // Exclude current schedule
          days: checkData.days, // String format: "TTH"
          time: checkData.time, // String format: "10:00 AM - 11:30 AM"
          room: checkData.room,
        });

        if (existingSchedule) {
          throw new Error('Schedule already exists with the same days, time, and room');
        }
      }

      // Update allowed fields
      const allowedFields = [
        'subject_code',
        'description',
        'semester',
        'academic_year',
        'units',
        'days',
        'time',
        'room',
        'block',
        'students',
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          schedule[field] = updateData[field];
        }
      });

      // Auto-update student_count if students array changed
      if (updateData.students !== undefined) {
        schedule.student_count = updateData.students.length;
      }

      await schedule.save();

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  async updateScheduleStatus(scheduleId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be one of: active, inactive, cancelled');
      }

      const schedule = await Schedule.findByIdAndUpdate(
        scheduleId,
        { status },
        { new: true, runValidators: true }
      );

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  async getScheduleById(scheduleId) {
    try {
      const schedule = await Schedule.findById(scheduleId);
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  async getAllSchedules(page, limit, filters = {}) {
    try {
      // Build query from filters
      const query = {};
      if (filters.semester) query.semester = filters.semester;
      if (filters.academic_year) query.academic_year = filters.academic_year;
      if (filters.status) query.status = filters.status;
      if (filters.subject_code) query.subject_code = { $regex: filters.subject_code, $options: 'i' };
      if (filters.block) query.block = filters.block;

      // Get total count
      const totalCount = await Schedule.countDocuments(query);

      // Get schedules with or without pagination
      let schedules;
      if (page !== undefined && limit !== undefined) {
        // Pagination enabled
        const skip = (page - 1) * limit;
        schedules = await Schedule.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
      } else {
        // No pagination - return all results
        schedules = await Schedule.find(query)
          .sort({ createdAt: -1 });
      }

      return {
        data: schedules,
        count: schedules.length,
        page: page !== undefined ? parseInt(page) : undefined,
        total_count: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ScheduleService();

