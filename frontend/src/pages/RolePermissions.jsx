import { useState, useEffect } from 'react'
import { Shield, RefreshCw, Search } from 'lucide-react'
import * as roleService from '../services/roles'
import * as permissionService from '../services/permissions'
import Toast from '../components/Toast'
import PermissionGate from '../components/PermissionGate'
import NoPermission from '../components/NoPermission'

const Permissions = () => {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [searchTerm, setSearchTerm] = useState('')

  const availableWidgets = [
    { key: 'activeUsers', label: 'Active Users' },
    { key: 'totalServers', label: 'Total Servers' },
    { key: 'containerStatus', label: 'Container Status' },
    { key: 'systemHealth', label: 'System Health' },
    { key: 'recentActivity', label: 'Recent Activity' },
  ]

  const availableModels = [
    { id: 'tinyllama:latest', name: 'Tiny Llama' },
    { id: 'orca-mini:latest', name: 'Orca Mini' },
    { id: 'deepseek-coder:1.3b', name: 'DeepSeek Coder 1.3B' },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B' },
    { id: 'qwen2.5:3b', name: 'Qwen 2.5 3B' },
    { id: 'llama3.2:3b', name: 'Llama 3.2 3B' },
    { id: 'phi3:mini', name: 'Phi-3 Mini' },
    { id: 'gemma3:4b', name: 'Gemma 3 4B' },
    { id: 'deepseek-coder:6.7b', name: 'DeepSeek Coder 6.7B' },
    { id: 'llama3:latest', name: 'Llama 3' },
    { id: 'codellama:latest', name: 'Code Llama' },
    { id: 'mistral:7b', name: 'Mistral 7B' },
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const rolesResponse = await roleService.getAllRoles()

      if (rolesResponse.success) {
        setRoles(rolesResponse.data)
        const permissionsState = {}
        rolesResponse.data.forEach(role => {
          permissionsState[role.name] = role.permissions
          
          // Debug: Log roles and permissions data
          if (role.name === 'supreadmin') {
            console.log('Super Admin Permissions:', {
              roles: role.permissions?.roles,
              permissions: role.permissions?.permissions
            })
          }
        })
        setPermissions(permissionsState)
        
        // Auto-select first role if none selected
        if (!selectedRole && rolesResponse.data.length > 0) {
          setSelectedRole(rolesResponse.data[0])
        }
      }
    } catch (error) {
      showToast('Error loading data: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (roleName, path, value) => {
    setPermissions(prev => {
      // Deep clone to avoid mutation issues
      const rolePerms = JSON.parse(JSON.stringify(prev[roleName] || {}))
      const keys = path.split('.')
      let current = rolePerms
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      // Save to backend
      roleService.updateRolePermissions(roleName, rolePerms)
        .then(response => {
          if (response.success) {
            showToast('Permission updated successfully', 'success')
          } else {
            showToast('Failed to save permission', 'error')
            // Revert on failure
            fetchData()
          }
        })
        .catch(error => {
          showToast('Error updating permission: ' + error.message, 'error')
          // Revert on error
          fetchData()
        })
      
      return { ...prev, [roleName]: rolePerms }
    })
  }

  const handleWidgetToggle = (roleName, widgetName) => {
    setPermissions(prev => {
      // Deep clone to avoid mutation issues
      const rolePerms = JSON.parse(JSON.stringify(prev[roleName] || {}))
      const currentWidgets = rolePerms?.dashboard?.canViewWidgets || []
      const newWidgets = currentWidgets.includes(widgetName)
        ? currentWidgets.filter(w => w !== widgetName)
        : [...currentWidgets, widgetName]
      
      if (!rolePerms.dashboard) rolePerms.dashboard = {}
      rolePerms.dashboard.canViewWidgets = newWidgets
      
      // Save to backend
      roleService.updateRolePermissions(roleName, rolePerms)
        .then(response => {
          if (response.success) {
            showToast('Widget permission updated successfully', 'success')
          } else {
            showToast('Failed to save widget permission', 'error')
            // Revert on failure
            fetchData()
          }
        })
        .catch(error => {
          showToast('Error updating permission: ' + error.message, 'error')
          // Revert on error
          fetchData()
        })
      
      return { ...prev, [roleName]: rolePerms }
    })
  }

  const handleModelToggle = (roleName, modelId) => {
    setPermissions(prev => {
      // Deep clone to avoid mutation issues
      const rolePerms = JSON.parse(JSON.stringify(prev[roleName] || {}))
      const currentModels = rolePerms?.aiChat?.allowedModels || []
      const newModels = currentModels.includes(modelId)
        ? currentModels.filter(m => m !== modelId)
        : [...currentModels, modelId]
      
      if (!rolePerms.aiChat) rolePerms.aiChat = {}
      rolePerms.aiChat.allowedModels = newModels
      
      // Save to backend
      roleService.updateRolePermissions(roleName, rolePerms)
        .then(response => {
          if (response.success) {
            showToast('Model permission updated successfully', 'success')
          } else {
            showToast('Failed to save model permission', 'error')
            // Revert on failure
            fetchData()
          }
        })
        .catch(error => {
          showToast('Error updating permission: ' + error.message, 'error')
          // Revert on error
          fetchData()
        })
      
      return { ...prev, [roleName]: rolePerms }
    })
  }

  const handleInitializeDefaults = async () => {
    if (!confirm('This will reset all roles to default permissions. Continue?')) return

    try {
      setLoading(true)
      await roleService.initializeDefaultRoles()
      await permissionService.initializeDefaultPermissions()
      showToast('Default roles and permissions initialized!', 'success')
      fetchData()
    } catch (error) {
      showToast('Error initializing defaults: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
  }

  const getPermissionValue = (roleName, path) => {
    const keys = path.split('.')
    let current = permissions[roleName]
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Debug when value is not found
        if (path.startsWith('roles.') || path.startsWith('permissions.')) {
          console.log('getPermissionValue NOT FOUND:', {
            roleName,
            path,
            keys,
            currentKey: key,
            availableKeys: current ? Object.keys(current) : 'null',
            fullPermissions: permissions[roleName]
          })
        }
        return false
      }
    }
    
    // Debug final result
    if (path.startsWith('roles.') || path.startsWith('permissions.')) {
      // console.log('getPermissionValue RESULT:', {
      //   roleName,
      //   path,
      //   value: current,
      //   isTrue: current === true
      // })
    }
    
    return current === true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const filteredRoles = roles.filter(role => 
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PermissionGate
      permission="userManagement.canView"
      fallback={<NoPermission message="You do not have permission to manage permissions!" />}
    >
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Permissions Management
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Assign and configure permissions for each role dynamically
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleInitializeDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roles</h2>
              <div className="space-y-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role.name}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedRole?.name === role.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{role.displayName}</div>
                    <div className="text-sm opacity-80">{role.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <PermissionPanel
                role={selectedRole}
                permissions={permissions[selectedRole.name]}
                getPermissionValue={getPermissionValue}
                handlePermissionChange={handlePermissionChange}
                handleWidgetToggle={handleWidgetToggle}
                handleModelToggle={handleModelToggle}
                availableWidgets={availableWidgets}
                availableModels={availableModels}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                Select a role to manage permissions
              </div>
            )}
          </div>
        </div>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </PermissionGate>
  )
}

// PermissionPanel Component - Dynamic Permission Assignment
const PermissionPanel = ({ role, permissions, getPermissionValue, handlePermissionChange, handleWidgetToggle, handleModelToggle, availableWidgets, availableModels }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {role.displayName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {role.description}
          </p>
          {role.isSystemRole && (
            <span className="text-sm text-amber-600 dark:text-amber-400 mt-1 inline-block">System Role</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Dashboard */}
        <PermissionGroup title="Dashboard">
          <PermissionToggle
            label="Can View Dashboard"
            checked={getPermissionValue(role.name, 'dashboard.canView')}
            onChange={(val) => handlePermissionChange(role.name, 'dashboard.canView', val)}
          />
          <div className="ml-4 space-y-2 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Viewable Widgets:</p>
            {availableWidgets.map((widget) => (
              <PermissionToggle
                key={widget.key}
                label={widget.label}
                checked={permissions?.dashboard?.canViewWidgets?.includes(widget.key)}
                onChange={() => handleWidgetToggle(role.name, widget.key)}
                small
              />
            ))}
          </div>
        </PermissionGroup>

        {/* Docker Monitor */}
        <PermissionGroup title="Docker Monitor">
          <PermissionToggle
            label="Can View Docker Monitor"
            checked={getPermissionValue(role.name, 'dockerMonitor.canView')}
            onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.canView', val)}
          />
          <PermissionToggle
            label="Can Create Container"
            checked={getPermissionValue(role.name, 'dockerMonitor.canCreateContainer')}
            onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.canCreateContainer', val)}
          />
          <div className="ml-4 space-y-1 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Container Actions:</p>
            <PermissionToggle label="View Containers" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canView')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canView', val)} small />
            <PermissionToggle label="Stop Container" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canStop')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canStop', val)} small />
            <PermissionToggle label="Restart Container" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canRestart')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canRestart', val)} small />
            <PermissionToggle label="View Details" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canViewDetails')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canViewDetails', val)} small />
            <PermissionToggle label="View Logs" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canViewLogs')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canViewLogs', val)} small />
            <PermissionToggle label="Delete Container" checked={getPermissionValue(role.name, 'dockerMonitor.containers.canDelete')} onChange={(val) => handlePermissionChange(role.name, 'dockerMonitor.containers.canDelete', val)} small />
          </div>
        </PermissionGroup>

        {/* Servers Management */}
        <PermissionGroup title="Servers Management">
          <PermissionToggle label="Can View Servers" checked={getPermissionValue(role.name, 'serversManagement.canView')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.canView', val)} />
          <PermissionToggle label="Can Add New Server" checked={getPermissionValue(role.name, 'serversManagement.canAddNewServer')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.canAddNewServer', val)} />
          <div className="ml-4 space-y-1 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Server Actions:</p>
            <PermissionToggle label="View Server List" checked={getPermissionValue(role.name, 'serversManagement.servers.canView')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.servers.canView', val)} small />
            <PermissionToggle label="View Server Details" checked={getPermissionValue(role.name, 'serversManagement.servers.canViewDetails')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.servers.canViewDetails', val)} small />
            <PermissionToggle label="Edit Server" checked={getPermissionValue(role.name, 'serversManagement.servers.canEdit')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.servers.canEdit', val)} small />
            <PermissionToggle label="Deactivate Server" checked={getPermissionValue(role.name, 'serversManagement.servers.canDeactivate')} onChange={(val) => handlePermissionChange(role.name, 'serversManagement.servers.canDeactivate', val)} small />
          </div>
        </PermissionGroup>

        {/* File Upload text-s */}
        <PermissionGroup title="File Upload">
          <PermissionToggle label="Can View Files" checked={getPermissionValue(role.name, 'fileUpload.canView')} onChange={(val) => handlePermissionChange(role.name, 'fileUpload.canView', val)} />
          <PermissionToggle label="Can Upload Files" checked={getPermissionValue(role.name, 'fileUpload.canUpload')} onChange={(val) => handlePermissionChange(role.name, 'fileUpload.canUpload', val)} />
          <PermissionToggle label="Can Delete Files" checked={getPermissionValue(role.name, 'fileUpload.canDelete')} onChange={(val) => handlePermissionChange(role.name, 'fileUpload.canDelete', val)} />
        </PermissionGroup>

        {/* User Management */}
        <PermissionGroup title="User Management">
          <PermissionToggle label="Can View Users" checked={getPermissionValue(role.name, 'userManagement.canView')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.canView', val)} />
          <PermissionToggle label="Can Add New User" checked={getPermissionValue(role.name, 'userManagement.canAddNewUser')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.canAddNewUser', val)} />
          <div className="ml-4 space-y-1 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User Actions:</p>
            <PermissionToggle label="View User List" checked={getPermissionValue(role.name, 'userManagement.users.canView')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.users.canView', val)} small />
            <PermissionToggle label="Edit User" checked={getPermissionValue(role.name, 'userManagement.users.canEdit')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.users.canEdit', val)} small />
            <PermissionToggle label="Set User Inactive (Deactivate)" checked={getPermissionValue(role.name, 'userManagement.users.canSetInactive')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.users.canSetInactive', val)} small />
            <PermissionToggle label="Set User Active (Activate)" checked={getPermissionValue(role.name, 'userManagement.users.canSetActive')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.users.canSetActive', val)} small />
            <PermissionToggle label="Reset Password" checked={getPermissionValue(role.name, 'userManagement.users.canResetPassword')} onChange={(val) => handlePermissionChange(role.name, 'userManagement.users.canResetPassword', val)} small />
          </div>
        </PermissionGroup>

        {/* Documents */}
        <PermissionGroup title="Documents">
          <PermissionToggle label="Can View Documents" checked={getPermissionValue(role.name, 'documents.canView')} onChange={(val) => handlePermissionChange(role.name, 'documents.canView', val)} />
          <PermissionToggle label="Can Create Document" checked={getPermissionValue(role.name, 'documents.canCreate')} onChange={(val) => handlePermissionChange(role.name, 'documents.canCreate', val)} />
          <PermissionToggle label="Can Edit Document" checked={getPermissionValue(role.name, 'documents.canEdit')} onChange={(val) => handlePermissionChange(role.name, 'documents.canEdit', val)} />
        </PermissionGroup>

        {/* Settings */}
        <PermissionGroup title="Settings">
          <PermissionToggle label="Can View Settings" checked={getPermissionValue(role.name, 'settings.canView')} onChange={(val) => handlePermissionChange(role.name, 'settings.canView', val)} />
          <PermissionToggle label="Can Edit Settings" checked={getPermissionValue(role.name, 'settings.canEdit')} onChange={(val) => handlePermissionChange(role.name, 'settings.canEdit', val)} />
        </PermissionGroup>

        {/* AI Chat */}
        <PermissionGroup title="AI Chat">
          <PermissionToggle label="Can View AI Chat" checked={getPermissionValue(role.name, 'aiChat.canView')} onChange={(val) => handlePermissionChange(role.name, 'aiChat.canView', val)} />
          <PermissionToggle label="Can Use AI Chat" checked={getPermissionValue(role.name, 'aiChat.canUse')} onChange={(val) => handlePermissionChange(role.name, 'aiChat.canUse', val)} />
          <div className="ml-4 space-y-2 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Allowed AI Models:</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Leave all unchecked to allow all models</p>
            {availableModels.map((model) => (
              <PermissionToggle
                key={model.id}
                label={model.name}
                checked={permissions?.aiChat?.allowedModels?.includes(model.id)}
                onChange={() => handleModelToggle(role.name, model.id)}
                small
              />
            ))}
          </div>
        </PermissionGroup>

        {/* Access Control - Roles */}
        <PermissionGroup title="Roles Management">
          <PermissionToggle label="Can View Roles" checked={getPermissionValue(role.name, 'roles.canView')} onChange={(val) => handlePermissionChange(role.name, 'roles.canView', val)} />
          <PermissionToggle label="Can Create Role" checked={getPermissionValue(role.name, 'roles.canCreate')} onChange={(val) => handlePermissionChange(role.name, 'roles.canCreate', val)} />
          <PermissionToggle label="Can Edit Role" checked={getPermissionValue(role.name, 'roles.canEdit')} onChange={(val) => handlePermissionChange(role.name, 'roles.canEdit', val)} />
          <PermissionToggle label="Can Delete Role" checked={getPermissionValue(role.name, 'roles.canDelete')} onChange={(val) => handlePermissionChange(role.name, 'roles.canDelete', val)} />
        </PermissionGroup>

        {/* Access Control - Permissions */}
        <PermissionGroup title="Permissions Management">
          <PermissionToggle label="Can View Permissions" checked={getPermissionValue(role.name, 'permissions.canView')} onChange={(val) => handlePermissionChange(role.name, 'permissions.canView', val)} />
          <PermissionToggle label="Can Assign Permissions" checked={getPermissionValue(role.name, 'permissions.canAssign')} onChange={(val) => handlePermissionChange(role.name, 'permissions.canAssign', val)} />
          <PermissionToggle label="Can Reset to Defaults" checked={getPermissionValue(role.name, 'permissions.canResetDefaults')} onChange={(val) => handlePermissionChange(role.name, 'permissions.canResetDefaults', val)} />
        </PermissionGroup>

        {/* Notifications */}
        <PermissionGroup title="Notifications">
          <PermissionToggle label="Can Receive Notifications" checked={getPermissionValue(role.name, 'notifications.canReceiveNotif')} onChange={(val) => handlePermissionChange(role.name, 'notifications.canReceiveNotif', val)} />
        </PermissionGroup>
      </div>
    </div>
  )
}

const PermissionGroup = ({ title, children }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
)

const PermissionToggle = ({ label, checked, onChange, small = false }) => (
  <label className={`flex items-center justify-between cursor-pointer ${small ? 'py-1' : 'py-1.5'}`}>
    <span className={`${small ? 'text-sm' : 'text-sm'} text-gray-700 dark:text-gray-300`}>
      {label}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
    />
  </label>
)

export default Permissions
