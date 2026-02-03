import { useState, useEffect } from 'react'
import { Eye, EyeOff, RotateCcw, Copy, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Skeleton from '../components/Skeleton'
import * as userService from '../services/users'

const Profile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load user data immediately (no setTimeout)
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
    setLoading(false)
  }, [user])

  const validateField = (field, value) => {
    let error = ''
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required'
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters'
        }
        break
      case 'email':
        if (!value.trim()) {
          error = 'Email is required'
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address'
          }
        }
        break
      case 'currentPassword':
        if (formData.newPassword || formData.confirmPassword) {
          if (!value.trim()) {
            error = 'Current password is required'
          }
        }
        break
      case 'newPassword':
        if (value && value.length < 6) {
          error = 'Password must be at least 6 characters'
        }
        break
      case 'confirmPassword':
        if (formData.newPassword && value !== formData.newPassword) {
          error = 'Passwords do not match'
        }
        break
      default:
        break
    }
    
    setErrors((prev) => ({ ...prev, [field]: error }))
    return error === ''
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


  const validateProfileInfo = () => {
    const nameValid = validateField('name', formData.name)
    const emailValid = validateField('email', formData.email)
    
    setTouched((prev) => ({ ...prev, name: true, email: true }))
    
    return nameValid && emailValid
  }

  const validatePasswordChange = () => {
    // If any password field is filled, all must be filled and valid
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      const currentValid = validateField('currentPassword', formData.currentPassword)
      const newValid = validateField('newPassword', formData.newPassword)
      const confirmValid = validateField('confirmPassword', formData.confirmPassword)
      
      // Additional check: if new password is provided, current password is required
      if (formData.newPassword && !formData.currentPassword) {
        setErrors((prev) => ({ ...prev, currentPassword: 'Current password is required to change password' }))
        return false
      }
      
      setTouched((prev) => ({ ...prev, currentPassword: true, newPassword: true, confirmPassword: true }))
      return currentValid && newValid && confirmValid
    }
    return true
  }

  const handleSaveProfile = async () => {
    if (!validateProfileInfo()) {
      setToast({
        isOpen: true,
        message: 'Please fix the errors in the form',
        type: 'error',
      })
      return
    }

    if (!user || !user._id) {
      setToast({
        isOpen: true,
        message: 'User information not available',
        type: 'error',
      })
      return
    }

    setLoading(true)
    try {
      // Update user profile (name, email)
      const response = await userService.updateUser({
        userId: user._id || user.id,
        name: formData.name,
        email: formData.email,
      })

      if (response.success) {
        setToast({
          isOpen: true,
          message: 'Profile information updated successfully',
          type: 'success',
        })
      } else {
        setToast({
          isOpen: true,
          message: response.message || 'Failed to update profile',
          type: 'error',
        })
      }
    } catch (error) {
      setToast({
        isOpen: true,
        message: error.message || 'An error occurred. Please try again.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePassword = async () => {
    // Check if password fields are filled
    if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
      setToast({
        isOpen: true,
        message: 'Please fill in password fields to change password',
        type: 'error',
      })
      return
    }

    if (!validatePasswordChange()) {
      setToast({
        isOpen: true,
        message: 'Please fix the errors in the password fields',
        type: 'error',
      })
      return
    }

    if (!user || !user._id) {
      setToast({
        isOpen: true,
        message: 'User information not available',
        type: 'error',
      })
      return
    }

    setLoading(true)
    try {
      // Verify current password first
      try {
        const verifyResponse = await userService.verifyPassword({
          userId: user._id || user.id,
          currentPassword: formData.currentPassword
        })

        if (!verifyResponse.success) {
          setErrors((prev) => ({ ...prev, currentPassword: 'Wrong password' }))
          setTouched((prev) => ({ ...prev, currentPassword: true }))
          setToast({
            isOpen: true,
            message: 'Current password is incorrect',
            type: 'error',
          })
          setLoading(false)
          return
        }
      } catch (error) {
        // Handle 401 or other errors
        if (error.message && (error.message.includes('401') || error.message.includes('Wrong password'))) {
          setErrors((prev) => ({ ...prev, currentPassword: 'Wrong password' }))
          setTouched((prev) => ({ ...prev, currentPassword: true }))
          setToast({
            isOpen: true,
            message: 'Current password is incorrect',
            type: 'error',
          })
        } else {
          setToast({
            isOpen: true,
            message: error.message || 'Failed to verify password. Please try again.',
            type: 'error',
          })
        }
        setLoading(false)
        return
      }

      // Current password is correct, now change password
      const changeResponse = await userService.changePassword({
        userId: user._id || user.id,
        newPassword: formData.newPassword
      })

      if (changeResponse.success) {
        setToast({
          isOpen: true,
          message: 'Password changed successfully',
          type: 'success',
        })
        
        // Reset password fields after successful save
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTouched((prev) => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }))
        setErrors((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      } else {
        setToast({
          isOpen: true,
          message: changeResponse.message || 'Failed to change password',
          type: 'error',
        })
      }
    } catch (error) {
      setToast({
        isOpen: true,
        message: error.message || 'An error occurred. Please try again.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
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

  const handleResetPassword = () => {
    setShowResetConfirm(true)
  }

  const confirmResetPassword = async () => {
    if (!user || !user._id) {
      setToast({
        isOpen: true,
        message: 'User information not available',
        type: 'error',
      })
      setShowResetConfirm(false)
      return
    }

    try {
      // Generate new random password
      const newTempPassword = generateTempPassword()
      
      // Call API to change password
      const response = await userService.changePassword({
        userId: user._id || user.id,
        newPassword: newTempPassword
      })
      
      if (response.success) {
        // Show success message and display the new password
        setTempPassword(newTempPassword)
        setShowTempPassword(true)
        setShowResetConfirm(false)
        showToast('Password reset successfully', 'success')
      } else {
        setToast({
          isOpen: true,
          message: response.message || 'Failed to reset password',
          type: 'error',
        })
        setShowResetConfirm(false)
      }
    } catch (error) {
      setToast({
        isOpen: true,
        message: error.message || 'Failed to reset password. Please try again.',
        type: 'error',
      })
      setShowResetConfirm(false)
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

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-32 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <Skeleton variant="heading" className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-10 w-full" />
            <Skeleton variant="text" className="h-10 w-full" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <Skeleton variant="heading" className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-10 w-full" />
            <Skeleton variant="text" className="h-10 w-full" />
            <Skeleton variant="text" className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profile
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Manage your profile information and password
        </p>
      </div>

      {/* Card 1: Name and Email */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          <Button 
            variant="primary" 
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
        
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
              placeholder="Enter your name"
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
              placeholder="Enter your email"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Change Password
          </h2>
          <Button
            variant="secondary"
            onClick={handleResetPassword}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Password
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.currentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
                onBlur={() => handleFieldBlur('currentPassword')}
                className={`w-full px-4 py-2 pr-10 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                  touched.currentPassword && errors.currentPassword
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500 invalid'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, currentPassword: !showPasswords.currentPassword })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showPasswords.currentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.currentPassword && errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                onBlur={() => handleFieldBlur('newPassword')}
                className={`w-full px-4 py-2 pr-10 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                  touched.newPassword && errors.newPassword
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showPasswords.newPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.newPassword && errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                className={`w-full px-4 py-2 pr-10 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showPasswords.confirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            variant="primary" 
            onClick={handleSavePassword}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Reset Password Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetPassword}
        title="Reset Password"
        message={`Sigurado ba na gusto mong i-reset ang password ng user na ${user?.name || 'ito'}?`}
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
    </div>
  )
}

export default Profile
