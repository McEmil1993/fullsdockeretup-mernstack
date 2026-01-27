import { post } from './api'

/**
 * Create or update attendance record
 * @param {object} attendanceData - Attendance data
 * @param {string} attendanceData.scheduleId - Schedule MongoDB ID
 * @param {string} attendanceData.student_id - Student ID
 * @param {string} attendanceData.date - Date (YYYY-MM-DD)
 * @param {string} attendanceData.attendance - Attendance status (present|absent|late|excused)
 * @param {string} attendanceData.school_year - School year
 * @param {string} attendanceData.term - Term (prelim|midterm|semi-final|final)
 * @returns {Promise<{data: object, success: boolean, message: string}>}
 */
export async function createOrUpdateAttendance(attendanceData) {
  const { data } = await post('/api/attendance', attendanceData)
  return {
    data: data.data || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get attendance records
 * @param {object} params - Query parameters
 * @param {string} params.scheduleId - Schedule MongoDB ID
 * @param {string} params.date - Date (YYYY-MM-DD)
 * @param {string} params.school_year - School year
 * @param {string} params.term - Term (prelim|midterm|semi-final|final)
 * @param {string} [params.student_id] - Student ID (optional)
 * @param {number} [params.page] - Page number (optional)
 * @param {number} [params.limit] - Items per page (optional)
 * @returns {Promise<{data: array, pagination: object, success: boolean, message: string}>}
 */
export async function getAttendance(params) {
  const { data } = await post('/api/attendance/get', params)
  return {
    data: data.data || [],
    pagination: data.pagination || {},
    success: data.success,
    message: data.message,
  }
}

/**
 * Get attendance summary
 * @param {object} params - Query parameters
 * @param {string} params.scheduleId - Schedule MongoDB ID
 * @param {string} params.school_year - School year
 * @param {string} params.term - Term (prelim|midterm|semi-final|final)
 * @returns {Promise<{data: array, success: boolean, message: string}>}
 */
export async function getAttendanceSummary(params) {
  const { data } = await post('/api/attendance/get-summary', params)
  return {
    data: data.data || [],
    success: data.success,
    message: data.message,
  }
}

