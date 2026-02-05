import { useState, useEffect } from 'react'
import { Shield, Plus, Edit2, Trash2, Save } from 'lucide-react'
import * as roleService from '../services/roles'
import Toast from '../components/Toast'
import PermissionGate from '../components/PermissionGate'
import NoPermission from '../components/NoPermission'
import Modal from '../components/Modal'
import { usePermissions } from '../contexts/PermissionContext'

const Roles = () => {
  const { hasPermission } = usePermissions()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: ''
  })
  const [errors, setErrors] = useState({
    name: '',
    displayName: '',
    description: ''
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await roleService.getAllRoles()
      if (response.success) {
        setRoles(response.data)
      }
    } catch (error) {
      showToast('Error loading roles: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
  }

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        displayName: role.displayName,
        description: role.description
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        displayName: '',
        description: ''
      })
    }
    setErrors({ name: '', displayName: '', description: '' })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRole(null)
    setFormData({ name: '', displayName: '', description: '' })
    setErrors({ name: '', displayName: '', description: '' })
  }

  const validateRoleName = (name) => {
    if (!name) {
      return 'Role name is required'
    }
    if (!/^[a-z0-9_]+$/.test(name)) {
      return 'Only lowercase letters, numbers, and underscores allowed'
    }
    if (name.length < 3) {
      return 'Role name must be at least 3 characters'
    }
    return ''
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    
    // Validate on change
    if (field === 'name' && !editingRole) {
      const error = validateRoleName(value)
      setErrors({ ...errors, name: error })
    } else if (field === 'displayName') {
      setErrors({ ...errors, displayName: value ? '' : 'Display name is required' })
    } else if (field === 'description') {
      setErrors({ ...errors, description: value ? '' : 'Description is required' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields before submitting
    const nameError = !editingRole ? validateRoleName(formData.name) : ''
    const displayNameError = !formData.displayName ? 'Display name is required' : ''
    const descriptionError = !formData.description ? 'Description is required' : ''
    
    if (nameError || displayNameError || descriptionError) {
      setErrors({
        name: nameError,
        displayName: displayNameError,
        description: descriptionError
      })
      showToast('Please fix the errors in the form', 'error')
      return
    }
    
    try {
      let response
      if (editingRole) {
        response = await roleService.updateRole(editingRole.name, formData)
      } else {
        response = await roleService.createRole(formData)
      }

      if (response.success) {
        showToast(`Role ${editingRole ? 'updated' : 'created'} successfully!`, 'success')
        fetchRoles()
        handleCloseModal()
      } else {
        showToast(response.message || 'Error saving role', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error saving role'
      showToast(errorMessage, 'error')
    }
  }

  const handleDelete = async (roleName) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return

    try {
      const response = await roleService.deleteRole(roleName)
      if (response.success) {
        showToast('Role deleted successfully!', 'success')
        fetchRoles()
      }
    } catch (error) {
      showToast('Error deleting role: ' + error.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <PermissionGate
      permission="userManagement.canView"
      fallback={<NoPermission message="You do not have permission to manage roles!" />}
    >
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Roles Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Create, edit, and manage user roles
            </p>
          </div>
          {hasPermission('roles.canCreate') && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{role.name}</p>
                  </div>
                </div>
                {role.isSystemRole && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                    System
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {role.description}
              </p>

              <div className="flex gap-2">
                {hasPermission('roles.canEdit') && (
                  <button
                    onClick={() => handleOpenModal(role)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors text-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
                {hasPermission('roles.canDelete') && !role.isSystemRole && (
                  <button
                    onClick={() => handleDelete(role.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded transition-colors text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={handleCloseModal}
          title={editingRole ? 'Edit Role' : 'Add New Role'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Name (Unique Key)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={editingRole !== null}
                placeholder="e.g., developer"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed ${
                  errors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                required
              />
              {errors.name && !editingRole && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
              {editingRole && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role name cannot be changed</p>
              )}
              {!editingRole && !errors.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use lowercase letters, numbers, and underscores only</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="e.g., Developer"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white ${
                  errors.displayName 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                required
              />
              {errors.displayName && (
                <p className="text-xs text-red-500 mt-1">{errors.displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the role..."
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white resize-none ${
                  errors.description 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                required
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingRole ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </PermissionGate>
  )
}

export default Roles
