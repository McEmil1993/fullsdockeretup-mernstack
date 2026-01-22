const studentService = require('../services/studentService');

class StudentController {
  async createStudent(req, res) {
    try {
      const studentData = req.body;

      const student = await studentService.createStudent(studentData);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create student',
      });
    }
  }

  async updateStudent(req, res) {
    try {
      const { studentId, ...updateData } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required',
        });
      }

      // Check if at least one field is provided for update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided for update',
        });
      }

      const student = await studentService.updateStudent(studentId, updateData);

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student,
      });
    } catch (error) {
      const statusCode = error.message === 'Student not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update student',
      });
    }
  }

  async updateStudentStatus(req, res) {
    try {
      const { studentId, status } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required',
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const student = await studentService.updateStudentStatus(studentId, status);

      res.status(200).json({
        success: true,
        message: 'Student status updated successfully',
        data: student,
      });
    } catch (error) {
      const statusCode = error.message === 'Student not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update student status',
      });
    }
  }

  async getStudentById(req, res) {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required',
        });
      }

      const student = await studentService.getStudentById(studentId);

      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || 'Student not found',
      });
    }
  }

  async getStudentByStudentId(req, res) {
    try {
      const { student_id } = req.body;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: 'Student ID (student_id) is required',
        });
      }

      const student = await studentService.getStudentByStudentId(student_id);

      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || 'Student not found',
      });
    }
  }

  async getAllStudents(req, res) {
    try {
      const { page, limit, status, gender, student_id, last_name, first_name, course_year } = req.body;

      const filters = {};
      if (status) filters.status = status;
      if (gender) filters.gender = gender;
      if (student_id) filters.student_id = student_id;
      if (last_name) filters.last_name = last_name;
      if (first_name) filters.first_name = first_name;
      if (course_year) filters.course_year = course_year;

      const result = await studentService.getAllStudents(page, limit, filters);

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: result.data,
        count: result.count,
        page: result.page,
        total_count: result.total_count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve students',
      });
    }
  }
}

module.exports = new StudentController();

