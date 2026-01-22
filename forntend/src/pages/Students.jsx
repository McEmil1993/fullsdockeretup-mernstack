import { useState, useMemo, useEffect } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'
import Skeleton from '../components/Skeleton'
import { Plus, Edit2 } from 'lucide-react'
import * as studentService from '../services/students'

const Students = () => {
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load students from API
  const loadStudents = async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const response = await studentService.getAllStudents({ page, limit })
      // Map backend data (snake_case) to frontend format (camelCase)
      const mappedStudents = (response.students || []).map((student) => {
        const fullName = `${student.first_name || ''} ${student.middle_initial ? student.middle_initial + '.' : ''} ${student.last_name || ''}`.trim()
        return {
          id: student._id || student.id,
          _id: student._id,
          studentId: student.student_id,
          images: 'IMAGE',
          lastName: student.last_name,
          firstName: student.first_name,
          middleInitial: student.middle_initial || '',
          fullName,
          course: student.course_year || '', // Map course_year from API
          gender: student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : student.gender,
          status: student.status || 'active',
        }
      })
      setAllData(mappedStudents)
      setTotalCount(response.total_count || response.total || 0)
    } catch (error) {
      console.error('Failed to load students:', error)
      showToast('Failed to load students. Please try again.', 'error')
      setAllData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents(currentPage, pageSize)
  }, [currentPage, pageSize])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ 
    studentId: '', 
    lastName: '', 
    firstName: '', 
    middleInitial: '', 
    courseYear: '', 
    gender: '' 
  })
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form validation errors
  const [errors, setErrors] = useState({ 
    studentId: '', 
    lastName: '', 
    firstName: '', 
    courseYear: '', 
    gender: '' 
  })
  const [touched, setTouched] = useState({ 
    studentId: false, 
    lastName: false, 
    firstName: false, 
    courseYear: false, 
    gender: false 
  })
  
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

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const columns = [
    { key: 'studentId', label: 'STUDENT_ID', width: '1%' },
    { 
      key: 'images', 
      label: 'IMAGES',
      width: '1%',
      render: (value, item) => {
        const initial = item.firstName ? item.firstName.charAt(0).toUpperCase() : '?'
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
        const colorIndex = item.firstName ? item.firstName.charCodeAt(0) % colors.length : 0
        const bgColor = colors[colorIndex]
        
        return (
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-semibold`}>
              {initial}
            </div>
          </div>
        )
      }
    },
    { key: 'lastName', label: 'LASTNAME' },
    { key: 'firstName', label: 'FIRSTNAME' },
    { 
      key: 'middleInitial', 
      label: 'MIDDLE INITIAL',
      render: (value) => value || '-'
    },
    { key: 'course', label: 'COURSE & YEAR' },
    { 
      key: 'gender', 
      label: 'GENDER',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Male' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
            : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
        }`}>
          {value}
        </span>
      )
    },
  ]

  // Validation functions
  const validateStudentId = (studentId) => {
    if (!studentId.trim()) {
      return 'Student ID is required'
    }
    return ''
  }

  const validateLastName = (lastName) => {
    if (!lastName.trim()) {
      return 'Last name is required'
    }
    return ''
  }

  const validateFirstName = (firstName) => {
    if (!firstName.trim()) {
      return 'First name is required'
    }
    return ''
  }

  const validateCourseYear = (courseYear) => {
    if (!courseYear.trim()) {
      return 'Course & Year is required'
    }
    return ''
  }

  const validateGender = (gender) => {
    if (!gender) {
      return 'Gender is required'
    }
    return ''
  }

  const validateField = (field, value) => {
    let error = ''
    switch (field) {
      case 'studentId':
        error = validateStudentId(value)
        break
      case 'lastName':
        error = validateLastName(value)
        break
      case 'firstName':
        error = validateFirstName(value)
        break
      case 'courseYear':
        error = validateCourseYear(value)
        break
      case 'gender':
        error = validateGender(value)
        break
      default:
        break
    }
    setErrors((prev) => ({ ...prev, [field]: error }))
    return error === ''
  }

  const validateForm = () => {
    const studentIdValid = validateField('studentId', formData.studentId)
    const lastNameValid = validateField('lastName', formData.lastName)
    const firstNameValid = validateField('firstName', formData.firstName)
    const courseYearValid = validateField('courseYear', formData.courseYear)
    const genderValid = validateField('gender', formData.gender)
    
    setTouched({ 
      studentId: true, 
      lastName: true, 
      firstName: true, 
      courseYear: true, 
      gender: true 
    })
    
    return studentIdValid && lastNameValid && firstNameValid && courseYearValid && genderValid
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
      studentId: item.studentId, 
      lastName: item.lastName, 
      firstName: item.firstName, 
      middleInitial: item.middleInitial || '', 
          courseYear: item.course || item.courseYear || '',
      gender: item.gender 
    })
    setErrors({ studentId: '', lastName: '', firstName: '', courseYear: '', gender: '' })
    setTouched({ studentId: false, lastName: false, firstName: false, courseYear: false, gender: false })
    setIsModalOpen(true)
    
    // Optionally fetch latest data in background (non-blocking)
    if (item._id) {
      studentService.getStudentById(item._id)
        .then((response) => {
          const student = response.student || response.data
          if (student) {
            const fullName = `${student.first_name || ''} ${student.middle_initial ? student.middle_initial + '.' : ''} ${student.last_name || ''}`.trim()
            setFormData((prev) => ({
              studentId: student.student_id || prev.studentId,
              lastName: student.last_name || prev.lastName,
              firstName: student.first_name || prev.firstName,
              middleInitial: student.middle_initial || prev.middleInitial,
              courseYear: student.course_year || prev.courseYear, // Map course_year from API
              gender: student.gender || prev.gender, // Keep in API format (MALE/FEMALE)
            }))
          }
        })
        .catch((error) => {
          console.warn('Failed to fetch latest student data:', error)
        })
    }
  }

  // Filter data (client-side search, but pagination is server-side)
  const filteredData = useMemo(() => {
    if (!searchQuery) return allData
    
    const query = searchQuery.toLowerCase()
    return allData.filter((item) =>
      item.studentId.toLowerCase().includes(query) ||
      item.fullName.toLowerCase().includes(query) ||
      item.lastName.toLowerCase().includes(query) ||
      item.firstName.toLowerCase().includes(query) ||
      (item.course && item.course.toLowerCase().includes(query)) || // course is displayed field
      item.gender.toLowerCase().includes(query)
    )
  }, [allData, searchQuery])

  // Use filtered data directly (pagination is handled by backend)
  const paginatedData = filteredData

  const totalPages = Math.ceil((searchQuery ? filteredData.length : totalCount) / pageSize)

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
        const response = await studentService.updateStudentStatus({
          studentId: item._id || item.id,
          status: newStatus.toLowerCase()
        })
        
        // Update local state
        setAllData(allData.map((d) => 
          (d._id || d.id) === (item._id || item.id)
            ? { ...d, status: newStatus }
            : d
        ))
        
        const statusText = newStatus === 'active' ? 'active' : newStatus === 'inactive' ? 'inactive' : newStatus
        showToast(`${item.fullName} has been set to ${statusText}`, 'success')
      } catch (error) {
        console.error('Failed to update student status:', error)
        showToast(error.message || 'Failed to update student status. Please try again.', 'error')
      }
    }
    setConfirmDialog({ isOpen: false, item: null, newStatus: null })
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    setLoading(true)
    try {
      if (editingItem) {
        // Update existing student
        // Convert frontend camelCase to backend snake_case
        const updateData = {
          studentId: editingItem._id || editingItem.id,
          student_id: formData.studentId,
          last_name: formData.lastName,
          first_name: formData.firstName,
          middle_initial: formData.middleInitial || undefined,
          course_year: formData.courseYear,
          gender: formData.gender, // API expects MALE/FEMALE/OTHER (already in uppercase from form)
        }
        
        const response = await studentService.updateStudent(updateData)
        const updatedStudent = response.student || response.data
        
        // Reload students to get updated list
        await loadStudents(currentPage, pageSize)
        showToast('Student updated successfully', 'success')
      } else {
        // console.log("formData" ,  formData);
        
        // Create new student
        const newStudentData = {
          student_id: formData.studentId,
          last_name: formData.lastName,
          first_name: formData.firstName,
          middle_initial: formData.middleInitial || undefined,
          course_year: formData.courseYear, 
          gender: formData.gender, // API expects MALE/FEMALE/OTHER (already in uppercase from form)
          status: 'active'
        }
        
        const response = await studentService.createStudent(newStudentData)
        
        // Reload students to get updated list
        await loadStudents(currentPage, pageSize)
        showToast('Student created successfully', 'success')
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ studentId: '', lastName: '', firstName: '', middleInitial: '', courseYear: '', gender: '' })
      setErrors({ studentId: '', lastName: '', firstName: '', course: '', gender: '' })
      setTouched({ studentId: false, lastName: false, firstName: false, course: false, gender: false })
    } catch (error) {
      console.error('Failed to save student:', error)
      showToast(error.message || 'An error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // loadStudents will be called via useEffect
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
    // loadStudents will be called via useEffect
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    // Search is client-side, no need to reload
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({ studentId: '', lastName: '', firstName: '', middleInitial: '', course: '', gender: '' })
    setErrors({ studentId: '', lastName: '', firstName: '', courseYear: '', gender: '' })
    setTouched({ studentId: false, lastName: false, firstName: false, courseYear: false, gender: false })
    setIsModalOpen(true)
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Students
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage student records and information
          </p>
        </div>
        <Button onClick={handleAddNew} variant="primary" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2 inline" />
          Add New
        </Button>
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
        searchPlaceholder="Search by student ID, name, course, or gender..."
      />

      <Table
        data={paginatedData}
        columns={columns}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
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
        message={`Sigurado ba na ${confirmDialog.newStatus === 'active' ? 'Active' : 'Inactive'} mo itong student na ${confirmDialog.item?.fullName}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          setFormData({ studentId: '', lastName: '', firstName: '', middleInitial: '', courseYear: '', gender: '' })
          setErrors({ studentId: '', lastName: '', firstName: '', course: '', gender: '' })
          setTouched({ studentId: false, lastName: false, firstName: false, course: false, gender: false })
        }}
        title={editingItem ? 'Edit Student' : 'Add New Student'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => handleFieldChange('studentId', e.target.value)}
              onBlur={() => handleFieldBlur('studentId')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.studentId && errors.studentId
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter student ID (e.g., 24-019536)"
            />
            {touched.studentId && errors.studentId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.studentId}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              onBlur={() => handleFieldBlur('lastName')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.lastName && errors.lastName
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter last name"
            />
            {touched.lastName && errors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              onBlur={() => handleFieldBlur('firstName')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.firstName && errors.firstName
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter first name"
            />
            {touched.firstName && errors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Middle Initial
            </label>
            <input
              type="text"
              value={formData.middleInitial}
              onChange={(e) => handleFieldChange('middleInitial', e.target.value.toUpperCase())}
              maxLength={1}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter middle initial"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course & Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.courseYear}
              onChange={(e) => handleFieldChange('courseYear', e.target.value)}
              onBlur={() => handleFieldBlur('courseYear')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.courseYear && errors.courseYear
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter course & year (e.g., BSIT - 2)"
            />
            {touched.courseYear && errors.courseYear && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.courseYear}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              onBlur={() => handleFieldBlur('gender')}
              className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                touched.gender && errors.gender
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {touched.gender && errors.gender && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
                setFormData({ studentId: '', lastName: '', firstName: '', middleInitial: '', courseYear: '', gender: '' })
                setErrors({ studentId: '', lastName: '', firstName: '', course: '', gender: '' })
                setTouched({ studentId: false, lastName: false, firstName: false, course: false, gender: false })
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
  )
}

export default Students
