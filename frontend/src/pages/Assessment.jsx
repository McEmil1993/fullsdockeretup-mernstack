import { useState, useMemo, useEffect, useRef } from 'react'
import Toast from '../components/Toast'
import SkeletonTable from '../components/SkeletonTable'
import Skeleton from '../components/Skeleton'
import Pagination from '../components/Pagination'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as assessmentService from '../services/assessments'
import * as scheduleService from '../services/schedules'
import * as studentService from '../services/students'

const Assessment = () => {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [termFilter, setTermFilter] = useState('Prelim')
  const [students, setStudents] = useState([])
  const [maxScores, setMaxScores] = useState({
    quizzes: Array(10).fill(''),
    activities: Array(10).fill(''),
    orals: Array(5).fill(''),
    projects: Array(5).fill(''),
    attendance: '',
    examScore: '',
  })
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Debounce timers
  const saveMaxScoresTimer = useRef(null)
  const saveStudentScoreTimers = useRef({})

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


  // Helper function to convert backend scores object to frontend arrays
  const backendScoresToFrontend = (backendScores) => {
    if (!backendScores) {
      return {
        quizzes: Array(10).fill(''),
        activities: Array(10).fill(''),
        orals: Array(5).fill(''),
        projects: Array(5).fill(''),
        attendance: '',
        examScore: '',
      }
    }

    const quizzes = []
    const activities = []
    const orals = []
    const projects = []

    // Convert quizzes
    for (let i = 1; i <= 10; i++) {
      quizzes.push(backendScores.quizzes?.[`quiz_${i}`] || '')
    }

    // Convert activities
    for (let i = 1; i <= 10; i++) {
      activities.push(backendScores.activities?.[`activity_${i}`] || '')
    }

    // Convert orals
    for (let i = 1; i <= 5; i++) {
      orals.push(backendScores.oral?.[`oral_${i}`] || '')
    }

    // Convert projects
    for (let i = 1; i <= 5; i++) {
      projects.push(backendScores.projects?.[`project_${i}`] || '')
    }

    return {
      quizzes,
      activities,
      orals,
      projects,
      attendance: backendScores.attendance || '',
      examScore: backendScores.exam_score || '',
    }
  }

  // Helper function to convert frontend arrays to backend scores object
  const frontendScoresToBackend = (frontendScores) => {
    const scores = {}

    // Convert quizzes
    if (frontendScores.quizzes) {
      scores.quizzes = {}
      frontendScores.quizzes.forEach((score, index) => {
        if (score !== '' && score !== null && score !== undefined) {
          scores.quizzes[`quiz_${index + 1}`] = parseFloat(score) || 0
        }
      })
    }

    // Convert activities
    if (frontendScores.activities) {
      scores.activities = {}
      frontendScores.activities.forEach((score, index) => {
        if (score !== '' && score !== null && score !== undefined) {
          scores.activities[`activity_${index + 1}`] = parseFloat(score) || 0
        }
      })
    }

    // Convert orals
    if (frontendScores.orals) {
      scores.oral = {}
      frontendScores.orals.forEach((score, index) => {
        if (score !== '' && score !== null && score !== undefined) {
          scores.oral[`oral_${index + 1}`] = parseFloat(score) || 0
        }
      })
    }

    // Convert projects
    if (frontendScores.projects) {
      scores.projects = {}
      frontendScores.projects.forEach((score, index) => {
        if (score !== '' && score !== null && score !== undefined) {
          scores.projects[`project_${index + 1}`] = parseFloat(score) || 0
        }
      })
    }

    // Convert attendance and exam_score
    if (frontendScores.attendance !== '' && frontendScores.attendance !== null && frontendScores.attendance !== undefined) {
      scores.attendance = parseFloat(frontendScores.attendance) || 0
    }
    if (frontendScores.examScore !== '' && frontendScores.examScore !== null && frontendScores.examScore !== undefined) {
      scores.exam_score = parseFloat(frontendScores.examScore) || 0
    }

    return scores
  }

  // Helper function to convert backend highest_scores to frontend format
  const backendHighestScoresToFrontend = (backendHighestScores) => {
    if (!backendHighestScores) {
      // Return empty values if no data from backend
      return {
        quizzes: Array(10).fill(''),
        activities: Array(10).fill(''),
        orals: Array(5).fill(''),
        projects: Array(5).fill(''),
        attendance: '',
        examScore: '',
      }
    }

    const quizzes = []
    const activities = []
    const orals = []
    const projects = []

    // Convert quizzes - use empty string if value doesn't exist (no defaults)
    for (let i = 1; i <= 10; i++) {
      const value = backendHighestScores.quizzes?.[`quiz_${i}`]
      quizzes.push(value !== undefined && value !== null ? String(value) : '')
    }

    // Convert activities - use empty string if value doesn't exist (no defaults)
    for (let i = 1; i <= 10; i++) {
      const value = backendHighestScores.activities?.[`activity_${i}`]
      activities.push(value !== undefined && value !== null ? String(value) : '')
    }

    // Convert orals - use empty string if value doesn't exist (no defaults)
    for (let i = 1; i <= 5; i++) {
      const value = backendHighestScores.oral?.[`oral_${i}`]
      orals.push(value !== undefined && value !== null ? String(value) : '')
    }

    // Convert projects - use empty string if value doesn't exist (no defaults)
    for (let i = 1; i <= 5; i++) {
      const value = backendHighestScores.projects?.[`project_${i}`]
      projects.push(value !== undefined && value !== null ? String(value) : '')
    }

    return {
      quizzes,
      activities,
      orals,
      projects,
      attendance: backendHighestScores.attendance !== undefined && backendHighestScores.attendance !== null ? String(backendHighestScores.attendance) : '',
      examScore: backendHighestScores.exam_score !== undefined && backendHighestScores.exam_score !== null ? String(backendHighestScores.exam_score) : '',
    }
  }

  // Helper function to convert frontend maxScores to backend highest_scores format
  const frontendMaxScoresToBackend = (frontendMaxScores) => {
    const highest_scores = {
      quizzes: {},
      activities: {},
      oral: {},
      projects: {},
    }

    // Convert quizzes
    frontendMaxScores.quizzes.forEach((score, index) => {
      highest_scores.quizzes[`quiz_${index + 1}`] = parseFloat(score) || 0
    })

    // Convert activities
    frontendMaxScores.activities.forEach((score, index) => {
      highest_scores.activities[`activity_${index + 1}`] = parseFloat(score) || 0
    })

    // Convert orals
    frontendMaxScores.orals.forEach((score, index) => {
      highest_scores.oral[`oral_${index + 1}`] = parseFloat(score) || 0
    })

    // Convert projects
    frontendMaxScores.projects.forEach((score, index) => {
      highest_scores.projects[`project_${index + 1}`] = parseFloat(score) || 0
    })

    // Convert attendance and exam_score
    highest_scores.attendance = parseFloat(frontendMaxScores.attendance) || 0
    highest_scores.exam_score = parseFloat(frontendMaxScores.examScore) || 0

    return highest_scores
  }

  // Load schedules from API (only for dropdown - Assessment page uses Assessment APIs for data)
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



  // Load highest scores from API - ONLY from backend, no defaults
  const loadHighestScores = async () => {
    if (!selectedScheduleId || !schoolYear) {
      // Reset to empty if no schedule/year selected
      setMaxScores({
        quizzes: Array(10).fill(''),
        activities: Array(10).fill(''),
        orals: Array(5).fill(''),
        projects: Array(5).fill(''),
        attendance: '',
        examScore: '',
      })
      return
    }

    try {
      const response = await assessmentService.getHighestScores({
        scheduleId: selectedScheduleId,
        school_year: schoolYear,
        term: termToBackend(termFilter),
      })

      if (response.success && response.data?.highest_scores) {
        // Load from backend
        const frontendMaxScores = backendHighestScoresToFrontend(response.data.highest_scores)
        setMaxScores(frontendMaxScores)
      } else {
        // If no highest scores exist, show empty inputs (no defaults)
        setMaxScores({
          quizzes: Array(10).fill(''),
          activities: Array(10).fill(''),
          orals: Array(5).fill(''),
          projects: Array(5).fill(''),
          attendance: '',
          examScore: '',
        })
      }
    } catch (error) {
      // On error, show empty inputs (no defaults)
      setMaxScores({
        quizzes: Array(10).fill(''),
        activities: Array(10).fill(''),
        orals: Array(5).fill(''),
        projects: Array(5).fill(''),
        attendance: '',
        examScore: '',
      })
    }
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

  // Load assessments from API - If no assessments, create them from schedule students
  const loadAssessments = async () => {
    if (!selectedScheduleId || !schoolYear) {
      setStudents([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await assessmentService.getAllAssessments({
        scheduleId: selectedScheduleId,
        school_year: schoolYear,
        term: termToBackend(termFilter),
        page: 1,
        limit: 100,
      })

      if (response.success && response.data) {
        // Check if data is an array and has items
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Fetch student details to get gender and course information
          const studentDetailsMap = new Map()
          
          // Fetch all student details in parallel
          const studentDetailPromises = response.data.map(async (assessment) => {
            const studentId = assessment.student_id || assessment.student_info?.student_id
            if (studentId && !studentDetailsMap.has(studentId)) {
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

          // Map assessments to students - ONLY from Assessment API response
          const mappedStudents = response.data.map((assessment, index) => {
            const studentInfo = assessment.student_info || {}
            const studentId = assessment.student_id || studentInfo.student_id || ''
            const studentDetails = studentDetailsMap.get(studentId) || {}
            const scores = backendScoresToFrontend(assessment.scores || {})

            return {
              id: index + 1,
              studentId: studentId,
              lastName: studentInfo.last_name || studentDetails.last_name || '',
              firstName: studentInfo.first_name || studentDetails.first_name || '',
              middleInitial: studentInfo.middle_initial || studentDetails.middle_initial || '',
              course: studentDetails.course_year || '',
              gender: studentInfo.gender || studentDetails.gender || '',
              scores,
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
        } else {
          // No assessments found - get students from schedule and create assessment records
          await createAssessmentsFromScheduleStudents()
        }
      } else {
        // API call didn't succeed or no data - try to create from schedule
        await createAssessmentsFromScheduleStudents()
      }
    } catch (error) {
      // On error, try to create from schedule
      await createAssessmentsFromScheduleStudents()
    } finally {
      setLoading(false)
    }
  }

  // Create assessment records for all students in the schedule
  const createAssessmentsFromScheduleStudents = async () => {
    try {
      // Get schedule details to get students list
      const scheduleResponse = await scheduleService.getScheduleById(selectedScheduleId)
      
      if (scheduleResponse.success && scheduleResponse.schedule?.students && Array.isArray(scheduleResponse.schedule.students) && scheduleResponse.schedule.students.length > 0) {
        const studentIds = scheduleResponse.schedule.students
        
        // Create empty assessment records for each student
        const emptyScores = {
          quizzes: {},
          activities: {},
          oral: {},
          projects: {},
          attendance: 0,
          exam_score: 0,
        }

        // Create assessments for all students
        for (const studentId of studentIds) {
          try {
            await assessmentService.createOrUpdateAssessment({
              scheduleId: selectedScheduleId,
              student_id: studentId,
              school_year: schoolYear,
              term: termToBackend(termFilter),
              scores: emptyScores,
            })
          } catch (error) {
            // Skip if assessment already exists or other error
          }
        }

        // Reload assessments after creating them
        const response = await assessmentService.getAllAssessments({
          scheduleId: selectedScheduleId,
          school_year: schoolYear,
          term: termToBackend(termFilter),
          page: 1,
          limit: 100,
        })

        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Fetch student details to get gender and course information
          const { default: studentService } = await import('../services/students')
          const studentDetailsMap = new Map()
          
          // Fetch all student details in parallel
          const studentDetailPromises = response.data.map(async (assessment) => {
            const studentId = assessment.student_id || assessment.student_info?.student_id
            if (studentId && !studentDetailsMap.has(studentId)) {
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

          const mappedStudents = response.data.map((assessment, index) => {
            const studentInfo = assessment.student_info || {}
            const studentId = assessment.student_id || studentInfo.student_id || ''
            const studentDetails = studentDetailsMap.get(studentId) || {}
            const scores = backendScoresToFrontend(assessment.scores || {})

            return {
              id: index + 1,
              studentId: studentId,
              lastName: studentInfo.last_name || studentDetails.last_name || '',
              firstName: studentInfo.first_name || studentDetails.first_name || '',
              middleInitial: studentInfo.middle_initial || studentDetails.middle_initial || '',
              course: studentDetails.course_year || '',
              gender: studentInfo.gender || studentDetails.gender || '',
              scores,
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
          showToast(`Created assessment records for ${finalStudents.length} student(s)`, 'success')
        } else {
          setStudents([])
        }
      } else {
        // No students in schedule
        setStudents([])
      }
    } catch (error) {
      setStudents([])
    }
  }


  // Save highest scores to API (with debouncing)
  const saveHighestScores = async (newMaxScores) => {
    if (!selectedScheduleId || !schoolYear) return

    try {
      const highest_scores = frontendMaxScoresToBackend(newMaxScores)
      await assessmentService.createOrUpdateHighestScores({
        scheduleId: selectedScheduleId,
        school_year: schoolYear,
        term: termToBackend(termFilter),
        highest_scores,
      })
    } catch (error) {
      showToast('Failed to save highest scores. Please try again.', 'error')
    }
  }

  // Save student score to API (with debouncing)
  const saveStudentScore = async (studentId, scores) => {
    if (!selectedScheduleId || !schoolYear || !studentId) return

    try {
      const backendScores = frontendScoresToBackend(scores)
      await assessmentService.createOrUpdateAssessment({
        scheduleId: selectedScheduleId,
        student_id: studentId,
        school_year: schoolYear,
        term: termToBackend(termFilter),
        scores: backendScores,
      })
    } catch (error) {
      showToast(`Failed to save score for ${studentId}. Please try again.`, 'error')
    }
  }

  // Load schedules on mount (only for dropdown selection)
  useEffect(() => {
    loadSchedules()
  }, [])

  // Load assessments and highest scores when schedule, term, or school year changes
  // Using ONLY Assessment APIs, not Schedule APIs
  useEffect(() => {
    if (selectedScheduleId && schoolYear) {
      loadAssessments()
      loadHighestScores()
    } else {
      setStudents([])
    }
  }, [selectedScheduleId, termFilter, schoolYear])

  // Assessment type options
  const assessmentTypes = useMemo(() => {
    const types = []
    // Quiz 1-10
    for (let i = 1; i <= 10; i++) {
      types.push({ id: `quiz-${i}`, label: `Quiz ${i}`, category: 'quizzes', index: i - 1 })
    }
    // Activity 1-10
    for (let i = 1; i <= 10; i++) {
      types.push({ id: `activity-${i}`, label: `Activity ${i}`, category: 'activities', index: i - 1 })
    }
    // Oral 1-5
    for (let i = 1; i <= 5; i++) {
      types.push({ id: `oral-${i}`, label: `Oral ${i}`, category: 'orals', index: i - 1 })
    }
    // Project 1-5
    for (let i = 1; i <= 5; i++) {
      types.push({ id: `project-${i}`, label: `Project ${i}`, category: 'projects', index: i - 1 })
    }
    // Attendance
    types.push({ id: 'attendance', label: 'Attendance', category: 'attendance', index: 0 })
    // Exam Score
    types.push({ id: 'exam', label: 'Exam Score', category: 'exam', index: 0 })
    return types
  }, [])

  // Selected assessment types - default: all selected
  const [selectedAssessments, setSelectedAssessments] = useState(() => 
    assessmentTypes.map(type => type.id)
  )

  const toggleAssessment = (id) => {
    setSelectedAssessments(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Check if all assessments are selected
  const allSelected = useMemo(() => {
    return assessmentTypes.length > 0 && assessmentTypes.every(type => selectedAssessments.includes(type.id))
  }, [selectedAssessments, assessmentTypes])

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedAssessments(assessmentTypes.map(type => type.id))
    } else {
      setSelectedAssessments([])
    }
    setCurrentPage(1)
  }

  // Switch Component
  const Switch = ({ checked, onChange }) => {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked
            ? 'bg-green-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{checked ? 'All Selected' : 'All Unselected'}</span>
      </button>
    )
  }

  const handleMaxScoreChange = (category, index, value) => {
    // Allow empty string and numbers with decimal point
    const numericValue = value === '' ? '' : value.replace(/[^0-9.]/g, '')
    setMaxScores(prev => {
      let newMaxScores
      if (category === 'attendance' || category === 'examScore') {
        newMaxScores = { ...prev, [category]: numericValue }
      } else {
        const newArray = [...prev[category]]
        newArray[index] = numericValue
        newMaxScores = { ...prev, [category]: newArray }
      }

      // Clear previous timer
      if (saveMaxScoresTimer.current) {
        clearTimeout(saveMaxScoresTimer.current)
      }

      // Debounce save to API - save after 500ms of no changes
      saveMaxScoresTimer.current = setTimeout(() => {
        saveHighestScores(newMaxScores)
      }, 500)

      return newMaxScores
    })
  }

  // Save immediately on blur (when user leaves the field)
  const handleMaxScoreBlur = () => {
    if (saveMaxScoresTimer.current) {
      clearTimeout(saveMaxScoresTimer.current)
      saveMaxScoresTimer.current = null
    }
    // Save current maxScores immediately
    saveHighestScores(maxScores)
  }

  const terms = ['Prelim', 'Midterm', 'Semi-final', 'Final']

  // Calculate PRELIM SCORE
  const calculatePrelimScore = (student) => {
    const quizTotal = student.scores.quizzes.reduce((sum, score, idx) => {
      const num = parseFloat(score) || 0
      const max = parseFloat(maxScores.quizzes[idx]) || 0
      return sum + (max > 0 ? (num / max) * 10 : 0)
    }, 0)

    const activityTotal = student.scores.activities.reduce((sum, score, idx) => {
      const num = parseFloat(score) || 0
      const max = parseFloat(maxScores.activities[idx]) || 0
      return sum + (max > 0 ? (num / max) * 10 : 0)
    }, 0)

    const oralTotal = student.scores.orals.reduce((sum, score, idx) => {
      const num = parseFloat(score) || 0
      const max = parseFloat(maxScores.orals[idx]) || 0
      return sum + (max > 0 ? (num / max) * 10 : 0)
    }, 0)

    const projectTotal = student.scores.projects.reduce((sum, score, idx) => {
      const num = parseFloat(score) || 0
      const max = parseFloat(maxScores.projects[idx]) || 0
      return sum + (max > 0 ? (num / max) * 10 : 0)
    }, 0)

    const attendanceScore = parseFloat(student.scores.attendance) || 0
    const attendanceMax = parseFloat(maxScores.attendance) || 4
    const attendanceTotal = attendanceMax > 0 ? (attendanceScore / attendanceMax) * 10 : 0

    // Total out of max exam score
    const examMax = parseFloat(maxScores.examScore) || 50
    const total = ((quizTotal + activityTotal + oralTotal + projectTotal + attendanceTotal) / 5) * (examMax / 10)
    return Math.round(total * 100) / 100
  }

  const handleScoreChange = (studentId, category, index, value) => {
    // Validate input - only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    
    setStudents(students.map(student => {
      if (student.studentId === studentId) {
        const newScores = { ...student.scores }
        if (category === 'attendance' || category === 'examScore') {
          newScores[category] = numericValue
        } else {
          newScores[category] = [...newScores[category]]
          newScores[category][index] = numericValue
        }

        // Debounce save to API
        const timerKey = `${studentId}-${category}-${index}`
        if (saveStudentScoreTimers.current[timerKey]) {
          clearTimeout(saveStudentScoreTimers.current[timerKey])
        }
        saveStudentScoreTimers.current[timerKey] = setTimeout(() => {
          saveStudentScore(studentId, newScores)
          delete saveStudentScoreTimers.current[timerKey]
        }, 1000) // Save after 1 second of no changes

        return { ...student, scores: newScores }
      }
      return student
    }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Export to Excel function
  const handleExportToExcel = () => {
    if (!selectedScheduleId || students.length === 0) {
      showToast('Please select a schedule and ensure there are students to export.', 'error')
      return
    }

    try {
      // Get selected schedule for course information
      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId)
      
      // Prepare headers
      const headers = [
        'Last Name',
        'First Name',
        'MI',
        'Course & Year',
        ...Array.from({ length: 10 }, (_, i) => `Quiz ${i + 1}`),
        ...Array.from({ length: 10 }, (_, i) => `Act ${i + 1}`),
        ...Array.from({ length: 5 }, (_, i) => `Oral ${i + 1}`),
        ...Array.from({ length: 5 }, (_, i) => `Proj ${i + 1}`),
        'Attendance',
        `${termFilter} Score`
      ]

      // Prepare highest scores row
      const highestScoreRow = [
        '**Highest Score**',
        '',
        '',
        '',
        ...maxScores.quizzes.map(score => score || ''),
        ...maxScores.activities.map(score => score || ''),
        ...maxScores.orals.map(score => score || ''),
        ...maxScores.projects.map(score => score || ''),
        maxScores.attendance || '',
        maxScores.examScore || ''
      ]

      // Prepare student rows
      const studentRows = students.map(student => {
        // const prelimScore = calculatePrelimScore(student)
        
        return [
          student.lastName || '',
          student.firstName || '',
          student.middleInitial || '',
          student.course || '',
          ...student.scores.quizzes.map(score => score || ''),
          ...student.scores.activities.map(score => score || ''),
          ...student.scores.orals.map(score => score || ''),
          ...student.scores.projects.map(score => score || ''),
          student.scores.attendance || '',
          student.scores.examScore || '',
        ]
      })

      // Combine all rows
      const worksheetData = [
        headers,
        highestScoreRow,
        ...studentRows
      ]

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set column widths for better readability
      const columnWidths = [
        { wch: 15 }, // Last Name
        { wch: 15 }, // First Name
        { wch: 5 },  // MI
        { wch: 15 }, // Course & Year
        ...Array.from({ length: 10 }, () => ({ wch: 8 })), // Quiz 1-10
        ...Array.from({ length: 10 }, () => ({ wch: 8 })), // Act 1-10
        ...Array.from({ length: 5 }, () => ({ wch: 8 })),  // Oral 1-5
        ...Array.from({ length: 5 }, () => ({ wch: 8 })),  // Proj 1-5
        { wch: 12 }, // Attendance
        { wch: 15 }  // Score
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment')

      // Generate filename with schedule and term info
      const scheduleInfo = selectedSchedule ? selectedSchedule.subject || 'Assessment' : 'Assessment'
      const filename = `${scheduleInfo}_${termFilter}_${schoolYear}.xlsx`

      // Write file
      XLSX.writeFile(workbook, filename)
      
      showToast('Assessment data exported successfully!', 'success')
    } catch (error) {
      showToast('Failed to export to Excel. Please try again.', 'error')
    }
  }

  // Filtered students based on pagination
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return students.slice(startIndex, endIndex)
  }, [students, currentPage, pageSize])

  const totalPages = Math.ceil(students.length / pageSize)

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
        <SkeletonTable rows={10} columns={20} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Assessment
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Manage student assessment scores and grades
        </p>
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
            <button
              onClick={handleExportToExcel}
              disabled={!selectedScheduleId || students.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Assessment Type Tag Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Assessment Types:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {allSelected ? 'All Selected' : 'All Unselected'}
              </span>
              <Switch
                checked={allSelected}
                onChange={handleToggleAll}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessmentTypes.map((type) => {
              const isSelected = selectedAssessments.includes(type.id)
              return (
                <button
                  key={type.id}
                  onClick={() => toggleAssessment(type.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-green-500 dark:bg-green-600 text-white border border-green-600 dark:border-green-700 hover:bg-green-600 dark:hover:bg-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Highest Scores Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Highest Scores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                {assessmentTypes
                  .filter(type => selectedAssessments.includes(type.id))
                  .map((type) => (
                    <th 
                      key={type.id}
                      className={`px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 ${
                        type.id === 'exam' ? '' : ''
                      }`}
                    >
                      {type.label === 'Quiz 1' ? 'Q1' : 
                       type.label === 'Quiz 2' ? 'Q2' :
                       type.label === 'Quiz 3' ? 'Q3' :
                       type.label === 'Quiz 4' ? 'Q4' :
                       type.label === 'Quiz 5' ? 'Q5' :
                       type.label === 'Quiz 6' ? 'Q6' :
                       type.label === 'Quiz 7' ? 'Q7' :
                       type.label === 'Quiz 8' ? 'Q8' :
                       type.label === 'Quiz 9' ? 'Q9' :
                       type.label === 'Quiz 10' ? 'Q10' :
                       type.label === 'Activity 1' ? 'A1' :
                       type.label === 'Activity 2' ? 'A2' :
                       type.label === 'Activity 3' ? 'A3' :
                       type.label === 'Activity 4' ? 'A4' :
                       type.label === 'Activity 5' ? 'A5' :
                       type.label === 'Activity 6' ? 'A6' :
                       type.label === 'Activity 7' ? 'A7' :
                       type.label === 'Activity 8' ? 'A8' :
                       type.label === 'Activity 9' ? 'A9' :
                       type.label === 'Activity 10' ? 'A10' :
                       type.label === 'Oral 1' ? 'O1' :
                       type.label === 'Oral 2' ? 'O2' :
                       type.label === 'Oral 3' ? 'O3' :
                       type.label === 'Oral 4' ? 'O4' :
                       type.label === 'Oral 5' ? 'O5' :
                       type.label === 'Project 1' ? 'P1' :
                       type.label === 'Project 2' ? 'P2' :
                       type.label === 'Project 3' ? 'P3' :
                       type.label === 'Project 4' ? 'P4' :
                       type.label === 'Project 5' ? 'P5' :
                       type.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-gray-800">
                {assessmentTypes
                  .filter(type => selectedAssessments.includes(type.id))
                  .map((type) => {
                    if (type.category === 'quizzes') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={String(maxScores.quizzes[type.index] ?? '')}
                            onChange={(e) => handleMaxScoreChange('quizzes', type.index, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      )
                    } else if (type.category === 'activities') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={maxScores.activities[type.index]}
                            onChange={(e) => handleMaxScoreChange('activities', type.index, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      )
                    } else if (type.category === 'orals') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={maxScores.orals[type.index]}
                            onChange={(e) => handleMaxScoreChange('orals', type.index, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      )
                    } else if (type.category === 'projects') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={maxScores.projects[type.index]}
                            onChange={(e) => handleMaxScoreChange('projects', type.index, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      )
                    } else if (type.category === 'attendance') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={maxScores.attendance}
                            onChange={(e) => handleMaxScoreChange('attendance', 0, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      )
                    } else if (type.category === 'exam') {
                      return (
                        <td key={`max-${type.id}`} className="px-1 py-2 border-b border-gray-200 dark:border-gray-600">
                          <input
                            type="text"
                            value={maxScores.examScore}
                            onChange={(e) => handleMaxScoreChange('examScore', 0, e.target.value)}
                            onBlur={handleMaxScoreBlur}
                            className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50"
                          />
                        </td>
                      )
                    }
                    return null
                  })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Assessment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-2 py-3 border-r border-blue-500 text-left font-bold sticky left-0 z-20 bg-blue-600 shadow-lg" style={{ width: '1%', minWidth: '250px' }}>
                  STUDENT_ID | Fullname
                </th>
                {assessmentTypes
                  .filter(type => selectedAssessments.includes(type.id))
                  .map((type) => (
                    <th 
                      key={type.id}
                      className={`px-2 py-3 border-r border-blue-500 text-center font-semibold bg-blue-500 ${
                        type.id === 'exam' ? '' : ''
                      }`}
                    >
                      {type.label === 'Quiz 1' ? 'Q1' : 
                       type.label === 'Quiz 2' ? 'Q2' :
                       type.label === 'Quiz 3' ? 'Q3' :
                       type.label === 'Quiz 4' ? 'Q4' :
                       type.label === 'Quiz 5' ? 'Q5' :
                       type.label === 'Quiz 6' ? 'Q6' :
                       type.label === 'Quiz 7' ? 'Q7' :
                       type.label === 'Quiz 8' ? 'Q8' :
                       type.label === 'Quiz 9' ? 'Q9' :
                       type.label === 'Quiz 10' ? 'Q10' :
                       type.label === 'Activity 1' ? 'A1' :
                       type.label === 'Activity 2' ? 'A2' :
                       type.label === 'Activity 3' ? 'A3' :
                       type.label === 'Activity 4' ? 'A4' :
                       type.label === 'Activity 5' ? 'A5' :
                       type.label === 'Activity 6' ? 'A6' :
                       type.label === 'Activity 7' ? 'A7' :
                       type.label === 'Activity 8' ? 'A8' :
                       type.label === 'Activity 9' ? 'A9' :
                       type.label === 'Activity 10' ? 'A10' :
                       type.label === 'Oral 1' ? 'O1' :
                       type.label === 'Oral 2' ? 'O2' :
                       type.label === 'Oral 3' ? 'O3' :
                       type.label === 'Oral 4' ? 'O4' :
                       type.label === 'Oral 5' ? 'O5' :
                       type.label === 'Project 1' ? 'P1' :
                       type.label === 'Project 2' ? 'P2' :
                       type.label === 'Project 3' ? 'P3' :
                       type.label === 'Project 4' ? 'P4' :
                       type.label === 'Project 5' ? 'P5' :
                       type.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student, idx) => (
                <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'} hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors`}>
                  <td className="px-2 py-3 border-r border-b border-gray-200 dark:border-gray-600 sticky left-0 z-10 bg-inherit text-gray-900 dark:text-white text-xs" style={{ width: '1%', minWidth: '250px' }}>
                    {student.studentId} | <strong>{student.lastName}</strong>, {student.firstName}
                  </td>
                  
                  {assessmentTypes
                    .filter(type => selectedAssessments.includes(type.id))
                    .map((type) => {
                      if (type.category === 'quizzes') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.quizzes[type.index]}
                              onChange={(e) => handleScoreChange(student.studentId, 'quizzes', type.index, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                        )
                      } else if (type.category === 'activities') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.activities[type.index]}
                              onChange={(e) => handleScoreChange(student.studentId, 'activities', type.index, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                        )
                      } else if (type.category === 'orals') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.orals[type.index]}
                              onChange={(e) => handleScoreChange(student.studentId, 'orals', type.index, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                        )
                      } else if (type.category === 'projects') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-1 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.projects[type.index]}
                              onChange={(e) => handleScoreChange(student.studentId, 'projects', type.index, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                        )
                      } else if (type.category === 'attendance') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-2 py-2 border-r border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.attendance}
                              onChange={(e) => handleScoreChange(student.studentId, 'attendance', 0, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                        )
                      } else if (type.category === 'exam') {
                        return (
                          <td key={`${student.id}-${type.id}`} className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                            <input
                              type="text"
                              value={student.scores.examScore || ''}
                              onChange={(e) => handleScoreChange(student.studentId, 'examScore', 0, e.target.value)}
                              className="w-full min-w-[45px] px-2 py-1.5 text-center text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 dark:bg-yellow-900/30"
                              placeholder="0"
                            />
                          </td>
                        )
                      }
                      return null
                    })}
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && !loading && selectedScheduleId && schoolYear && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No assessments found for the selected schedule, term, and school year.</p>
              <p className="text-sm mt-2">Start entering scores in the table above to create assessments.</p>
            </div>
          )}
          {!selectedScheduleId && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Please select a schedule to view assessments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={students.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        showPageSize={true}
        showSearch={false}
      />

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

export default Assessment
