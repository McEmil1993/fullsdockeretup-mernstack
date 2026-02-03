import { useState, useMemo, useEffect, useRef } from 'react'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'
import SkeletonTable from '../components/SkeletonTable'
import Skeleton from '../components/Skeleton'
import * as attendanceService from '../services/attendance'
import * as scheduleService from '../services/schedules'
import * as studentService from '../services/students'

const Attendance = () => {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [termFilter, setTermFilter] = useState('Prelim')
  const [students, setStudents] = useState([])
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Toast state
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })

  // Debounce timers for attendance updates
  const saveAttendanceTimers = useRef({})

  // Helper function to convert term from frontend to backend format
  const termToBackend = (term) => {
    const mapping = {
      'Prelim': 'prelim',
      'Midterm': 'midterm',
      'Semi-final': 'semi-final',
      'Final': 'final'
    }
    return mapping[term] || term.toLowerCase()
  }

  // Helper function to sort students: Male first, then alphabetically
  const sortStudents = (studentsList) => {
    return [...studentsList].sort((a, b) => {
      // Normalize gender values - handle various formats
      const normalizeGender = (gender) => {
        if (!gender) return 'UNKNOWN'
        const g = String(gender).trim().toUpperCase()
        if (g === 'MALE' || g === 'M') return 'MALE'
        if (g === 'FEMALE' || g === 'F') return 'FEMALE'
        return g
      }
      
      // First, sort by gender (MALE first, then FEMALE, then others)
      const genderOrder = { 'MALE': 0, 'FEMALE': 1, 'OTHER': 2, 'UNKNOWN': 3 }
      const aGender = normalizeGender(a.gender)
      const bGender = normalizeGender(b.gender)
      const aGenderOrder = genderOrder[aGender] !== undefined ? genderOrder[aGender] : 3
      const bGenderOrder = genderOrder[bGender] !== undefined ? genderOrder[bGender] : 3
      
      if (aGenderOrder !== bGenderOrder) {
        return aGenderOrder - bGenderOrder
      }
      
      // Then sort alphabetically by last name (case-insensitive)
      const aLastName = (a.lastName || '').trim().toUpperCase()
      const bLastName = (b.lastName || '').trim().toUpperCase()
      if (aLastName !== bLastName) {
        return aLastName.localeCompare(bLastName)
      }
      
      // Then by first name (case-insensitive)
      const aFirstName = (a.firstName || '').trim().toUpperCase()
      const bFirstName = (b.firstName || '').trim().toUpperCase()
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName)
      }
      
      // Finally by middle initial
      const aMI = (a.middleInitial || '').trim().toUpperCase()
      const bMI = (b.middleInitial || '').trim().toUpperCase()
      return aMI.localeCompare(bMI)
    })
  }

  // Load schedules from API (only for dropdown selection)
 const loadSchedules = async () => {
  // 🔹 Helper: convert "07:00 PM - 08:30 PM" → minutes
  const parseStartTimeToMinutes = (timeRange) => {
    if (!timeRange) return 0

    const startTime = timeRange.split('-')[0].trim() // "07:00 PM"
    const [time, meridiem] = startTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)

    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  try {
    const response = await scheduleService.getAllSchedules({
      page: 1,
      limit: 100,
    })

    // ✅ filter active + sort ASC by time
    const activeSchedules = (response.schedules || [])
      .filter(
        (schedule) =>
          (schedule.status || '').toLowerCase() === 'active'
      )
      .sort(
        (a, b) =>
          parseStartTimeToMinutes(a.time) -
          parseStartTimeToMinutes(b.time)
      )

    // ✅ map for UI
    const mappedSchedules = activeSchedules.map((schedule) => ({
      id: schedule._id,
      _id: schedule._id,
      subject: schedule.subject_code || '',
      description: schedule.description || '',
      days: schedule.days || '',
      time: schedule.time || '',
      room: schedule.room || '',
      block: schedule.block || '',
      academicYear: schedule.academic_year || '',
      displayText: `${schedule.block + ' - '|| ''} ${schedule.time || ''} ${"("+schedule.days+")" || ''}`,
    }))

    setSchedules(mappedSchedules)
  } catch (error) {
    showToast('Failed to load schedules. Please try again.', 'error')
  }
}


  // Load attendance records and students
  const loadAttendance = async () => {
    if (!selectedScheduleId || !schoolYear || !dateFilter) {
      setStudents([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Get schedule details to get students list
      const scheduleResponse = await scheduleService.getScheduleById(selectedScheduleId)
      
      if (!scheduleResponse.success || !scheduleResponse.schedule?.students || 
          !Array.isArray(scheduleResponse.schedule.students) || 
          scheduleResponse.schedule.students.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const studentIds = scheduleResponse.schedule.students

      // Fetch attendance records for the selected date
      const attendanceResponse = await attendanceService.getAttendance({
        scheduleId: selectedScheduleId,
        date: dateFilter,
        school_year: schoolYear,
        term: termToBackend(termFilter),
        page: 1,
        limit: 100,
      })

      // Create a map of attendance records by student_id
      const attendanceMap = new Map()
      if (attendanceResponse.success && attendanceResponse.data) {
        attendanceResponse.data.forEach((record) => {
          attendanceMap.set(record.student_id, record.attendance || 'absent')
        })
      }

      // Fetch all student details in parallel
      const studentDetailsMap = new Map()
      const studentDetailPromises = studentIds.map(async (studentId) => {
        if (!studentDetailsMap.has(studentId)) {
          try {
            const studentResponse = await studentService.getStudentByStudentId(studentId)
            if (studentResponse.success && studentResponse.student) {
              studentDetailsMap.set(studentId, studentResponse.student)
            }
          } catch (error) {
          }
        }
      })
      await Promise.all(studentDetailPromises)

      // Map students with attendance status
      const mappedStudents = studentIds.map((studentId, index) => {
        const studentDetails = studentDetailsMap.get(studentId) || {}
        const attendanceStatus = attendanceMap.get(studentId) || 'absent'

        return {
          id: index + 1,
          studentId: studentId,
          lastName: studentDetails.last_name || '',
          firstName: studentDetails.first_name || '',
          middleInitial: studentDetails.middle_initial || '',
          course: studentDetails.course_year || '',
          gender: studentDetails.gender || '',
          attendance: attendanceStatus,
        }
      })

      // Sort students: Male first, then alphabetically
      const sortedStudents = sortStudents(mappedStudents)
      
      // Update IDs after sorting
      const finalStudents = sortedStudents.map((student, index) => ({
        ...student,
        id: index + 1
      }))

      setStudents(finalStudents)
    } catch (error) {
      showToast('Failed to load attendance. Please try again.', 'error')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  // Save attendance to API (with debouncing)
  const saveAttendance = async (studentId, attendanceStatus) => {
    if (!selectedScheduleId || !schoolYear || !dateFilter || !studentId) return

    try {
      await attendanceService.createOrUpdateAttendance({
        scheduleId: selectedScheduleId,
        student_id: studentId,
        date: dateFilter,
        attendance: attendanceStatus,
        school_year: schoolYear,
        term: termToBackend(termFilter),
      })
    } catch (error) {
      showToast(`Failed to save attendance for ${studentId}. Please try again.`, 'error')
    }
  }

  // Handle attendance change
  const handleAttendanceChange = (item, isPresent) => {
    const newStatus = isPresent ? 'present' : 'absent'
    
    // Update local state immediately
    setStudents(students.map((student) =>
      student.id === item.id ? { ...student, attendance: newStatus } : student
    ))

    // Debounce save to API
    const timerKey = `${item.studentId}-${dateFilter}`
    if (saveAttendanceTimers.current[timerKey]) {
      clearTimeout(saveAttendanceTimers.current[timerKey])
    }
    
    saveAttendanceTimers.current[timerKey] = setTimeout(() => {
      saveAttendance(item.studentId, newStatus)
      delete saveAttendanceTimers.current[timerKey]
    }, 500) // Save after 500ms of no changes

    const statusText = isPresent ? 'Present' : 'Absent'
    showToast(`${item.firstName} ${item.lastName} marked as ${statusText}`, 'success')
  }

  // Load schedules on mount
  useEffect(() => {
    loadSchedules()
  }, [])

  // Load attendance when schedule, date, term, or school year changes
  useEffect(() => {
    if (selectedScheduleId && schoolYear && dateFilter) {
      loadAttendance()
    } else {
      setStudents([])
    }
  }, [selectedScheduleId, dateFilter, termFilter, schoolYear])

  const terms = ['Prelim', 'Midterm', 'Semi-final', 'Final']

  const columns = [
    
    { key: 'studentId', label: 'STUDENT_ID', width: '1%' },
    { 
      key: 'images', 
      label: 'IMAGES',
      width: '1%',
      render: (value, item) => {
        const initial = item.firstName ? item.firstName.charAt(0).toUpperCase() : '?'
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
     {
      key: 'attendance',
      label: 'Actions',
      render: (value, item) => {
        return (
          <Switch
            checked={value === 'present'}
            onChange={(checked) => handleAttendanceChange(item, checked)}
          />
        )
      }
    },
    { key: 'lastName', label: 'LASTNAME' },
    { key: 'firstName', label: 'FIRSTNAME' },
    { key: 'course', label: 'COURSE & YEAR' },
    {
      key: 'datetime',
      label: 'DATETIME',
      render: (value, item) => {
        if (!dateFilter) return '-'
        const date = new Date(dateFilter)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const dayName = days[date.getDay()]
        const monthName = months[date.getMonth()]
        const day = date.getDate()
        const year = date.getFullYear()
        return `${dayName}, ${monthName} ${day}, ${year}`
      }
    },
    { 
      key: 'gender', 
      label: 'GENDER',
      render: (value) => {
        const normalizedGender = value === 'MALE' || value === 'Male' || value === 'male' ? 'Male' : 'Female'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            normalizedGender === 'Male' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
              : 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
          }`}>
            {normalizedGender}
          </span>
        )
      }
    },
  ]

  // Switch Component
  const Switch = ({ checked, onChange }) => {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked
            ? 'bg-green-500'
            : 'bg-red-500'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{checked ? 'Present' : 'Absent'}</span>
      </button>
    )
  }

  // Filter and paginate data
  const filteredData = useMemo(() => {
    let filtered = students
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        item.studentId.toLowerCase().includes(query) ||
        item.lastName.toLowerCase().includes(query) ||
        item.firstName.toLowerCase().includes(query) ||
        (item.course && item.course.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [students, searchQuery])

  // Check if all filtered students are present
  const allPresent = useMemo(() => {
    return filteredData.length > 0 && filteredData.every(item => item.attendance === 'present')
  }, [filteredData])

  const handleToggleAll = (isPresent) => {
    // Mark all filtered students as present or absent
    filteredData.forEach((student) => {
      handleAttendanceChange(student, isPresent)
    })
  }

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton variant="title" className="h-8 w-32 mb-2" />
            <Skeleton variant="text" className="h-4 w-64" />
          </div>
        </div>

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

        <SkeletonTable rows={10} columns={7} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Attendance
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Track and manage student attendance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Master Switch for All Students */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {allPresent ? 'Present All' : 'Absent All'}
            </span>
            <Switch
              checked={allPresent}
              onChange={(checked) => handleToggleAll(checked)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filter: Schedule
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => {
                setSelectedScheduleId(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
            >
              <option value="">Select Schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.displayText}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              School Year
            </label>
            <input
              type="text"
              value={schoolYear}
              onChange={(e) => {
                setSchoolYear(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="e.g., 2025-2026"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filter: Terms
            </label>
            <select
              value={termFilter}
              onChange={(e) => {
                setTermFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Custom Pagination with Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Side - Page Size & Count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Show:
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                entries
              </span>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">
                {(currentPage - 1) * pageSize + 1}
              </span> to{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span> of{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {filteredData.length}
              </span> entries
            </div>
          </div>

          {/* Right Side - Search */}
          <div className="relative w-full sm:w-[300px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by student ID, name, course..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {students.length === 0 && !loading && selectedScheduleId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No students found for the selected schedule.
          </p>
        </div>
      ) : students.length === 0 && !loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Please select a schedule to view attendance.
          </p>
        </div>
      ) : (
        <Table
          data={paginatedData}
          columns={columns}
          showActions={false}
        />
      )}

      {/* Pagination - Bottom */}
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredData.length}
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
    </div>
  )
}

export default Attendance
