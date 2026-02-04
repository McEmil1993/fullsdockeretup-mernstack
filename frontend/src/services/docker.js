/**
 * Docker Service
 * API calls for Docker monitoring
 */

import { get, post, del } from './api'

/**
 * Get all Docker images
 */
export async function getAllImages() {
  const { data } = await get('/api/docker/images')
  return data
}

/**
 * Get all containers (running and stopped)
 */
export async function getAllContainers() {
  const { data } = await get('/api/docker/containers')
  return data
}

/**
 * Get running containers only
 */
export async function getRunningContainers() {
  const { data } = await get('/api/docker/containers/running')
  return data
}

/**
 * Get container stats
 */
export async function getContainerStats(containerId) {
  const { data } = await get(`/api/docker/containers/${containerId}/stats`)
  return data
}

/**
 * Get all container stats
 */
export async function getAllContainerStats() {
  const { data } = await get('/api/docker/stats')
  return data
}

/**
 * Get container logs
 */
export async function getContainerLogs(containerId, tail = 100) {
  const { data } = await get(`/api/docker/containers/${containerId}/logs?tail=${tail}`)
  return data
}

/**
 * Restart container
 */
export async function restartContainer(containerId) {
  const response = await post(`/api/docker/containers/${containerId}/restart`)
  return response.data
}

/**
 * Stop container
 */
export async function stopContainer(containerId) {
  const response = await post(`/api/docker/containers/${containerId}/stop`)
  return response.data
}

/**
 * Start container
 */
export async function startContainer(containerId) {
  const response = await post(`/api/docker/containers/${containerId}/start`)
  return response.data
}

/**
 * Remove container
 */
export async function removeContainer(containerId, force = false) {
  const { data } = await del(`/api/docker/containers/${containerId}?force=${force}`)
  return data
}

/**
 * Remove image
 */
export async function removeImage(imageId, force = false) {
  const { data } = await del(`/api/docker/images/${imageId}?force=${force}`)
  return data
}

/**
 * Prune unused images
 */
export async function pruneImages() {
  const response = await post('/api/docker/images/prune')
  return response.data
}

/**
 * Get Docker system info
 */
export async function getSystemInfo() {
  const { data } = await get('/api/docker/system/info')
  return data
}

/**
 * Get Docker disk usage
 */
export async function getDiskUsage() {
  const { data } = await get('/api/docker/system/disk-usage')
  return data
}

/**
 * Rebuild container
 */
export async function rebuildContainer(serviceName, composePath) {
  const response = await post(`/api/docker/containers/${serviceName}/rebuild`, { composePath })
  return response.data
}

/**
 * Inspect container
 */
export async function inspectContainer(containerId) {
  const { data } = await get(`/api/docker/containers/${containerId}/inspect`)
  return data
}

/**
 * Recreate container (stop, remove, and recreate with same image)
 */
export async function recreateContainer(containerId) {
  const response = await post(`/api/docker/containers/${containerId}/recreate`)
  return response.data
}

/**
 * Get container bash history
 */
export async function getContainerBashHistory(containerId) {
  const { data } = await get(`/api/docker/containers/${containerId}/bash-history`)
  return data
}

/**
 * Get all used ports
 */
export async function getUsedPorts() {
  const { data } = await get('/api/docker/ports/used')
  return data
}

/**
 * Check if container name exists
 */
export async function checkContainerName(name) {
  const { data } = await get(`/api/docker/containers/check-name/${name}`)
  return data
}

/**
 * Check if ports are available
 */
export async function checkPortsAvailable(ports) {
  const response = await post('/api/docker/ports/check-available', { ports })
  return response.data
}

/**
 * Create custom container
 */
export async function createCustomContainer(config) {
  const response = await post('/api/docker/containers/create', config)
  return response.data
}

/**
 * Delete container completely with volumes
 */
export async function deleteContainerCompletely(containerId) {
  const response = await del(`/api/docker/containers/${containerId}/complete`)
  return response.data
}
