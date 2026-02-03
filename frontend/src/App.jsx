import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import User from './pages/User'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Assessment from './pages/Assessment'
import Schedule from './pages/Schedule'
import Images from './pages/Images'
import Charts from './pages/Charts'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import FileUpload from './pages/FileUpload'
import PublicFileViewer from './pages/PublicFileViewer'
import Docker from './pages/Docker'
import Servers from './pages/Servers'
import TopNav from './components/TopNav'
import SideNav from './components/SideNav'
import Footer from './components/Footer'
import Skeleton from './components/Skeleton'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="hidden lg:block w-64 bg-gray-800 dark:bg-gray-800">
          <div className="p-4 space-y-4">
            <Skeleton variant="heading" className="w-32 mb-8" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-10" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="h-full px-6 flex items-center justify-between">
              <Skeleton variant="heading" className="w-48" />
              <Skeleton variant="avatar" className="w-10 h-10" />
            </div>
          </div>
          <main className="flex-1 p-6 space-y-6">
            <div>
              <Skeleton variant="title" className="w-64 mb-2" />
              <Skeleton variant="text" className="w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Skeleton variant="avatar" className="w-16 h-16 mx-auto" />
            <Skeleton variant="title" className="w-48 mx-auto" />
            <Skeleton variant="text" className="w-64 mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton variant="text" className="h-12 w-full" />
            <Skeleton variant="text" className="h-12 w-full" />
            <Skeleton variant="button" className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // If user is logged in, redirect to dashboard
  return user ? <Navigate to="/dashboard" replace /> : children
}

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('menu-open')
    }
  }, [])

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)
    // Prevent body scroll when menu is open
    if (newState) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    document.body.classList.remove('menu-open')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <SideNav isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      <div className="flex-1 flex flex-col w-full lg:ml-64 h-screen overflow-hidden relative">
        {/* Fixed TopNav */}
        <div className="fixed top-0 right-0 left-0 lg:left-64 z-30">
          <TopNav onMenuClick={toggleMobileMenu} />
        </div>
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 pb-20">
          {children}
        </main>
        
        {/* Fixed Footer */}
        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-30">
          <Footer />
        </div>
      </div>
    </div>
  )
}

// Wrapper component to conditionally apply AuthProvider
const AppRoutes = () => {
  // Check if current path is a public route
  const currentPath = window.location.pathname
  const isPublicRoute = currentPath.startsWith('/file/')
  
  // Public route - render without AuthProvider
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/file/:fileId" element={<PublicFileViewer />} />
      </Routes>
    )
  }
  
  // Protected routes - render with AuthProvider
  return (
    <AuthProvider>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <Layout>
                    <User />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Students />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Attendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Assessment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Schedule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/images"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Images />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/charts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Charts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/file-upload"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FileUpload />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/docker"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Docker />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/servers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Servers />
                  </Layout>
                </ProtectedRoute>
              }
            />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function App() {
  return (
    <SettingsProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </Router>
    </SettingsProvider>
  )
}

export default App
