import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Table, 
  Settings, 
  Image as ImageIcon,
  BarChart3,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Calendar,
  Upload,
  Container,
  Server,
  X
} from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

const SideNav = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { settings } = useSettings()

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    // { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    // { path: '/assessment', icon: FileText, label: 'Assessment' },
    // { path: '/schedule', icon: Calendar, label: 'Schedule' },
    // { path: '/students', icon: GraduationCap, label: 'Students' },

    { path: '/docker', icon: Container, label: 'Docker Monitor' },
    { path: '/servers', icon: Server, label: 'Servers' },
    { path: '/file-upload', icon: Upload, label: 'File Upload' },
    // { path: '/docker', icon: Container, label: 'Docker Monitor' },
    { path: '/user', icon: Table, label: 'Users' },
    // { path: '/images', icon: ImageIcon, label: 'Images' },
    // { path: '/charts', icon: BarChart3, label: 'Charts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: defaultFontColor }}>Dashboard</h1>
            <p className="text-sm" style={{ color: defaultFontColor, opacity: 0.8 }}>Admin Panel</p>
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
          {navItems.map((item) => {
            const Icon = item.icon
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
          })}
        </nav>
      </aside>
    </>
  )
}

export default SideNav
