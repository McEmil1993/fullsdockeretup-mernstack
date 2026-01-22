const Student = require('../models/Student');

class StudentService {
  async createStudent(studentData) {
    try {
      const {
        student_id,
        last_name,
        first_name,
        middle_initial = '',
        gender,
        course_year,
        status = 'active',
      } = studentData;

      // Check for duplicate student_id
      const existingStudent = await Student.findOne({ student_id });
      if (existingStudent) {
        throw new Error('Student with this student ID already exists');
      }

      const student = new Student({
        student_id,
        last_name,
        first_name,
        middle_initial,
        gender: gender.toUpperCase(),
        course_year,
        status,
      });

      await student.save();

      return student;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Student with this student ID already exists');
      }
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Check for duplicate student_id if it's being updated
      if (updateData.student_id && updateData.student_id !== student.student_id) {
        const existingStudent = await Student.findOne({ student_id: updateData.student_id });
        if (existingStudent) {
          throw new Error('Student with this student ID already exists');
        }
      }

      // Update allowed fields
      const allowedFields = [
        'student_id',
        'last_name',
        'first_name',
        'middle_initial',
        'gender',
        'course_year',
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'gender') {
            student[field] = updateData[field].toUpperCase();
          } else {
            student[field] = updateData[field];
          }
        }
      });

      await student.save();

      return student;
    } catch (error) {
      throw error;
    }
  }

  async updateStudentStatus(studentId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'graduated', 'dropped'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be one of: active, inactive, graduated, dropped');
      }

      const student = await Student.findByIdAndUpdate(
        studentId,
        { status },
        { new: true, runValidators: true }
      );

      if (!student) {
        throw new Error('Student not found');
      }

      return student;
    } catch (error) {
      throw error;
    }
  }

  async getStudentById(studentId) {
    try {
      const student = await Student.findById(studentId);
      
      if (!student) {
        throw new Error('Student not found');
      }

      return student;
    } catch (error) {
      throw error;
    }
  }

  async getStudentByStudentId(student_id) {
    try {
      const student = await Student.findOne({ student_id });
      
      if (!student) {
        throw new Error('Student not found');
      }

      return student;
    } catch (error) {
      throw error;
    }
  }

  async getAllStudents(page, limit, filters = {}) {
    try {
      // Build query from filters
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.gender) query.gender = filters.gender.toUpperCase();
      if (filters.student_id) query.student_id = { $regex: filters.student_id, $options: 'i' };
      if (filters.last_name) query.last_name = { $regex: filters.last_name, $options: 'i' };
      if (filters.first_name) query.first_name = { $regex: filters.first_name, $options: 'i' };
      if (filters.course_year) query.course_year = { $regex: filters.course_year, $options: 'i' };

      // Get total count
      const totalCount = await Student.countDocuments(query);

      // Get students with or without pagination
      let students;
      if (page !== undefined && limit !== undefined) {
        // Pagination enabled
        const skip = (page - 1) * limit;
        students = await Student.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
      } else {
        // No pagination - return all results
        students = await Student.find(query)
          .sort({ createdAt: -1 });
      }

      return {
        data: students,
        count: students.length,
        page: page !== undefined ? parseInt(page) : undefined,
        total_count: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StudentService();

