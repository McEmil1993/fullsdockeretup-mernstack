/**
 * Student Management API Service
 * Handles all student-related API calls
 */

import { post } from './api'

/**
 * Create a new student
 * @param {object} studentData - Student data
 * @param {string} studentData.student_id - Student ID (required)
 * @param {string} studentData.last_name - Last name (required)
 * @param {string} studentData.first_name - First name (required)
 * @param {string} [studentData.middle_initial] - Middle initial
 * @param {string} studentData.gender - Gender (MALE|FEMALE|OTHER) (required)
 * @param {string} [studentData.status] - Status (active|inactive|graduated|dropped)
 * @returns {Promise<{student: object, success: boolean, message: string}>}
 */
export async function createStudent(studentData) {
  const { data } = await post('/api/students', studentData)
  // Handle response structure: { success, message, data: { student object } }
  return {
    student: data.data || data.student || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update student
 * @param {object} updateData - Update data
 * @param {string} updateData.studentId - Student MongoDB ID (required)
 * @param {string} [updateData.student_id] - Student ID
 * @param {string} [updateData.last_name] - Last name
 * @param {string} [updateData.first_name] - First name
 * @param {string} [updateData.middle_initial] - Middle initial
 * @param {string} [updateData.gender] - Gender
 * @returns {Promise<{student: object, success: boolean, message: string}>}
 */
export async function updateStudent(updateData) {
  const { data } = await post('/api/students/update', updateData)
  // Handle response structure: { success, message, data: { student object } }
  return {
    student: data.data || data.student || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update student status
 * @param {object} statusData - Status data
 * @param {string} statusData.studentId - Student MongoDB ID (required)
 * @param {string} statusData.status - Status (active|inactive|graduated|dropped) (required)
 * @returns {Promise<{student: object, success: boolean, message: string}>}
 */
export async function updateStudentStatus(statusData) {
  const { data } = await post('/api/students/status', statusData)
  // Handle response structure: { success, message, data: { student object } }
  return {
    student: data.data || data.student || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get student by MongoDB ID
 * @param {string} studentId - Student MongoDB ID
 * @returns {Promise<{student: object, success: boolean, message: string}>}
 */
export async function getStudentById(studentId) {
  const { data } = await post('/api/students/get', { studentId })
  // Handle response structure: { success, message, data: { student object } }
  return {
    student: data.data || data.student || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get student by student ID (e.g., "24-019536")
 * @param {string} student_id - Student ID
 * @returns {Promise<{student: object, success: boolean, message: string}>}
 */
export async function getStudentByStudentId(student_id) {
  const { data } = await post('/api/students/get-by-student-id', { student_id })
  // Handle response structure: { success, message, data: { student object } }
  return {
    student: data.data || data.student || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get all students with pagination and filters
 * @param {object} [params] - Pagination and filter options
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @param {string} [params.status] - Filter by status (active|inactive|graduated|dropped)
 * @param {string} [params.gender] - Filter by gender (MALE|FEMALE|OTHER)
 * @param {string} [params.student_id] - Filter by student ID (partial match)
 * @param {string} [params.last_name] - Filter by last name (partial match)
 * @param {string} [params.first_name] - Filter by first name (partial match)
 * @returns {Promise<{students: array, total: number, page: number, limit: number, count: number, total_count: number}>}
 */
export async function getAllStudents(params = {}) {
  const { data } = await post('/api/students/get-all', params)
  // Handle response structure: { success, message, data: [...students], count, page, total_count }
  return {
    students: data.data || data.students || [],
    total: data.total_count || data.count || 0,
    count: data.count || 0,
    page: data.page || params.page || 1,
    limit: params.limit || 10,
    total_count: data.total_count || data.count || 0,
  }
}

export default {
  createStudent,
  updateStudent,
  updateStudentStatus,
  getStudentById,
  getStudentByStudentId,
  getAllStudents,
}

