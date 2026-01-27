import { post } from './api'

/**
 * Create a new schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} Response with schedule data
 */
export async function createSchedule(scheduleData) {
  const { data } = await post('/api/schedules', scheduleData)
  return {
    schedule: data.data || data.schedule || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update a schedule
 * @param {Object} updateData - Update data with scheduleId and fields to update
 * @returns {Promise<Object>} Response with updated schedule
 */
export async function updateSchedule(updateData) {
  const { data } = await post('/api/schedules/update', updateData)
  return {
    schedule: data.data || data.schedule || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update schedule status
 * @param {Object} statusData - Status data with scheduleId and status
 * @returns {Promise<Object>} Response with updated schedule
 */
export async function updateScheduleStatus(statusData) {
  const { data } = await post('/api/schedules/status', statusData)
  return {
    schedule: data.data || data.schedule || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get schedule by ID
 * @param {string} scheduleId - Schedule MongoDB ID
 * @returns {Promise<Object>} Response with schedule data
 */
export async function getScheduleById(scheduleId) {
  const { data } = await post('/api/schedules/get', { scheduleId })
  return {
    schedule: data.data || data.schedule || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get all schedules with pagination and filters
 * @param {Object} pagination - Pagination and filter options
 * @param {number} pagination.page - Page number (default: 1)
 * @param {number} pagination.limit - Items per page (default: 10)
 * @param {string} pagination.semester - Filter by semester
 * @param {string} pagination.academic_year - Filter by academic year
 * @param {string} pagination.status - Filter by status
 * @param {string} pagination.subject_code - Filter by subject code
 * @returns {Promise<Object>} Response with schedules and pagination info
 */
export async function getAllSchedules(pagination = {}) {
  const { data } = await post('/api/schedules/get-all', pagination)
  return {
    schedules: data.data || data.schedules || [],
    count: data.count || 0,
    page: data.page || 1,
    total_count: data.total_count || data.total || 0,
    success: data.success,
    message: data.message,
  }
}

