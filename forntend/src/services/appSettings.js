/**
 * App Settings API Service
 * Handles all app settings-related API calls
 */

import { post } from './api'

/**
 * Get app settings
 * @returns {Promise<{settings: object}>}
 */
export async function getSettings() {
  const { data } = await post('/api/app-settings/get')
  return data
}

/**
 * Update app settings
 * @param {object} settings - Settings to update (partial)
 * @returns {Promise<{settings: object}>}
 */
export async function updateSettings(settings) {
  const { data } = await post('/api/app-settings/update', settings)
  return data
}

/**
 * Reset settings to defaults
 * @returns {Promise<{settings: object}>}
 */
export async function resetSettings() {
  const { data } = await post('/api/app-settings/reset')
  return data
}

export default {
  getSettings,
  updateSettings,
  resetSettings,
}

