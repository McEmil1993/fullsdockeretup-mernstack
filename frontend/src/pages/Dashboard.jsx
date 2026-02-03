import { useState, useEffect, useRef } from 'react'
import { Container, Server, Upload, Users, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Widget from '../components/Widget'
import SkeletonWidget from '../components/SkeletonWidget'
import Toast from '../components/Toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as dockerService from '../services/docker'
import * as serverService from '../services/servers'
import * as userService from '../services/users'
import { fileUploadService } from '../services/fileUploads'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalContainers: 0,
    runningContainers: 0,
    totalServers: 0,
    totalUsers: 0,
    totalFiles: 0,
  })
  const [containerMetrics, setContainerMetrics] = useState([])
  const [realtimeData, setRealtimeData] = useState([])
  const maxDataPoints = 20
  const intervalRef = useRef(null)
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all data in parallel
      const [containersResponse, serversResponse, usersResponse, filesResponse] = await Promise.all([
        dockerService.getAllContainers().catch(() => ({ data: [] })),
        serverService.getAllServers({ page: 1, limit: 1 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        userService.getAllUsers({ page: 1, limit: 1 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        fileUploadService.getAllFiles(1, 1).catch(() => ({ data: [], pagination: { total: 0 } })),
      ])

      const containers = containersResponse.data || []
      const runningContainers = containers.filter(c => c.status?.toLowerCase().includes('running') || c.state === 'running')

      // Get counts from responses
      const serversCount = serversResponse.data?.length || serversResponse.pagination?.total || 0
      const usersCount = usersResponse.data?.length || usersResponse.pagination?.total || 0  
      const filesCount = filesResponse.data?.length || filesResponse.pagination?.total || 0

      // Update stats
      setStats({
        totalContainers: containers.length,
        runningContainers: runningContainers.length,
        totalServers: serversCount,
        totalUsers: usersCount,
        totalFiles: filesCount,
      })

      // Set container metrics for graph
      setContainerMetrics(runningContainers)

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showToast(error.message || 'Failed to load dashboard data', 'error')
      setLoading(false)
    }
  }

  // Fetch real-time container stats
  const fetchContainerStats = async () => {
    try {
      const containersResponse = await dockerService.getAllContainers()
      const containers = containersResponse.data || []
      const runningContainers = containers.filter(c => c.status?.toLowerCase().includes('running') || c.state === 'running')

      // For demo: generate random data if no real stats available
      // In production, this would come from docker stats command
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      // Simulate CPU and Memory usage (replace with real docker stats in production)
      const avgCpu = runningContainers.length > 0 ? Math.random() * 50 + 10 : 0 // 10-60%
      const avgMemory = runningContainers.length > 0 ? Math.random() * 40 + 20 : 0 // 20-60%

      const newDataPoint = {
        time: timeStr,
        cpu: parseFloat(avgCpu.toFixed(2)),
        memory: parseFloat(avgMemory.toFixed(2)),
        containers: runningContainers.map(c => c.name).join(', ') || 'None'
      }

      setRealtimeData(prevData => {
        const newData = [...prevData, newDataPoint]
        // Keep only last maxDataPoints
        return newData.slice(-maxDataPoints)
      })

      // Update stats
      setStats(prev => ({
        ...prev,
        totalContainers: containers.length,
        runningContainers: runningContainers.length,
      }))

    } catch (error) {
      console.error('Error fetching container stats:', error)
    }
  }

  useEffect(() => {
    loadDashboardData()

    // Start real-time polling every 3 seconds
    intervalRef.current = setInterval(() => {
      fetchContainerStats()
    }, 3000)

    // Initial fetch
    fetchContainerStats()

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Docker Monitoring & Server Management Overview
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <SkeletonWidget />
          <SkeletonWidget />
          <SkeletonWidget />
          <SkeletonWidget />
          <SkeletonWidget />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div onClick={() => navigate('/docker')} className="cursor-pointer transform hover:scale-105 transition-transform">
            <Widget
              icon={Container}
              title="Total Containers"
              value={formatNumber(stats.totalContainers)}
              trend="neutral"
              color="blue"
            />
          </div>
          <div onClick={() => navigate('/docker')} className="cursor-pointer transform hover:scale-105 transition-transform">
            <Widget
              icon={Activity}
              title="Running Containers"
              value={formatNumber(stats.runningContainers)}
              trend={stats.runningContainers > 0 ? 'up' : 'down'}
              color="green"
            />
          </div>
          <div onClick={() => navigate('/servers')} className="cursor-pointer transform hover:scale-105 transition-transform">
            <Widget
              icon={Server}
              title="Servers"
              value={formatNumber(stats.totalServers)}
              trend="neutral"
              color="indigo"
            />
          </div>
          <div onClick={() => navigate('/user')} className="cursor-pointer transform hover:scale-105 transition-transform">
            <Widget
              icon={Users}
              title="Users"
              value={formatNumber(stats.totalUsers)}
              trend="neutral"
              color="purple"
            />
          </div>
          <div onClick={() => navigate('/file-upload')} className="cursor-pointer transform hover:scale-105 transition-transform">
            <Widget
              icon={Upload}
              title="Files"
              value={formatNumber(stats.totalFiles)}
              trend="neutral"
              color="pink"
            />
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Status
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Docker Status */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Container className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Docker Status</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalContainers > 0 ? 'Active' : 'No Containers'}
                </div>
              </div>
            </div>

            {/* Running Status */}
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              {stats.runningContainers > 0 ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Running</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.runningContainers} / {stats.totalContainers}
                </div>
              </div>
            </div>

            {/* Server Management */}
            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Server className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Server Management</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalServers} Server{stats.totalServers !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Container Metrics Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Container Metrics
          </h2>
          {!loading && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">CPU %</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Memory %</span>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <div className="flex-1 flex items-end gap-2">
              <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-28 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-36 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          </div>
        ) : realtimeData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 animate-pulse" />
              <p>Loading real-time data...</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  stroke="#888888"
                  tick={{ fill: '#888888' }}
                />
                <YAxis 
                  className="text-xs"
                  stroke="#888888"
                  tick={{ fill: '#888888' }}
                  label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft', fill: '#888888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label) => {
                    const dataPoint = realtimeData.find(d => d.time === label)
                    return dataPoint ? `${label}\nContainers: ${dataPoint.containers}` : label
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="CPU Usage"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="Memory Usage"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {!loading && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Updates every 3 seconds</span>
              <span>{stats.runningContainers} container{stats.runningContainers !== 1 ? 's' : ''} running</span>
            </div>
            {realtimeData.length > 0 && realtimeData[realtimeData.length - 1].containers !== 'None' && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                
              </div>
            )}
          </div>
        )}
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
