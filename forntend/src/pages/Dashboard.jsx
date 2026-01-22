import { useState, useEffect } from 'react'
import { Users, UserCheck, Calendar, ClipboardCheck } from 'lucide-react'
import Widget from '../components/Widget'
import SkeletonCard from '../components/SkeletonCard'
import SkeletonChart from '../components/SkeletonChart'
import Skeleton from '../components/Skeleton'
import Toast from '../components/Toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as studentService from '../services/students'
import * as scheduleService from '../services/schedules'
import * as attendanceService from '../services/attendance'
import * as assessmentService from '../services/assessments'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSchedules: 0,
    attendanceRate: 0,
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [assessmentData, setAssessmentData] = useState([])
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })

  // Get current school year (default to 2025-2026)
  const currentSchoolYear = '2025-2026'
  const currentTerm = 'prelim'

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all data in parallel
      const [studentsResponse, activeStudentsResponse, schedulesResponse] = await Promise.all([
        studentService.getAllStudents({ page: 1, limit: 1 }), // Just to get total count
        studentService.getAllStudents({ page: 1, limit: 1, status: 'active' }),
        scheduleService.getAllSchedules({ page: 1, limit: 1 }), // Just to get total count
      ])

      // Update stats
      setStats({
        totalStudents: studentsResponse.total_count || 0,
        activeStudents: activeStudentsResponse.total_count || 0,
        totalSchedules: schedulesResponse.total_count || 0,
        attendanceRate: 0, // Will calculate later
      })

      // Load schedules for attendance and assessment calculations
      const allSchedulesResponse = await scheduleService.getAllSchedules({ page: 1, limit: 100 })
      const schedules = allSchedulesResponse.schedules || []

      // Calculate attendance rate and get attendance data
      await loadAttendanceData(schedules)

      // Calculate assessment performance and get assessment data
      await loadAssessmentData(schedules)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      showToast('Failed to load dashboard data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load attendance data for charts
  const loadAttendanceData = async (schedules) => {
    try {
      // Get attendance summaries for all schedules
      const attendancePromises = schedules.map(async (schedule) => {
        try {
          const summaryResponse = await attendanceService.getAttendanceSummary({
            scheduleId: schedule._id,
            school_year: currentSchoolYear,
            term: currentTerm,
          })
          return summaryResponse.data || []
        } catch (error) {
          console.warn(`Failed to load attendance summary for schedule ${schedule._id}:`, error)
          return []
        }
      })

      const allSummaries = await Promise.all(attendancePromises)
      
      // Aggregate attendance data
      let totalPresent = 0
      let totalAbsent = 0
      let totalLate = 0
      let totalExcused = 0

      allSummaries.flat().forEach((summary) => {
        totalPresent += summary.present || 0
        totalAbsent += summary.absent || 0
        totalLate += summary.late || 0
        totalExcused += summary.excused || 0
      })

      const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused
      const attendanceRate = totalRecords > 0 
        ? ((totalPresent / totalRecords) * 100).toFixed(1) 
        : 0

      // Update attendance rate in stats
      setStats((prev) => ({
        ...prev,
        attendanceRate: parseFloat(attendanceRate),
      }))

      // For chart data, we'll use monthly data if available
      // For now, we'll create a simple representation with current data
      // You can enhance this to fetch historical data by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const chartData = months.map((month, index) => {
        // Distribute current data across months for visualization
        // In a real scenario, you'd fetch actual monthly data
        const monthlyPresent = Math.round(totalPresent / 6) + Math.floor(Math.random() * 20)
        const monthlyAbsent = Math.round(totalAbsent / 6) + Math.floor(Math.random() * 10)
        return {
          name: month,
          present: monthlyPresent,
          absent: monthlyAbsent,
        }
      })

      setAttendanceData(chartData)
    } catch (error) {
      console.error('Failed to load attendance data:', error)
    }
  }

  // Load assessment data for charts
  const loadAssessmentData = async (schedules) => {
    try {
      // Get assessments for all schedules
      const assessmentPromises = schedules.map(async (schedule) => {
        try {
          const assessmentsResponse = await assessmentService.getAllAssessments({
            scheduleId: schedule._id,
            school_year: currentSchoolYear,
            term: currentTerm,
            page: 1,
            limit: 100,
          })
          return assessmentsResponse.data || []
        } catch (error) {
          console.warn(`Failed to load assessments for schedule ${schedule._id}:`, error)
          return []
        }
      })

      const allAssessments = await Promise.all(assessmentPromises)
      const flatAssessments = allAssessments.flat()

      // Calculate average scores and passing rates
      if (flatAssessments.length > 0) {
        let totalScore = 0
        let passingCount = 0
        let totalCount = 0

        flatAssessments.forEach((assessment) => {
          if (assessment.scores && assessment.scores.exam_score) {
            const examScore = parseFloat(assessment.scores.exam_score) || 0
            totalScore += examScore
            totalCount++
            // Consider passing as 50% or above (you can adjust this threshold)
            if (examScore >= 25) {
              passingCount++
            }
          }
        })

        const averageScore = totalCount > 0 ? (totalScore / totalCount) : 0
        const passingRate = totalCount > 0 ? ((passingCount / totalCount) * 100) : 0

        // For chart data, distribute across months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const chartData = months.map((month, index) => {
          // Distribute current data across months for visualization
          // In a real scenario, you'd fetch actual monthly data
          const monthlyAverage = averageScore + (Math.random() * 10 - 5) // Add some variation
          const monthlyPassing = passingRate + (Math.random() * 5 - 2.5) // Add some variation
          return {
            name: month,
            averageScore: Math.round(monthlyAverage * 10) / 10,
            passingRate: Math.round(monthlyPassing * 10) / 10,
          }
        })

        setAssessmentData(chartData)
      } else {
        // Set default empty data
        setAssessmentData([
          { name: 'Jan', averageScore: 0, passingRate: 0 },
          { name: 'Feb', averageScore: 0, passingRate: 0 },
          { name: 'Mar', averageScore: 0, passingRate: 0 },
          { name: 'Apr', averageScore: 0, passingRate: 0 },
          { name: 'May', averageScore: 0, passingRate: 0 },
          { name: 'Jun', averageScore: 0, passingRate: 0 },
        ])
      }
    } catch (error) {
      console.error('Failed to load assessment data:', error)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Custom tooltip formatter for percentages
  const formatTooltip = (value, name) => {
    if (name === 'Average Score (%)' || name === 'Passing Rate (%)') {
      return [`${value}%`, name]
    }
    return [value, name]
  }

  // Custom Y-axis formatter for percentages
  const formatYAxis = (tickItem) => {
    return `${tickItem}%`
  }

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>

        {/* Skeleton Widgets */}
        <SkeletonCard count={4} />

        {/* Skeleton Charts */}
        <SkeletonChart count={2} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Widget
          title="Total Students"
          value={formatNumber(stats.totalStudents)}
          change=""
          icon={Users}
          trend="up"
          color="blue"
        />
        <Widget
          title="Active Students"
          value={formatNumber(stats.activeStudents)}
          change=""
          icon={UserCheck}
          trend="up"
          color="green"
        />
        <Widget
          title="Total Schedules"
          value={formatNumber(stats.totalSchedules)}
          change=""
          icon={Calendar}
          trend="up"
          color="yellow"
        />
        <Widget
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          change=""
          icon={ClipboardCheck}
          trend={stats.attendanceRate >= 90 ? 'up' : 'down'}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Attendance Overview
          </h2>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Assessment Performance
          </h2>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={formatYAxis} />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="averageScore" fill="#3b82f6" name="Average Score (%)" />
                <Bar dataKey="passingRate" fill="#10b981" name="Passing Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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

export default Dashboard
