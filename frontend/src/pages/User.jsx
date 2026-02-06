import { useState, useMemo, useEffect } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'
import Skeleton from '../components/Skeleton'
import ProtectedPage from '../components/ProtectedPage'
import PermissionGate from '../components/PermissionGate'
import { Plus, RotateCcw, Copy, Check } from 'lucide-react'
import * as userService from '../services/users'
import * as roleService from '../services/roles'
import { usePermissions } from '../contexts/PermissionContext'

const User = () => {
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [availableRoles, setAvailableRoles] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: '', password: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Load users from API
  const loadUsers = async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const response = await userService.getAllUsers({ page, limit })
      // Map backend data to frontend format (_id -> id, capitalize role)
      const mappedUsers = (response.users || []).map(user => ({
        id: user._id || user.id,
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))
      setAllData(mappedUsers)
      setTotalCount(response.total_count || response.total || 0)
    } catch (error) {
      showToast('Failed to load users. Please try again.', 'error')
      setAllData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(currentPage, pageSize)
    loadRoles()
  }, [currentPage, pageSize])

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles()
      if (response.success) {
        setAvailableRoles(response.data || [])
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
      // Fallback to default roles if API fails
      setAvailableRoles([
        { name: 'superadmin', displayName: 'Super Admin' },
        { name: 'admin', displayName: 'Admin' },
        { name: 'user', displayName: 'User' }
      ])
    }
  }
  
  // Form validation errors
  const [errors, setErrors] = useState({ name: '', email: '', role: '', password: '' })
  const [touched, setTouched] = useState({ name: false, email: false, role: false, password: false })
  
  // Toast state
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })

  // Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    item: null,
    newStatus: null,
  })

  // Reset Password state
  const [resetPasswordDialog, setResetPasswordDialog] = useState({
    isOpen: false,
    item: null,
  })
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const columns = [
    { 
      key: 'avatar', 
      label: '',
      width: '1%',
      render: (value, item) => {
        const initial = item.name ? item.name.charAt(0).toUpperCase() : '?'
        // Generate a color based on the name for consistency
        const colors = [
          'bg-blue-500',
          'bg-green-500',
          'bg-purple-500',
          'bg-pink-500',
          'bg-indigo-500',
          'bg-yellow-500',
          'bg-red-500',
          'bg-teal-500',
        ]
        const colorIndex = item.name ? item.name.charCodeAt(0) % colors.length : 0
        const bgColor = colors[colorIndex]
        
        return (
          <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold`}>
            {initial}
          </div>
        )
      }
    },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'role', label: 'Role' },
  ]

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required'
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters'
    }
    return ''
  }

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validateRole = (role) => {
    if (!role) {
      return 'Role is required'
    }
    return ''
  }

  const validateField = (field, value) => {
    let error = ''
    switch (field) {
      case 'name':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'role':
        error = validateRole(value)
        break
      case 'password':
        error = validatePassword(value)
        break
      default:
        break
    }
    setErrors((prev) => ({ ...prev, [field]: error }))
    return error === ''
  }

  const validateForm = () => {
    const nameValid = validateField('name', formData.name)
    const emailValid = validateField('email', formData.email)
    const roleValid = validateField('role', formData.role)
    const passwordValid = !editingItem ? validateField('password', formData.password) : true
    
    setTouched({ name: true, email: true, role: true, password: !editingItem })
    
    return nameValid && emailValid && roleValid && passwordValid
  }
  
  const validatePassword = (password) => {
    if (!password || !password.trim()) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    return ''
  }

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, formData[field])
  }

  const handleEdit = (item) => {
    // Use existing item data immediately (no loading state to avoid table reload)
    setEditingItem(item)
    setFormData({ 
      name: item.name, 
      email: item.email, 
      role: item.role ? item.role.toLowerCase() : '',
      password: '' // Don't pre-fill password
    })
    setErrors({ name: '', email: '', role: '', password: '' })
    setTouched({ name: false, email: false, role: false, password: false })
    setIsModalOpen(true)
    
    // Optionally fetch latest data in background (non-blocking)
    // This updates the form if the modal is still open when data arrives
    userService.getUserById(item._id || item.id)
      .then((response) => {
        const user = response.user || response.data
        if (user) {
          // Update form with latest data (only if we got fresh data)
          setFormData((prev) => {
            // Only update if modal is still open (check by seeing if we have editingItem)
            return {
              name: user.name, 
              email: user.email, 
              role: user.role ? user.role.toLowerCase() : '',
              password: prev.password // Keep password field as is
            }
          })
        }
      })
      .catch((error) => {
        // Silently fail - we already have the item data from the list
      })
  }

  // Filter data (client-side search, but pagination is server-side)
  const filteredData = useMemo(() => {
    if (!searchQuery) return allData
    
    const query = searchQuery.toLowerCase()
    return allData.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    )
  }, [allData, searchQuery])

  // Use filtered data directly (pagination is handled by backend)
  const paginatedData = filteredData

  const totalPages = Math.ceil(totalCount / pageSize)

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const handleStatusChange = (item, newStatus) => {
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      item: item,
      newStatus: newStatus,
    })
  }

  const confirmStatusChange = async () => {
    const { item, newStatus } = confirmDialog
    if (item && newStatus) {
      try {
        const response = await userService.updateUserStatus({
          userId: item._id || item.id,
          status: newStatus
        })
        
        // Update local state
        setAllData(allData.map((d) => 
          (d._id || d.id) === (item._id || item.id) 
            ? { ...d, status: newStatus }
            : d
        ))
        
        const statusText = newStatus === 'active' ? 'active' : 'inactive'
        showToast(`${item.name} has been set to ${statusText}`, 'success')
      } catch (error) {
        showToast('Failed to update user status. Please try again.', 'error')
      }
    }
    setConfirmDialog({ isOpen: false, item: null, newStatus: null })
  }

  const generateTempPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleResetPassword = (item) => {
    setResetPasswordDialog({
      isOpen: true,
      item: item,
    })
  }

  const confirmResetPassword = async () => {
    const { item } = resetPasswordDialog
    if (item) {
      try {
        // Generate new random password
        const newTempPassword = generateTempPassword()
        
        // Call API to change password
        const response = await userService.changePassword({
          userId: item._id || item.id,
          newPassword: newTempPassword
        })
        
        // Show success message and display the new password
        setTempPassword(newTempPassword)
        setShowTempPassword(true)
        setResetPasswordDialog({ isOpen: false, item: null })
        showToast('Password reset successfully', 'success')
      } catch (error) {
        showToast(error.message || 'Failed to reset password. Please try again.', 'error')
        setResetPasswordDialog({ isOpen: false, item: null })
      }
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      showToast('Password copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast('Failed to copy password', 'error')
    }
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    // Validate password for new users
    if (!editingItem && !formData.password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }))
      setTouched((prev) => ({ ...prev, password: true }))
      showToast('Password is required for new users', 'error')
      return
    }

    setLoading(true)
    try {
      if (editingItem) {
        // Update existing user
        const updateData = {
          userId: editingItem._id || editingItem.id,
          name: formData.name,
          email: formData.email,
          role: formData.role.toLowerCase(), // Backend expects lowercase
        }
        
        const response = await userService.updateUser(updateData)
        const updatedUser = response.user || response.data
        
        // Update local state
        setAllData(allData.map((d) => 
          (d._id || d.id) === (editingItem._id || editingItem.id)
            ? {
                id: updatedUser._id || updatedUser.id,
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.status,
                role: updatedUser.role ? updatedUser.role.charAt(0).toUpperCase() + updatedUser.role.slice(1) : updatedUser.role,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
              }
            : d
        ))
        showToast('User updated successfully', 'success')
      } else {
        // Create new user
        const newUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role.toLowerCase(), // Backend expects lowercase
          status: 'active'
        }
        
        const response = await userService.createUser(newUserData)
        const newUser = response.user || response.data
        
        // Reload users to get updated list
        await loadUsers(currentPage, pageSize)
        showToast('User created successfully', 'success')
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ name: '', email: '', role: '', password: '' })
      setErrors({ name: '', email: '', role: '', password: '' })
      setTouched({ name: false, email: false, role: false, password: false })
    } catch (error) {
      showToast(error.message || 'An error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // loadUsers will be called via useEffect
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
    // loadUsers will be called via useEffect
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    // Search is client-side, no need to reload
  }

  const handleAddNew = () => {
    // Generate random password for new user
    const randomPassword = generateTempPassword()
    setEditingItem(null)
    setFormData({ name: '', email: '', role: '', password: randomPassword })
    setErrors({ name: '', email: '', role: '', password: '' })
    setTouched({ name: false, email: false, role: false, password: false })
    setIsModalOpen(true)
  }
  
  const copyPasswordToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.password)
      setPasswordCopied(true)
      showToast('Password copied to clipboard!', 'success')
      setTimeout(() => setPasswordCopied(false), 2000)
    } catch (err) {
      showToast('Failed to copy password', 'error')
    }
  }
  
  const regeneratePassword = () => {
    const newPassword = generateTempPassword()
    setFormData({ ...formData, password: newPassword })
    setPasswordCopied(false)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton variant="title" className="h-8 w-32 mb-2" />
            <Skeleton variant="text" className="h-4 w-64" />
          </div>
          <Skeleton variant="button" className="w-32 h-10" />
        </div>

        {/* Skeleton Pagination */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-10 w-96" />
              <Skeleton variant="text" className="h-10 w-48" />
            </div>
          </div>
        </div>

        <SkeletonTable rows={10} columns={6} />
      </div>
    )
  }

  return (
    <ProtectedPage permission="userManagement.canView" message="You do not have permission to view user management!">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage user accounts and permissions
            </p>
          </div>
          <PermissionGate permission="userManagement.canAddNewUser">
            <Button onClick={handleAddNew} variant="primary" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New
            </Button>
          </PermissionGate>
        </div>

      {/* Pagination - Top */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={searchQuery ? filteredData.length : totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, email, role, or status..."
      />

      <Table
        data={paginatedData}
        columns={columns}
        onEdit={hasPermission('userManagement.users.canEdit') ? handleEdit : null}
        onStatusChange={(hasPermission('userManagement.users.canSetActive') || hasPermission('userManagement.users.canSetInactive')) ? handleStatusChange : null}
        onResetPassword={hasPermission('userManagement.users.canResetPassword') ? handleResetPassword : null}
      />

      {/* Pagination - Bottom */}
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={searchQuery ? filteredData.length : totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showSearch={false}
        />
      )}

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Confirm Dialog - Status Change */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null, newStatus: null })}
        onConfirm={confirmStatusChange}
        title="Confirm Status Change"
        message={`Sigurado ba na ${confirmDialog.newStatus === 'active' ? 'Active' : 'Inactive'} mo itong user na ${confirmDialog.item?.name}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
      />

      {/* Reset Password Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetPasswordDialog.isOpen}
        onClose={() => setResetPasswordDialog({ isOpen: false, item: null })}
        onConfirm={confirmResetPassword}
        title="Reset Password"
        message={`Sigurado ba na gusto mong i-reset ang password ng user na ${resetPasswordDialog.item?.name || 'ito'}?`}
        confirmText="Reset"
        cancelText="Cancel"
        type="warning"
      />

      {/* Temporary Password Dialog */}
      {showTempPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTempPassword(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 animate-fadeIn"
            onClick={() => setShowTempPassword(false)}
          ></div>

          {/* Dialog */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border-2 border-blue-200 dark:border-blue-800 animate-slideUp z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <RotateCcw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Password Reset Successful
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Temporary password has been generated. Please copy and share it with the user.
                  </p>
                  
                  {/* Temporary Password Display */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Temporary Password
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-lg font-mono font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
                        {tempPassword}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className={`p-2 rounded-lg transition-colors ${
                          copied
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                        }`}
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="primary" onClick={() => setShowTempPassword(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          setFormData({ name: '', email: '', role: '', password: '' })
          setErrors({ name: '', email: '', role: '', password: '' })
          setTouched({ name: false, email: false, role: false, password: false })
        }}
        title={editingItem ? 'Edit User' : 'Add New User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.name && errors.name
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter full name"
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.email && errors.email
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter email address"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleFieldChange('role', e.target.value)}
              onBlur={() => handleFieldBlur('role')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.role && errors.role
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">Select Role</option>
              {availableRoles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
            {touched.role && errors.role && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
            )}
            {availableRoles.length === 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading roles...</p>
            )}
          </div>
          {!editingItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className={`flex-1 px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors font-mono text-sm ${
                    touched.password && errors.password
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Auto-generated password"
                  readOnly
                />
                <button
                  type="button"
                  onClick={regeneratePassword}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Generate new password"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={copyPasswordToClipboard}
                  className={`p-2 rounded-lg transition-colors ${
                    passwordCopied
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                  }`}
                  title="Copy password"
                >
                  {passwordCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              {passwordCopied && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  Password copied to clipboard!
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
                setFormData({ name: '', email: '', role: '', password: '' })
                setErrors({ name: '', email: '', role: '', password: '' })
                setTouched({ name: false, email: false, role: false, password: false })
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </ProtectedPage>
  )
}

export default User
