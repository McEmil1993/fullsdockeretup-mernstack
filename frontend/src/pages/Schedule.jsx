import { useState, useMemo, useEffect } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'
import Skeleton from '../components/Skeleton'
import { Upload, X, ChevronDown, Search, Check } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as scheduleService from '../services/schedules'
import * as studentService from '../services/students'

const Schedule = () => {
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [students, setStudents] = useState([])

  // Load schedules from API
  const loadSchedules = async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const response = await scheduleService.getAllSchedules({ page, limit })
      // Map backend data to frontend format
      const mappedSchedules = (response.schedules || []).map((schedule) => {
        return {
          id: schedule._id || schedule.id,
          _id: schedule._id,
          subject: schedule.subject_code || '',
          description: schedule.description || '',
          semester: schedule.semester || '',
          academicYear: schedule.academic_year || '',
          units: schedule.units || 0,
          days: schedule.days || '',
          time: schedule.time || '',
          room: schedule.room || '',
          block: schedule.block || '',
          selectedStudents: schedule.students || [],
          studentCount: schedule.student_count || schedule.students?.length || 0,
          status: schedule.status || 'active',
        }
      })
      setAllData(mappedSchedules)
      setTotalCount(response.total_count || response.total || 0)
    } catch (error) {
      showToast('Failed to load schedules. Please try again.', 'error')
      setAllData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Load students for selection dropdown
  const loadStudents = async () => {
    try {
      const response = await studentService.getAllStudents({ page: 1, limit: 100 }) // Get all students
      const mappedStudents = (response.students || []).map((student) => ({
        studentId: student.student_id,
        lastName: student.last_name || '',
        firstName: student.first_name || '',
        middleInitial: student.middle_initial || '',
      }))
      setStudents(mappedStudents)
    } catch (error) {
      setStudents([])
    }
  }

  useEffect(() => {
    loadSchedules(currentPage, pageSize)
    loadStudents()
  }, [currentPage, pageSize])


  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ 
    subject: '', 
    description: '', 
    semester: '', 
    academicYear: '',
    units: '', 
    days: '', 
    time: '', 
    room: '',
    block: '',
    selectedStudents: [] 
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)
  const [importProgress, setImportProgress] = useState({ show: false, percentage: 0, message: '' })
  
  // Form validation errors
  const [errors, setErrors] = useState({ 
    subject: '', 
    description: '', 
    semester: '', 
    units: '', 
    days: '', 
    time: '', 
    room: '',
    selectedStudents: '' 
  })
  const [touched, setTouched] = useState({ 
    subject: false, 
    description: false, 
    semester: false, 
    units: false, 
    days: false, 
    time: false, 
    room: false,
    selectedStudents: false 
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


  const columns = [
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Description' },
    { 
      key: 'semester', 
      label: 'Semester | Academic Year',
      render: (value, item) => {
        const sem = item.semester || ''
        const year = item.academicYear || ''
        return sem && year ? `${sem} | ${year}` : sem || year || '-'
      }
    },
    { key: 'units', label: 'Units' },
    { key: 'days', label: 'Days' },
    { key: 'time', label: 'Time' },
    { key: 'room', label: 'Room' },
    { key: 'block', label: 'Block' },
    { 
      key: 'studentCount', 
      label: 'Student Count',
      render: (value, item) => {
        return item.selectedStudents ? item.selectedStudents.length : 0
      }
    },
  ]

  // Validation functions
  const validateSubject = (subject) => {
    if (!subject.trim()) {
      return 'Subject is required'
    }
    return ''
  }

  const validateDescription = (description) => {
    if (!description.trim()) {
      return 'Description is required'
    }
    return ''
  }

  const validateSemester = (semester) => {
    if (!semester.trim()) {
      return 'Semester is required'
    }
    return ''
  }

  const validateAcademicYear = (academicYear) => {
    if (!academicYear.trim()) {
      return 'Academic Year is required'
    }
    return ''
  }

  const validateUnits = (units) => {
    if (!units) {
      return 'Units is required'
    }
    if (isNaN(units) || parseFloat(units) <= 0) {
      return 'Units must be a positive number'
    }
    return ''
  }

  const validateDays = (days) => {
    if (!days.trim()) {
      return 'Days is required'
    }
    return ''
  }

  const validateTime = (time) => {
    if (!time.trim()) {
      return 'Time is required'
    }
    return ''
  }

  const validateRoom = (room) => {
    if (!room.trim()) {
      return 'Room is required'
    }
    return ''
  }

  const validateSelectedStudents = (selectedStudents) => {
    if (!selectedStudents || selectedStudents.length === 0) {
      return 'At least one student must be selected'
    }
    return ''
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    let error = ''
    switch (field) {
      case 'subject':
        error = validateSubject(formData.subject)
        break
      case 'description':
        error = validateDescription(formData.description)
        break
      case 'semester':
        error = validateSemester(formData.semester)
        break
      case 'academicYear':
        error = validateAcademicYear(formData.academicYear)
        break
      case 'units':
        error = validateUnits(formData.units)
        break
      case 'days':
        error = validateDays(formData.days)
        break
      case 'time':
        error = validateTime(formData.time)
        break
      case 'room':
        error = validateRoom(formData.room)
        break
      case 'selectedStudents':
        error = validateSelectedStudents(formData.selectedStudents)
        break
      default:
        break
    }
    
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateForm = () => {
    const newErrors = {
      subject: validateSubject(formData.subject),
      description: validateDescription(formData.description),
      semester: validateSemester(formData.semester),
      academicYear: validateAcademicYear(formData.academicYear),
      units: validateUnits(formData.units),
      days: validateDays(formData.days),
      time: validateTime(formData.time),
      room: validateRoom(formData.room),
      selectedStudents: validateSelectedStudents(formData.selectedStudents),
    }
    
    setErrors(newErrors)
    setTouched({
      subject: true,
      description: true,
      semester: true,
      academicYear: true,
      units: true,
      days: true,
      time: true,
      room: true,
      selectedStudents: true,
    })
    
    return !Object.values(newErrors).some(error => error !== '')
  }

  // Save imported data to backend
  const saveImportedData = async (scheduleData, studentData, progressCallback) => {
    setSaving(true)
    try {
      // Step 1: Insert students (skip if already exist)
      let createdStudents = 0
      let skippedStudents = 0
      const totalStudents = studentData.length
      
      for (let i = 0; i < studentData.length; i++) {
        const student = studentData[i]
        
        // Update progress for students
        const studentProgress = 70 + Math.floor((i / totalStudents) * 20)
        if (progressCallback) {
          progressCallback({ 
            show: true, 
            percentage: studentProgress, 
            message: `Processing students (${i + 1}/${totalStudents})...` 
          })
        }
        try {
          // Check if student exists
          const existing = await studentService.getStudentByStudentId(student.student_id)
          if (existing.success && existing.student) {
            skippedStudents++
            continue
          }
        } catch (error) {
          // Student doesn't exist, continue to create
        }
        
        try {
          await studentService.createStudent({
            student_id: student.student_id,
            last_name: student.last_name,
            first_name: student.first_name,
            middle_initial: student.middle_initial || undefined,
            course_year: student.course_year || undefined,
            gender: student.gender,
            status: student.status || 'active'
          })
          createdStudents++
        } catch (error) {
          // Skip if duplicate or other error
        }
      }

      // Step 2: Create schedule (skip if duplicate)
      if (progressCallback) {
        progressCallback({ 
          show: true, 
          percentage: 90, 
          message: 'Creating schedule...' 
        })
      }
      
      try {
        // Format academic_year: remove double dashes if present, use single dash
        const formattedScheduleData = {
          ...scheduleData,
          academic_year: scheduleData.academic_year.replace(/--/g, '-')
        }
        
        await scheduleService.createSchedule(formattedScheduleData)
        
        if (progressCallback) {
          progressCallback({ 
            show: true, 
            percentage: 95, 
            message: 'Finalizing import...' 
          })
        }
        showToast(`Import successful! Created ${createdStudents} students, skipped ${skippedStudents} existing students, and created schedule.`, 'success')
        
        // Reload schedules
        await loadSchedules(currentPage, pageSize)
      } catch (error) {
        if (error.response?.data?.message?.includes('Schedule already exists')) {
          showToast(`Students processed (${createdStudents} created, ${skippedStudents} skipped). Schedule already exists with the same days, time, and room.`, 'warning')
        } else {
          throw error
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save imported data. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.xlsx'
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        // Check if file is .xlsx
        if (!file.name.endsWith('.xlsx')) {
          showToast('Please select a .xlsx file', 'error')
          return
        }

        // Initialize progress
        setImportProgress({ show: true, percentage: 0, message: 'Preparing to import...' })

        try {
          // Step 1: Read the file (10%)
          setImportProgress({ show: true, percentage: 10, message: 'Reading Excel file...' })
          const arrayBuffer = await file.arrayBuffer()
          
          setImportProgress({ show: true, percentage: 20, message: 'Parsing Excel data...' })
          const workbook = XLSX.read(arrayBuffer, { 
            type: 'array',
            cellDates: false,
            cellNF: false,
            cellText: false,
            sheetStubs: false
          })
          
          // Step 2: Parse Excel (30%)
          setImportProgress({ show: true, percentage: 30, message: 'Extracting data from sheets...' })
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          setImportProgress({ show: true, percentage: 40, message: 'Processing rows and columns...' })
          
          // Convert to array format - get ALL data including empty cells
          const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Array of arrays
            defval: null, // Keep null for empty cells so we can distinguish
            raw: false, // Convert all values to strings
            blankrows: true // Include blank rows
          })

          // Find the header row - try multiple strategies
          let headerRowIndex = -1
          
          // Strategy 1: Look for row starting with "No." or containing key header words
          for (let i = 0; i < Math.min(30, rawData.length); i++) {
            const row = rawData[i]
            if (Array.isArray(row) && row.length > 0) {
              const firstCell = String(row[0] || '').trim().toUpperCase()
              const rowString = row.slice(0, 10).join(' ').toUpperCase()
              
              if (firstCell === 'NO.' || firstCell === 'NO' ||
                  (rowString.includes('NO') && (rowString.includes('ID') || rowString.includes('NAME')))) {
                headerRowIndex = i
                break
              }
            }
          }

          // Strategy 2: Find row with many non-empty cells (likely header)
          if (headerRowIndex === -1) {
            for (let i = 0; i < Math.min(30, rawData.length); i++) {
              const row = rawData[i]
              if (Array.isArray(row) && row.length > 3) {
                const nonEmptyCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length
                if (nonEmptyCount >= 5) {
                  headerRowIndex = i
                  break
                }
              }
            }
          }

          // Strategy 3: Use first row with any data
          if (headerRowIndex === -1) {
            for (let i = 0; i < rawData.length; i++) {
              if (rawData[i] && Array.isArray(rawData[i]) && rawData[i].length > 0) {
                const hasData = rawData[i].some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
                if (hasData) {
                  headerRowIndex = i
                  break
                }
              }
            }
          }

          // Last resort: use row 0
          if (headerRowIndex === -1) {
            headerRowIndex = 0
          }

          // Extract course/subject information from header rows (before header row)
          const courseInfo = {}
          const headerRows = rawData.slice(0, headerRowIndex)
          
          // Look for course information in the header rows
          headerRows.forEach(row => {
            if (Array.isArray(row)) {
              const rowString = row.join(' ').toUpperCase()
              
              // Extract SUBJECT
              if (rowString.includes('SUBJECT') && rowString.includes(':')) {
                const match = rowString.match(/SUBJECT\s*:\s*([A-Z0-9\s]+)/i)
                if (match) {
                  const subjectParts = rowString.split('SUBJECT')[1].split(':')
                  if (subjectParts.length > 1) {
                    courseInfo.subject = subjectParts[1].trim().split(/\s+/)[0] || ''
                  }
                }
              }
              
              // Extract DESCRIPTION
              if (rowString.includes('DESCRIPTION') && rowString.includes(':')) {
                const descParts = rowString.split('DESCRIPTION')[1].split(':')
                if (descParts.length > 1) {
                  courseInfo.description = descParts[1].trim().split(/\s+DAYS/i)[0].trim() || ''
                }
              }
              
              // Extract UNITS
              if (rowString.includes('UNITS:')) {
                const unitsMatch = rowString.match(/UNITS:\s*([\d.]+)/i)
                if (unitsMatch) {
                  courseInfo.units = unitsMatch[1]
                }
              }
              
              // Extract DAYS
              if (rowString.includes('DAYS:')) {
                const daysMatch = rowString.match(/DAYS:\s*([A-Z]+)/i)
                if (daysMatch) {
                  courseInfo.days = daysMatch[1]
                }
              }
              
              // Extract SEMESTER
              if (rowString.includes('SEMESTER') && rowString.includes(':')) {
                const semParts = rowString.split('SEMESTER')[1].split(':')
                if (semParts.length > 1) {
                  courseInfo.semester = semParts[1].trim().split(/\s+TIME/i)[0].trim() || ''
                }
              }
              
              // Extract TIME
              if (rowString.includes('TIME:')) {
                const timeMatch = rowString.match(/TIME:\s*([\d:\sAMP-]+)/i)
                if (timeMatch) {
                  courseInfo.time = timeMatch[1].trim() || ''
                }
              }
              
              // Extract ACADEMIC YEAR
              if (rowString.includes('ACADEMIC YEAR') && rowString.includes(':')) {
                const yearParts = rowString.split('ACADEMIC YEAR')[1].split(':')
                if (yearParts.length > 1) {
                  courseInfo.academicYear = yearParts[1].trim().split(/\s+ROOM/i)[0].trim() || ''
                }
              }
              
              // Extract ROOM
              if (rowString.includes('ROOM:')) {
                const roomMatch = rowString.match(/ROOM:\s*([A-Z0-9\s]+)/i)
                if (roomMatch) {
                  courseInfo.room = roomMatch[1].trim() || ''
                }
              }
              
              // Extract Schedule ID
              if (rowString.includes('SCHEDULE ID') || rowString.includes('SCHEDULEID')) {
                const idParts = rowString.split(/(?:SCHEDULE\s*ID|SCHEDULEID)/i)[1]
                if (idParts) {
                  const idMatch = idParts.match(/:\s*(\d+)/)
                  if (idMatch) {
                    courseInfo.scheduleId = idMatch[1]
                  }
                }
              }
              
              // Extract COURSE
              if (rowString.includes('COURSE:')) {
                const courseMatch = rowString.match(/COURSE:\s*([A-Z]+)/i)
                if (courseMatch) {
                  courseInfo.course = courseMatch[1]
                }
              }
            }
          })

          // Also try to extract from individual cells by checking row structure
          headerRows.forEach(row => {
            if (Array.isArray(row) && row.length > 0) {
              for (let i = 0; i < row.length - 1; i++) {
                const cell = String(row[i] || '').trim().toUpperCase()
                const nextCell = String(row[i + 1] || '').trim()
                
                // Extract by pattern matching
                if (cell === 'SUBJECT' && !courseInfo.subject) {
                  courseInfo.subject = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'DESCRIPTION' && !courseInfo.description) {
                  courseInfo.description = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell.includes('UNITS') && !courseInfo.units) {
                  courseInfo.units = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'DAYS' && !courseInfo.days) {
                  courseInfo.days = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'SEMESTER' && !courseInfo.semester) {
                  courseInfo.semester = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'TIME' && !courseInfo.time) {
                  courseInfo.time = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell.includes('ACADEMIC YEAR') && !courseInfo.academicYear) {
                  courseInfo.academicYear = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'ROOM' && !courseInfo.room) {
                  courseInfo.room = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'BLOCK' && !courseInfo.block) {
                  courseInfo.block = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'SECTION' && !courseInfo.block) {
                  courseInfo.block = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell.includes('SCHEDULE') && cell.includes('ID') && !courseInfo.scheduleId) {
                  courseInfo.scheduleId = nextCell.split(':')[1]?.trim() || nextCell
                } else if (cell === 'COURSE' && !courseInfo.course) {
                  courseInfo.course = nextCell.split(':')[1]?.trim() || nextCell
                }
              }
            }
          })

          // Extract headers - get ALL columns from all rows to determine max width
          const headerRow = rawData[headerRowIndex] || []
          const maxColumns = Math.max(
            headerRow.length,
            ...rawData.map(row => row ? row.length : 0),
            10 // Minimum 10 columns
          )
          
          const headers = []
          for (let i = 0; i < maxColumns; i++) {
            const h = headerRow[i]
            let header = ''
            if (h !== null && h !== undefined) {
              if (typeof h === 'string') {
                header = h.trim().replace(/\s+/g, ' ')
              } else if (typeof h === 'number') {
                header = String(h)
              } else {
                header = String(h).trim()
              }
            }
            // If no header name, use column letter
            if (!header) {
              const colLetter = String.fromCharCode(65 + (i % 26)) + (Math.floor(i / 26) > 0 ? Math.floor(i / 26) : '')
              header = `Column_${colLetter}`
            }
            headers.push(header)
          }

          // Extract ALL data rows - pad rows to match maxColumns
          const allRowsAfterHeader = rawData.slice(headerRowIndex + 1)
          const dataRows = allRowsAfterHeader.map(row => {
            const paddedRow = [...(row || [])]
            while (paddedRow.length < maxColumns) {
              paddedRow.push(null)
            }
            return paddedRow
          })

          // Parse ALL rows into objects - include EVERYTHING
          const parsedData = dataRows.map((row, rowIndex) => {
            const obj = { _rowNumber: headerRowIndex + 2 + rowIndex } // Excel row number (1-indexed)
            headers.forEach((header, colIndex) => {
              const value = row[colIndex]
              if (value !== null && value !== undefined) {
                obj[header] = String(value).trim()
              } else {
                obj[header] = ''
              }
            })
            return obj
          })
          
          // Process data - keep MALE/FEMALE markers temporarily for gender detection
          const processedData = parsedData
            .filter(obj => {
              // Filter out completely empty rows
              const keys = Object.keys(obj).filter(k => k !== '_rowNumber')
              const hasData = keys.some(key => {
                const value = obj[key]
                return value !== '' && value !== null && value !== undefined
              })
              if (!hasData) return false
              
              // Keep section headers (MALE, FEMALE) and student data
              const isGenderMarker = obj['ID'] === 'MALE' || obj['ID'] === 'FEMALE'
              const hasStudentId = obj['ID'] && obj['ID'].trim() !== '' 
              const hasNumber = obj['No.'] && obj['No.'].trim() !== '' && /^\d+$/.test(obj['No.'].trim())
              const hasName = obj['NAME'] && obj['NAME'].trim() !== ''
              
              return isGenderMarker || hasStudentId || (hasNumber && hasName)
            })
            .map(obj => {
              // Reorganize and clean the data properly
              // Combine last name, first name, and middle initial
              const lastName = obj['NAME'] || ''
              const firstName = obj['Column_E'] || ''
              const middleInitial = obj['Column_F'] || ''
              let fullName = ''
              
              if (firstName && lastName) {
                fullName = `${firstName}${middleInitial ? ' ' + middleInitial + '.' : ''} ${lastName}`.trim()
              } else if (lastName) {
                fullName = lastName
              } else if (firstName) {
                fullName = firstName
              }
              
              // Check if "Final" column has "Grade" text, if so, get the actual final grade from next column
              let finalGrade = obj['Final'] || ''
              let remarks = obj['Remarks'] || ''
              
              // If Final column contains "Grade", it might be a header, try to get actual value
              if (finalGrade === 'Grade' || finalGrade === '') {
                // The actual final grade might be in a different position
                finalGrade = ''
              }
              
              const cleaned = {
                _rowNumber: obj._rowNumber,
                number: obj['No.'] || '',
                studentId: obj['ID'] || '',
                lastName: lastName,
                firstName: firstName,
                middleInitial: middleInitial,
                fullName: fullName,
                courseYear: obj['Course &'] || '',
                prelim: obj['Prelim'] || '',
                midterm: obj['Midterm'] || '',
                semiFinal: obj['Semi-'] || '',
                final: finalGrade,
                finalGrade: finalGrade,
                remarks: remarks,
                isGenderMarker: obj['ID'] === 'MALE' || obj['ID'] === 'FEMALE'
              }
              
              return cleaned
            })

          // Determine gender for each student based on section markers
          let currentGender = 'MALE' // Default
          const filteredData = processedData
            .map((obj, index) => {
              // Update current gender when we encounter a gender marker
              if (obj.isGenderMarker) {
                currentGender = obj.studentId
                return null // Mark for removal
              }
              
              // Assign gender based on the last gender marker encountered
              return {
                ...obj,
                gender: currentGender
              }
            })
            .filter(obj => {
              // Remove gender markers and keep only valid student data
              return obj !== null && obj.studentId && obj.studentId.trim() !== '' && obj.studentId !== 'MALE' && obj.studentId !== 'FEMALE'
            })

          // Format semester properly
          let formattedSemester = ''
          if (courseInfo.semester) {
            const semNum = courseInfo.semester.toString().trim()
            if (semNum === '1') {
              formattedSemester = '1st Semester'
            } else if (semNum === '2') {
              formattedSemester = '2nd Semester'
            } else if (semNum === '3') {
              formattedSemester = '3rd Semester'
            } else {
              formattedSemester = `${semNum}th Semester`
            }
          }

          // Format academic year with double dashes (e.g., "2025--2026")
          let formattedAcademicYear = ''
          if (courseInfo.academicYear) {
            // Replace " - " or any whitespace with "--"
            formattedAcademicYear = courseInfo.academicYear.replace(/\s*-\s*/g, '--').replace(/\s+/g, '--').replace(/---+/g, '--')
          }

          // Parse units as number
          let unitsValue = 0
          if (courseInfo.units) {
            const parsed = parseFloat(courseInfo.units)
            unitsValue = isNaN(parsed) ? 0 : parsed
          }

          // Extract subject code (just the prefix, e.g., "IT" from "IT 210")
          let subjectCode = courseInfo.subject || ''
          if (subjectCode && subjectCode.includes(' ')) {
            subjectCode = subjectCode.split(' ')[0]
          }

          // Format student data to desired structure
          const studentDataFormatted = filteredData.map(item => {
            return {
              student_id: item.studentId.trim(),
              last_name: item.lastName || '',
              first_name: item.firstName || '',
              course_year: item.courseYear || '',
              middle_initial: item.middleInitial || '',
              gender: item.gender || 'MALE',
              status: 'active'
            }
          })

          // Transform schedule data to desired format
          const scheduleData = {
            subject_code: subjectCode,
            description: (courseInfo.description || '').toUpperCase(),
            semester: formattedSemester,
            academic_year: formattedAcademicYear,
            units: unitsValue,
            days: courseInfo.days || '',
            time: courseInfo.time || '',
            room: courseInfo.room || '',
            block: courseInfo.block || '',
            students: studentDataFormatted.map(s => s.student_id),
            status: 'active'
          }

          // Step 4: Save to backend (70-100%)
          setImportProgress({ show: true, percentage: 70, message: 'Saving students and schedule to database...' })
          
          // Save imported data to backend
          await saveImportedData(scheduleData, studentDataFormatted, setImportProgress)
          
          // Complete
          setImportProgress({ show: true, percentage: 100, message: 'Import completed successfully!' })
          
          // Hide progress after a moment
          setTimeout(() => {
            setImportProgress({ show: false, percentage: 0, message: '' })
          }, 1500)
        } catch (error) {
          showToast('Failed to read Excel file. Please check the file format.', 'error')
        }
      }
    }
    fileInput.click()
  }

  const handleEdit = async (item) => {
    setEditingItem(item)
    
    // Fetch latest data from API
    try {
      const response = await scheduleService.getScheduleById(item._id || item.id)
      const schedule = response.schedule || response.data
      if (schedule) {
        setFormData({
          subject: schedule.subject_code || '',
          description: schedule.description || '',
          semester: schedule.semester || '',
          academicYear: schedule.academic_year || '',
          units: schedule.units || '',
          days: schedule.days || '',
          time: schedule.time || '',
          room: schedule.room || '',
          block: schedule.block || '',
          selectedStudents: schedule.students || [],
        })
      }
    } catch (error) {
      // Use existing item data as fallback
    setFormData({
      subject: item.subject || '',
      description: item.description || '',
      semester: item.semester || '',
        academicYear: item.academicYear || '',
      units: item.units || '',
      days: item.days || '',
      time: item.time || '',
      room: item.room || '',
      block: item.block || '',
      selectedStudents: item.selectedStudents || [],
    })
    }
    
    setErrors({ 
      subject: '', 
      description: '', 
      semester: '', 
      academicYear: '',
      units: '', 
      days: '', 
      time: '', 
      room: '',
      selectedStudents: '' 
    })
    setTouched({ 
      subject: false, 
      description: false, 
      semester: false, 
      academicYear: false,
      units: false, 
      days: false, 
      time: false, 
      room: false,
      selectedStudents: false 
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    setSaving(true)
    try {
    if (editingItem) {
        // Update existing schedule
        const updateData = {
          scheduleId: editingItem._id || editingItem.id,
          subject_code: formData.subject,
          description: formData.description,
          semester: formData.semester,
          academic_year: formData.academicYear,
          units: parseFloat(formData.units),
          days: formData.days,
          time: formData.time,
          room: formData.room,
          block: formData.block,
          students: formData.selectedStudents,
        }
        
        await scheduleService.updateSchedule(updateData)
        await loadSchedules(currentPage, pageSize)
      showToast('Schedule updated successfully', 'success')
      } else {
        // Create new schedule
        const newScheduleData = {
          subject_code: formData.subject,
          description: formData.description,
          semester: formData.semester,
          academic_year: formData.academicYear,
          units: parseFloat(formData.units),
          days: formData.days,
          time: formData.time,
          room: formData.room,
          block: formData.block,
          students: formData.selectedStudents,
          status: 'active'
        }
        
        await scheduleService.createSchedule(newScheduleData)
        await loadSchedules(currentPage, pageSize)
        showToast('Schedule created successfully', 'success')
    }

    setIsModalOpen(false)
      setEditingItem(null)
    setFormData({ 
      subject: '', 
      description: '', 
      semester: '', 
        academicYear: '',
      units: '', 
      days: '', 
      time: '', 
      room: '',
      block: '',
      selectedStudents: [] 
    })
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save schedule. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (item, newStatus) => {
    setConfirmDialog({
      isOpen: true,
      item,
      newStatus,
    })
  }

  const confirmStatusChange = async () => {
    if (confirmDialog.item && confirmDialog.newStatus) {
      try {
        await scheduleService.updateScheduleStatus({
          scheduleId: confirmDialog.item._id || confirmDialog.item.id,
          status: confirmDialog.newStatus.toLowerCase()
        })
        
        await loadSchedules(currentPage, pageSize)
      showToast(`Schedule ${confirmDialog.newStatus}`, 'success')
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to update schedule status. Please try again.', 'error')
      }
      setConfirmDialog({ isOpen: false, item: null, newStatus: null })
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Filter data (client-side search, but pagination is server-side)
  const filteredData = useMemo(() => {
    let filtered = allData
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        item.subject?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.semester?.toLowerCase().includes(query) ||
        item.academicYear?.toLowerCase().includes(query) ||
        item.days?.toLowerCase().includes(query) ||
        item.time?.toLowerCase().includes(query) ||
        item.room?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [allData, searchQuery])

  // For server-side pagination, use allData directly (filteredData is for search only)
  const paginatedData = filteredData
  const totalPages = Math.ceil(totalCount / pageSize)

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
          <Skeleton variant="button" className="h-10 w-32" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <Skeleton variant="text" className="h-10 w-full mb-4" />
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
            Schedule
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage class schedules and timetables
          </p>
        </div>
        <Button onClick={handleImport} variant="success" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import
        </Button>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by subject, description, room..."
      />

      <Table
        data={paginatedData}
        columns={columns}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        
      />

      <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showSearch={false}
        />

      {/* Import Progress Modal */}
      {importProgress.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Importing Excel File
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {importProgress.message}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${importProgress.percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {importProgress.percentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Schedule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              onBlur={() => handleBlur('subject')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.subject && touched.subject
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., IT 210"
            />
            {errors.subject && touched.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.description && touched.description
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., Discrete Math"
            />
            {errors.description && touched.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.semester}
              onChange={(e) => handleInputChange('semester', e.target.value)}
              onBlur={() => handleBlur('semester')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.semester && touched.semester
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., 1st Semester"
            />
            {errors.semester && touched.semester && (
              <p className="mt-1 text-sm text-red-500">{errors.semester}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => handleInputChange('academicYear', e.target.value)}
              onBlur={() => handleBlur('academicYear')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.academicYear && touched.academicYear
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., 2025-2026"
            />
            {errors.academicYear && touched.academicYear && (
              <p className="mt-1 text-sm text-red-500">{errors.academicYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Units <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.units}
              onChange={(e) => handleInputChange('units', e.target.value)}
              onBlur={() => handleBlur('units')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.units && touched.units
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., 3"
              min="1"
            />
            {errors.units && touched.units && (
              <p className="mt-1 text-sm text-red-500">{errors.units}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Days <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.days}
              onChange={(e) => handleInputChange('days', e.target.value)}
              onBlur={() => handleBlur('days')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.days && touched.days
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., TTH"
            />
            {errors.days && touched.days && (
              <p className="mt-1 text-sm text-red-500">{errors.days}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              onBlur={() => handleBlur('time')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.time && touched.time
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., 10:00 AM – 11:30 AM"
            />
            {errors.time && touched.time && (
              <p className="mt-1 text-sm text-red-500">{errors.time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => handleInputChange('room', e.target.value)}
              onBlur={() => handleBlur('room')}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.room && touched.room
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., M 108"
            />
            {errors.room && touched.room && (
              <p className="mt-1 text-sm text-red-500">{errors.room}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Block/Section
            </label>
            <input
              type="text"
              value={formData.block}
              onChange={(e) => handleInputChange('block', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Block A, Section 1"
            />
          </div>

          {/* Show student count only in Edit mode */}
          {editingItem ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Students
              </label>
              <div className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <span className="text-sm font-medium">
                  {formData.selectedStudents.length} student(s)
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Students <span className="text-red-500">*</span>
              </label>
              
              {/* Selected Students Tags */}
              {formData.selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[60px]">
                  {formData.selectedStudents.map((studentId) => {
                    const student = students.find(s => s.studentId === studentId)
                    if (!student) return null
                    return (
                      <span
                        key={studentId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                      >
                        <span>{student.studentId} - {student.lastName}, {student.firstName}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const updated = formData.selectedStudents.filter(id => id !== studentId)
                            handleInputChange('selectedStudents', updated)
                          }}
                          className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                          title="Remove student"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Multi-Select Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  onBlur={() => setTimeout(() => setStudentDropdownOpen(false), 200)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.selectedStudents && touched.selectedStudents
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
                >
                  <span className={formData.selectedStudents.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                    {formData.selectedStudents.length === 0 
                      ? 'Search and select students...' 
                      : `${formData.selectedStudents.length} student(s) selected`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${studentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {studentDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by ID, last name, or first name..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="overflow-y-auto max-h-64">
                      {students
                        .filter(student => {
                          if (!studentSearchQuery.trim()) return true
                          const query = studentSearchQuery.toLowerCase()
                          return (
                            student.studentId.toLowerCase().includes(query) ||
                            student.lastName.toLowerCase().includes(query) ||
                            student.firstName.toLowerCase().includes(query)
                          )
                        })
                        .map((student) => {
                          const isSelected = formData.selectedStudents.includes(student.studentId)
                          return (
                            <div
                              key={student.studentId}
                              onClick={() => {
                                let updated
                                if (isSelected) {
                                  updated = formData.selectedStudents.filter(id => id !== student.studentId)
                                } else {
                                  updated = [...formData.selectedStudents, student.studentId]
                                }
                                handleInputChange('selectedStudents', updated)
                                handleBlur('selectedStudents')
                              }}
                              className={`px-4 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.studentId}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {student.lastName}, {student.firstName}{student.middleInitial ? ` ${student.middleInitial}.` : ''}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="flex items-center">
                                  <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      
                      {students.filter(student => {
                        if (!studentSearchQuery.trim()) return true
                        const query = studentSearchQuery.toLowerCase()
                        return (
                          student.studentId.toLowerCase().includes(query) ||
                          student.lastName.toLowerCase().includes(query) ||
                          student.firstName.toLowerCase().includes(query)
                        )
                      }).length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          {studentSearchQuery.trim() ? 'No students found matching your search' : 'No students available'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {errors.selectedStudents && touched.selectedStudents && (
                <p className="mt-1 text-sm text-red-500">{errors.selectedStudents}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Status Change"
        message={`Are you sure you want to mark this schedule as ${confirmDialog.newStatus}?`}
        onConfirm={confirmStatusChange}
        onClose={() => setConfirmDialog({ isOpen: false, item: null, newStatus: null })}
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

export default Schedule

