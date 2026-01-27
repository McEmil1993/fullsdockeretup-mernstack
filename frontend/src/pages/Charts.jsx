import { useState, useEffect } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import SkeletonChart from '../components/SkeletonChart'
import Skeleton from '../components/Skeleton'

const Charts = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for 1 second
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const salesData = [
    { name: 'Jan', sales: 4000, revenue: 2400, profit: 1600 },
    { name: 'Feb', sales: 3000, revenue: 1398, profit: 1002 },
    { name: 'Mar', sales: 2000, revenue: 9800, profit: 7800 },
    { name: 'Apr', sales: 2780, revenue: 3908, profit: 1128 },
    { name: 'May', sales: 1890, revenue: 4800, profit: 2910 },
    { name: 'Jun', sales: 2390, revenue: 3800, profit: 1410 },
  ]

  const radarData = [
    { subject: 'Speed', A: 120, B: 110, fullMark: 150 },
    { subject: 'Strength', A: 98, B: 130, fullMark: 150 },
    { subject: 'Defense', A: 86, B: 130, fullMark: 150 },
    { subject: 'HP', A: 99, B: 100, fullMark: 150 },
    { subject: 'Magic', A: 85, B: 90, fullMark: 150 },
    { subject: 'Stamina', A: 65, B: 85, fullMark: 150 },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-64 mb-2" />
          <Skeleton variant="text" className="h-4 w-80" />
        </div>

        <SkeletonChart count={2} />
        <SkeletonChart count={2} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Charts & Analytics
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Visualize your data with various chart types
        </p>
      </div>

      {/* Area Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Area Chart - Sales Trend
        </h2>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="sales" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Line Chart - Revenue vs Profit
        </h2>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
          </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Bar Chart - Monthly Comparison
        </h2>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" />
            <Bar dataKey="revenue" fill="#10b981" />
            <Bar dataKey="profit" fill="#f59e0b" />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Radar Chart - Performance Metrics
        </h2>
        <div className="h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 150]} />
              <Radar name="Team A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Team B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Charts
