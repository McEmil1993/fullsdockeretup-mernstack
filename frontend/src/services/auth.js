/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { post, get } from './api'

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: object}>}
 */
export async function login(email, password) {
  const { data } = await post('/api/auth/login', { email, password })
  return data
}

/**
 * Get current user (who am I)
 * @returns {Promise<{user: object}>}
 */
export async function getCurrentUser() {
  const { data } = await get('/api/auth/me')
  return data
}

/**
 * Refresh access token
 * @returns {Promise<{success: boolean}>}
 */
export async function refreshToken() {
  const { data } = await post('/api/auth/refresh')
  return data
}

/**
 * Logout user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function logout() {
  const { data } = await post('/api/auth/logout')
  return data
}

export default {
  login,
  getCurrentUser,
  refreshToken,
  logout,
}

