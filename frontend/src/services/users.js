/**
 * User Management API Service
 * Handles all user-related API calls
 */

import { post } from './api'

/**
 * Create a new user
 * @param {object} userData - User data
 * @param {string} userData.name - User name (required)
 * @param {string} userData.email - User email (required)
 * @param {string} userData.password - User password (required)
 * @param {string} [userData.role] - User role (admin|student|instructor|staff)
 * @param {string} [userData.status] - User status (active|inactive|suspended)
 * @returns {Promise<{user: object}>}
 */
export async function createUser(userData) {
  const { data } = await post('/api/users', userData)
  // Handle response structure: { success, message, data: { user object } }
  return {
    user: data.data || data.user || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update user
 * @param {object} updateData - Update data
 * @param {string} updateData.userId - User ID (required)
 * @param {string} [updateData.name] - User name
 * @param {string} [updateData.email] - User email
 * @param {string} [updateData.role] - User role
 * @returns {Promise<{user: object}>}
 */
export async function updateUser(updateData) {
  const { data } = await post('/api/users/update', updateData)
  // Handle response structure: { success, message, data: { user object } }
  return {
    user: data.data || data.user || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Update user status
 * @param {object} statusData - Status data
 * @param {string} statusData.userId - User ID (required)
 * @param {string} statusData.status - User status (required)
 * @returns {Promise<{user: object}>}
 */
export async function updateUserStatus(statusData) {
  const { data } = await post('/api/users/status', statusData)
  // Handle response structure: { success, message, data: { user object } }
  return {
    user: data.data || data.user || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<{user: object}>}
 */
export async function getUserById(userId) {
  const { data } = await post('/api/users/get', { userId })
  // Handle response structure: { success, message, data: { user object } }
  return {
    user: data.data || data.user || data,
    success: data.success,
    message: data.message,
  }
}

/**
 * Get all users with pagination
 * @param {object} [pagination] - Pagination options
 * @param {number} [pagination.page] - Page number
 * @param {number} [pagination.limit] - Items per page
 * @returns {Promise<{users: array, total: number, page: number, limit: number, count: number, total_count: number}>}
 */
export async function getAllUsers(pagination = {}) {
  const { data } = await post('/api/users/get-all', pagination)
  // Handle response structure: { success, message, data: [...users], count, page, total_count }
  return {
    users: data.data || data.users || [],
    total: data.total_count || data.count || 0,
    count: data.count || 0,
    page: data.page || pagination.page || 1,
    limit: pagination.limit || 10,
    total_count: data.total_count || data.count || 0,
  }
}

/**
 * Verify user password
 * @param {object} passwordData - Password data
 * @param {string} passwordData.userId - User ID (required)
 * @param {string} passwordData.currentPassword - Current password (required)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyPassword(passwordData) {
  const { data } = await post('/api/users/verify-password', passwordData)
  // Handle response structure: { success, message }
  return {
    success: data.success,
    message: data.message,
  }
}

/**
 * Change user password
 * @param {object} passwordData - Password data
 * @param {string} passwordData.userId - User ID (required)
 * @param {string} passwordData.newPassword - New password (required)
 * @returns {Promise<{user: object, success: boolean, message: string}>}
 */
export async function changePassword(passwordData) {
  const { data } = await post('/api/users/change-password', passwordData)
  // Handle response structure: { success, message, data: { user object } }
  return {
    user: data.data || data.user || data,
    success: data.success,
    message: data.message,
  }
}

export default {
  createUser,
  updateUser,
  updateUserStatus,
  getUserById,
  getAllUsers,
  verifyPassword,
  changePassword,
}

