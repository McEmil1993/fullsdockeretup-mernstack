/**
 * Docker Logs Service
 * API calls for Docker action logs
 */

import { get } from './api'

/**
 * Get action logs for a specific container
 */
export async function getContainerActionLogs(containerId) {
  try {
    const { data } = await get(`/api/docker-logs/container/${containerId}`)
    return data
  } catch (error) {
    console.error('Failed to fetch container logs:', error)
    return []
  }
}

/**
 * Get recent action logs
 */
export async function getRecentLogs(limit = 100) {
  try {
    const { data } = await get(`/api/docker-logs/recent?limit=${limit}`)
    return data
  } catch (error) {
    console.error('Failed to fetch recent logs:', error)
    return []
  }
}

/**
 * Get all logs for all containers
 */
export async function getAllContainerLogs() {
  try {
    const { data } = await get('/api/docker-logs?targetType=container&limit=200')
    
    return data?.data?.logs || []
  } catch (error) {
    // Silently fail if not authenticated - logs will show as "-"
    return []
  }
}
