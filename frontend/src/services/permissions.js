import api from './api'

// Get all permissions
export const getAllPermissions = async () => {
  const response = await api.get('/api/permissions')
  return response.data
}

// Get permissions by module
export const getPermissionsByModule = async (module) => {
  const response = await api.get(`/api/permissions/module/${module}`)
  return response.data
}

// Initialize default permissions
export const initializeDefaultPermissions = async () => {
  const response = await api.post('/api/permissions/initialize')
  return response.data
}
