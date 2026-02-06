import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Table, 
  Settings, 
  Upload,
  Container,
  Server,
  FileText,
  Sparkles,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Bell
} from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { usePermissions } from '../contexts/PermissionContext'

const SideNav = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { settings } = useSettings()
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const [expandedMenus, setExpandedMenus] = useState({ 'access-control': true })
  const [showLoading, setShowLoading] = useState(true)
  
  // Force loading overlay to show for minimum 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 500) // 2 seconds minimum
    
    return () => clearTimeout(timer)
  }, [])

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard.canView' },
    { path: '/docker', icon: Container, label: 'Docker Monitor', permission: 'dockerMonitor.canView' },
    { path: '/servers', icon: Server, label: 'Servers', permission: 'serversManagement.canView' },
    { path: '/file-upload', icon: Upload, label: 'File Upload', permission: 'fileUpload.canView' },
    { path: '/documents', icon: FileText, label: 'Documents', permission: 'documents.canView' },
     { path: '/user', icon: Table, label: 'Users', permission: 'userManagement.canView' },
    { 
      key: 'access-control',
      icon: Shield, 
      label: 'Access Control', 
      permission: 'userManagement.canView',
      submenu: [
        { path: '/roles', icon: Users, label: 'Roles', permission: 'userManagement.canView' },
        { path: '/permissions', icon: Shield, label: 'Permissions', permission: 'userManagement.canView' },
      ]
    },
    { path: '/settings', icon: Settings, label: 'Settings', permission: 'settings.canView' },
    { path: '/notifications', icon: Bell, label: 'Notifications', permission: null },
    { path: '/ai-chat', icon: Sparkles, label: 'My Personal AI', permission: 'aiChat.canView' },
  ]

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Filter nav items based on permissions
  // IMPORTANT: Don't show any items while loading to prevent flash of unauthorized content
  const visibleNavItems = permissionsLoading ? [] : navItems.filter(item => {
    if (!item.permission) return true
    if (!hasPermission) return true
    return hasPermission(item.permission)
  }).map(item => {
    // Filter submenu items if they exist
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter(subItem => {
          if (!subItem.permission) return true
          if (!hasPermission) return true
          return hasPermission(subItem.permission)
        })
      }
    }
    return item
  })

  // If dark mode is enabled, use dark color for side nav
  const sideNavBgColor = settings.darkMode ? '#1e293b' : settings.sideNavColor
  
  // Font colors - use defaults if not set
  const defaultFontColor = settings.sideNavFontColor || '#e2e8f0'
  const hoverColor = settings.sideNavHoverColor || '#ffffff'
  const activeColor = settings.sideNavActiveColor || '#ffffff'

  const handleLinkClick = () => {
    // Close mobile menu when link is clicked
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 p-4 transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: sideNavBgColor }}
      >
        {/* Loading Overlay - Skeleton design that covers entire sidebar */}
        {(permissionsLoading || showLoading) && (
          <div 
            className="absolute inset-0 z-50 p-4"
            style={{ 
              backgroundColor: sideNavBgColor
            }}
          >
            {/* Header skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-white bg-opacity-20 rounded-lg animate-pulse mb-2 w-3/4"></div>
              <div className="h-4 bg-white bg-opacity-15 rounded-lg animate-pulse w-1/2"></div>
            </div>

            {/* Menu items skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {/* Icon skeleton */}
                  <div className="w-5 h-5 bg-white bg-opacity-20 rounded animate-pulse"></div>
                  {/* Text skeleton with varying widths */}
                  <div 
                    className="h-4 bg-white bg-opacity-20 rounded animate-pulse" 
                    style={{ 
                      width: `${60 + (i % 3) * 15}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: defaultFontColor }}>CTower</h1>
            {/* <p className="text-sm" style={{ color: defaultFontColor, opacity: 0.8 }}>Admin Panel</p> */}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            style={{ color: defaultFontColor }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-2">
          {permissionsLoading ? (
            // Show skeleton while loading permissions
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-white bg-opacity-10 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            visibleNavItems.map((item) => {
              const Icon = item.icon
              
              // Handle submenu items
              if (item.submenu) {
                const isExpanded = expandedMenus[item.key]
                const isAnySubItemActive = item.submenu.some(sub => location.pathname === sub.path)
                
                return (
                  <div key={item.key}>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isAnySubItemActive
                          ? 'bg-white bg-opacity-20 font-semibold'
                          : 'hover:bg-white hover:bg-opacity-10'
                      }`}
                      style={{
                        color: isAnySubItemActive ? activeColor : defaultFontColor,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isActive = location.pathname === subItem.path
                          
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={handleLinkClick}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-white bg-opacity-20 font-semibold'
                                  : 'hover:bg-white hover:bg-opacity-10'
                              }`}
                              style={{
                                color: isActive ? activeColor : defaultFontColor,
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.color = hoverColor
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.color = defaultFontColor
                                }
                              }}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm">{subItem.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              // Regular menu items
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white bg-opacity-20 font-semibold'
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  style={{
                    color: isActive ? activeColor : defaultFontColor,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = hoverColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = defaultFontColor
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })
          )}
        </nav>
      </aside>
    </>
  )
}

export default SideNav
