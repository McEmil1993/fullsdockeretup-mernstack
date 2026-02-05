import api from './api'

// Get all roles
export const getAllRoles = async () => {
  const response = await api.get('/api/roles')
  return response.data
}

// Get role by name
export const getRoleByName = async (name) => {
  const response = await api.get(`/api/roles/${name}`)
  return response.data
}

// Get current user's permissions
export const getMyPermissions = async () => {
  const response = await api.get('/api/roles/my-permissions')
  return response.data
}

// Check specific permission
export const checkPermission = async (permission) => {
  const response = await api.post('/api/roles/check-permission', { permission })
  return response.data
}

// Create new role
export const createRole = async (roleData) => {
  const response = await api.post('/api/roles', roleData)
  return response.data
}

// Update role
export const updateRole = async (name, roleData) => {
  const response = await api.put(`/api/roles/${name}`, roleData)
  return response.data
}

// Create or update role (legacy - keep for compatibility)
export const createOrUpdateRole = async (roleData) => {
  const response = await api.post('/api/roles', roleData)
  return response.data
}

// Update role permissions
export const updateRolePermissions = async (name, permissions) => {
  const response = await api.put(`/api/roles/${name}/permissions`, { permissions })
  return response.data
}

// Delete role
export const deleteRole = async (name) => {
  const response = await api.delete(`/api/roles/${name}`)
  return response.data
}

// Initialize default roles
export const initializeDefaultRoles = async () => {
  const response = await api.post('/api/roles/initialize')
  return response.data
}
