import { useState, useEffect, useRef } from 'react'
import { 
  Container, 
  Image, 
  PlayCircle, 
  StopCircle, 
  RotateCw, 
  Trash2, 
  RefreshCw,
  Server,
  HardDrive,
  Cpu,
  Activity,
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Network,
  Layers,
  Wifi,
  WifiOff,
  Search,
  Info,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  Plus,
  Square,
  CheckSquare
} from 'lucide-react'
import { io } from 'socket.io-client'
import * as dockerService from '../services/docker'
import * as dockerLogsService from '../services/dockerLogs'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import NotificationContainer from '../components/NotificationContainer'
import SkeletonWidget from '../components/SkeletonWidget'
import SkeletonTable from '../components/SkeletonTable'
import CreateContainerForm from '../components/docker/CreateContainerForm'
import DockerTerminal from '../components/DockerTerminal'
import useWebSocket from '../hooks/useWebSocket'
import PasswordPrompt from '../components/PasswordPrompt'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3060'

export default function Docker() {
  const [activeTab, setActiveTab] = useState('containers')
  const [containers, setContainers] = useState([])
  const [images, setImages] = useState([])
  const [stats, setStats] = useState([])
  const [systemInfo, setSystemInfo] = useState(null)
  const [diskUsage, setDiskUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [widgetsLoading, setWidgetsLoading] = useState(true) // Separate loading state for widgets
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null })
  const [logsModal, setLogsModal] = useState({ show: false, logs: '', bashHistory: '', containerName: '', activeTab: 'logs' })
  const [detailsModal, setDetailsModal] = useState({ show: false, container: null, containerStats: null })
  const [historyModal, setHistoryModal] = useState({ show: false, container: null, history: [] })
  const [socketConnected, setSocketConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [monitoringInterval, setMonitoringInterval] = useState(5000)
  const hasReceivedInitialData = useRef(false) // Track if we've received initial data
  const [searchQuery, setSearchQuery] = useState('') // Search filter for containers
  const [cpuSortOrder, setCpuSortOrder] = useState(null) // null, 'asc', 'desc'
  const [memorySortOrder, setMemorySortOrder] = useState(null) // null, 'asc', 'desc'
  const [containerActionLogs, setContainerActionLogs] = useState({}) // Store action logs per container
  const [showCreateForm, setShowCreateForm] = useState(false) // Show create container form
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false) // Enable selection mode on long press
  const [selectedContainers, setSelectedContainers] = useState([]) // Array of selected container IDs
  const longPressTimer = useRef(null)
  const longPressDelay = 500 // 500ms for long press
  
  // Terminal state
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalContainer, setTerminalContainer] = useState(null)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [pendingTerminal, setPendingTerminal] = useState(null)
  const { socket } = useWebSocket()

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true)
      const [containersRes, imagesRes, logsRes] = await Promise.all([
        dockerService.getAllContainers(),
        dockerService.getAllImages(),
        dockerLogsService.getAllContainerLogs()
      ])
      
      setContainers(containersRes.data || [])
      setImages(imagesRes.data || [])
      
      // Group logs by container ID (both short and full)
      // console.log(logsRes);
      
      const logsData = logsRes || []
      const logsByContainer = {}
      logsData.forEach(log => {
        // Store by targetId
        if (!logsByContainer[log.targetId]) {
          logsByContainer[log.targetId] = []
        }
        logsByContainer[log.targetId].push(log)
        
        // Also store by targetName for fallback matching
        if (log.targetName && !logsByContainer[log.targetName]) {
          logsByContainer[log.targetName] = []
        }
        if (log.targetName) {
          logsByContainer[log.targetName].push(log)
        }
      })
      // console.log('Container action logs grouped:', Object.keys(logsByContainer))
      setContainerActionLogs(logsByContainer)
    } catch (error) {
      showToast(error.message || 'Failed to load Docker data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load system info separately (for initial load only)
  const loadSystemInfo = async () => {
    try {
      setWidgetsLoading(true)
      const systemRes = await dockerService.getSystemInfo()
      setSystemInfo(systemRes.data || null)
      hasReceivedInitialData.current = true
    } catch (error) {
    } finally {
      setWidgetsLoading(false)
    }
  }

  // Setup WebSocket connection
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      setSocketConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      setSocketConnected(false)
    })

    socketRef.current.on('connected', (data) => {
    })

    socketRef.current.on('dockerStats', (data) => {
      setStats(data.stats || [])
      
      // Update systemInfo without causing full re-render
      if (data.systemInfo) {
        setSystemInfo(data.systemInfo)
        
        // Mark that we've received initial data and turn off loading
        if (!hasReceivedInitialData.current) {
          hasReceivedInitialData.current = true
          setWidgetsLoading(false)
        }
      }
    })

    socketRef.current.on('dockerAlert', (alert) => {
      addNotification(alert)
    })

    socketRef.current.on('dockerError', (error) => {
      showToast(error.message || 'Docker monitoring error', 'error')
    })

    // Load initial data from REST API
    loadData()
    loadSystemInfo()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('stopDockerMonitoring')
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Start WebSocket monitoring automatically when connected
  useEffect(() => {
    if (!socketRef.current || !socketConnected) return

    if (isMonitoring) {
      socketRef.current.emit('startDockerMonitoring', monitoringInterval)
    } else {
      socketRef.current.emit('stopDockerMonitoring')
    }
  }, [isMonitoring, socketConnected, monitoringInterval])

  // Add notification
  const addNotification = (alert) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: alert.type,
      message: alert.message,
      recommendation: alert.recommendation,
      value: alert.value,
      threshold: alert.threshold,
      category: alert.category,
      timestamp: alert.timestamp,
    }
    
    setNotifications(prev => [notification, ...prev].slice(0, 5)) // Keep only last 5
  }

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ show: true, title, message, onConfirm })
  }

  // Container actions
  const handleStartContainer = async (containerId, containerName) => {
    try {
      await dockerService.startContainer(containerId)
      showToast(`Container ${containerName} started successfully`)
      // Don't call loadData - WebSocket will update stats automatically
      // Only refresh containers list
      const containersRes = await dockerService.getAllContainers()
      setContainers(containersRes.data || [])
    } catch (error) {
      showToast(error.message || 'Failed to start container', 'error')
    }
  }

  const handleStopContainer = async (containerId, containerName) => {
    showConfirm(
      'Stop Container',
      `Are you sure you want to stop container "${containerName}"?`,
      async () => {
        try {
          await dockerService.stopContainer(containerId)
          showToast(`Container ${containerName} stopped successfully`)
          // Only refresh containers list
          const containersRes = await dockerService.getAllContainers()
          setContainers(containersRes.data || [])
        } catch (error) {
          showToast(error.message || 'Failed to stop container', 'error')
        }
      }
    )
  }

  const handleRestartContainer = async (containerId, containerName) => {
    showConfirm(
      'Restart Container',
      `Are you sure you want to restart container "${containerName}"?`,
      async () => {
        try {
          await dockerService.restartContainer(containerId)
          showToast(`Container ${containerName} restarted successfully`)
          // Only refresh containers list
          const containersRes = await dockerService.getAllContainers()
          setContainers(containersRes.data || [])
        } catch (error) {
          showToast(error.message || 'Failed to restart container', 'error')
        }
      }
    )
  }

  const handleRecreateContainer = async (containerId, containerName) => {
    showConfirm(
      'Recreate Container',
      `Are you sure you want to recreate container "${containerName}"? This will stop, remove, and rebuild the container with the same image.`,
      async () => {
        try {
          await dockerService.recreateContainer(containerId)
          showToast(`Container ${containerName} recreated successfully`)
          // Refresh containers list after recreation
          setTimeout(async () => {
            const containersRes = await dockerService.getAllContainers()
            setContainers(containersRes.data || [])
          }, 2000) // Wait 2 seconds for container to be recreated
        } catch (error) {
          showToast(error.message || 'Failed to recreate container', 'error')
        }
      }
    )
  }

  // Handle complete deletion of container with volumes
  const handleDeleteContainerCompletely = (containerId, containerName) => {
    showConfirm(
      '⚠️ Completely Delete Container',
      `Are you sure you want to COMPLETELY DELETE "${containerName}"?\n\nThis will permanently remove:\n• Container\n• All volumes and data\n• Docker image\n• Directory files\n• docker-compose.yml entry\n• Server record from database\n\n⚠️ THIS CANNOT BE UNDONE!`,
      async () => {
        try {
          await dockerService.deleteContainerCompletely(containerId)
          showToast(`Container ${containerName} and all data deleted successfully`, 'success')
          loadData()
        } catch (error) {
          showToast(error.message || 'Failed to delete container completely', 'error')
        }
      }
    )
  }

  // Handle open terminal
  const handleOpenTerminal = (container) => {
    if (!socket || !socket.connected) {
      showToast('WebSocket not connected. Please refresh the page.', 'error')
      return
    }
    
    // Try to extract SSH port from container ports
    // Format: "0.0.0.0:2011->22/tcp, 0.0.0.0:5833->3000/tcp"
    let sshPort = null
    
    if (container.ports) {
      const portMatch = container.ports.match(/0\.0\.0\.0:(\d+)->22\/tcp/)
      if (portMatch) {
        sshPort = parseInt(portMatch[1])
      }
    }
    
    // Always show prompt to choose connection method
    setPendingTerminal({
      id: container.id,
      name: container.name,
      sshPort: sshPort,
      sshConfig: {
        host: 'localhost', // Use localhost for direct connection
        port: sshPort || 22,
        username: 'root',
        password: ''
      }
    })
    setShowPasswordPrompt(true)
  }

  // Handle password submit
  const handlePasswordSubmit = (password, useCloudflared = false, customHost = '', username = 'root') => {
    if (pendingTerminal) {
      // If not using cloudflared
      if (!useCloudflared) {
        // If SSH port is available, use direct SSH to localhost
        if (pendingTerminal.sshPort) {
          setTerminalContainer({
            id: pendingTerminal.id,
            name: pendingTerminal.name,
            sshConfig: {
              host: 'localhost',
              port: pendingTerminal.sshPort,
              username: username,
              password: password,
              useCloudflared: false
            }
          })
        } else {
          // No SSH port, use docker exec
          setTerminalContainer({
            id: pendingTerminal.id,
            name: pendingTerminal.name,
            sshConfig: null
          })
        }
      } else {
        // Use SSH with cloudflared
        pendingTerminal.sshConfig.password = password
        pendingTerminal.sshConfig.useCloudflared = useCloudflared
        pendingTerminal.sshConfig.username = username
        
        // Use custom host if provided
        if (customHost && customHost.trim()) {
          pendingTerminal.sshConfig.host = customHost.trim()
        }
        
        setTerminalContainer(pendingTerminal)
      }
      
      setTerminalOpen(true)
    }
    setShowPasswordPrompt(false)
    setPendingTerminal(null)
  }

  // Handle password cancel
  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false)
    setPendingTerminal(null)
  }

  // Handle close terminal
  const handleCloseTerminal = () => {
    setTerminalOpen(false)
    setTerminalContainer(null)
  }

  // Long press handlers for multi-select
  const handleMouseDown = (containerId) => {
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true)
      setSelectedContainers([containerId])
    }, longPressDelay)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  // Toggle container selection
  const toggleContainerSelection = (containerId) => {
    if (!selectionMode) return
    
    setSelectedContainers(prev => {
      if (prev.includes(containerId)) {
        return prev.filter(id => id !== containerId)
      } else {
        return [...prev, containerId]
      }
    })
  }

  // Select all containers
  const handleSelectAll = () => {
    if (selectedContainers.length === filteredContainers.length) {
      setSelectedContainers([])
    } else {
      setSelectedContainers(filteredContainers.map(c => c.id))
    }
  }

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedContainers([])
  }

  // Bulk stop containers
  const handleBulkStop = async () => {
    showConfirm(
      'Stop Selected Containers',
      `Are you sure you want to stop ${selectedContainers.length} selected container(s)?`,
      async () => {
        let successCount = 0
        let errorCount = 0
        
        for (const containerId of selectedContainers) {
          try {
            await dockerService.stopContainer(containerId)
            successCount++
          } catch (error) {
            errorCount++
          }
        }
        
        showToast(`Stopped ${successCount} container(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, errorCount > 0 ? 'warning' : 'success')
        exitSelectionMode()
        loadData()
      }
    )
  }

  // Bulk restart containers
  const handleBulkRestart = async () => {
    showConfirm(
      'Restart Selected Containers',
      `Are you sure you want to restart ${selectedContainers.length} selected container(s)?`,
      async () => {
        let successCount = 0
        let errorCount = 0
        
        for (const containerId of selectedContainers) {
          try {
            await dockerService.restartContainer(containerId)
            successCount++
          } catch (error) {
            errorCount++
          }
        }
        
        showToast(`Restarted ${successCount} container(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, errorCount > 0 ? 'warning' : 'success')
        exitSelectionMode()
        loadData()
      }
    )
  }

  // Bulk recreate containers
  const handleBulkRecreate = async () => {
    showConfirm(
      'Recreate Selected Containers',
      `Are you sure you want to recreate ${selectedContainers.length} selected container(s)? This will stop, remove, and rebuild them.`,
      async () => {
        let successCount = 0
        let errorCount = 0
        
        for (const containerId of selectedContainers) {
          try {
            await dockerService.recreateContainer(containerId)
            successCount++
          } catch (error) {
            errorCount++
          }
        }
        
        showToast(`Recreated ${successCount} container(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, errorCount > 0 ? 'warning' : 'success')
        exitSelectionMode()
        setTimeout(() => loadData(), 2000)
      }
    )
  }

  // Bulk delete containers completely
  const handleBulkDelete = async () => {
    showConfirm(
      '⚠️ Completely Delete Selected Containers',
      `Are you sure you want to COMPLETELY DELETE ${selectedContainers.length} selected container(s)?\n\nThis will permanently remove:\n• Containers\n• All volumes and data\n• Docker images\n• Directory files\n• docker-compose.yml entries\n• Server records from database\n\n⚠️ THIS CANNOT BE UNDONE!`,
      async () => {
        let successCount = 0
        let errorCount = 0
        
        for (const containerId of selectedContainers) {
          try {
            await dockerService.deleteContainerCompletely(containerId)
            successCount++
          } catch (error) {
            errorCount++
          }
        }
        
        showToast(`Deleted ${successCount} container(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, errorCount > 0 ? 'warning' : 'success')
        exitSelectionMode()
        loadData()
      }
    )
  }

  const handleViewLogs = async (containerId, containerName) => {
    try {
      const [logsResponse, bashHistoryResponse] = await Promise.all([
        dockerService.getContainerLogs(containerId, 500),
        dockerService.getContainerBashHistory(containerId).catch(() => ({ data: 'Bash history not available for this container' }))
      ])
      
      setLogsModal({ 
        show: true, 
        logs: logsResponse.data || '', 
        bashHistory: bashHistoryResponse.data || 'Bash history not available',
        containerName,
        activeTab: 'bash'
      })
    } catch (error) {
      showToast(error.message || 'Failed to fetch logs', 'error')
    }
  }

  // Image actions
  const handleRemoveImage = async (imageId, imageName) => {
    showConfirm(
      'Remove Image',
      `Are you sure you want to remove image "${imageName}"?`,
      async () => {
        try {
          await dockerService.removeImage(imageId, true)
          showToast(`Image ${imageName} removed successfully`)
          // Only refresh images list
          const imagesRes = await dockerService.getAllImages()
          setImages(imagesRes.data || [])
        } catch (error) {
          showToast(error.message || 'Failed to remove image', 'error')
        }
      }
    )
  }

  const handlePruneImages = () => {
    showConfirm(
      'Prune Unused Images',
      'This will remove all dangling (unused) images. Continue?',
      async () => {
        try {
          const response = await dockerService.pruneImages()
          showToast(response.message || 'Unused images pruned successfully')
          // Only refresh images list
          const imagesRes = await dockerService.getAllImages()
          setImages(imagesRes.data || [])
        } catch (error) {
          showToast(error.message || 'Failed to prune images', 'error')
        }
      }
    )
  }

  // Get container status badge with better color coding
  const getStatusBadge = (state) => {
    const states = {
      running: { color: 'bg-green-500 text-white', icon: CheckCircle },
      exited: { color: 'bg-red-500 text-white', icon: XCircle },
      stopped: { color: 'bg-red-500 text-white', icon: XCircle },
      paused: { color: 'bg-yellow-500 text-white', icon: Clock },
      created: { color: 'bg-blue-500 text-white', icon: Clock },
      restarting: { color: 'bg-orange-500 text-white', icon: RotateCw },
    }
    
    const status = states[state.toLowerCase()] || states.created
    const Icon = status.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
        <Icon className="w-3 h-3" />
        {state}
      </span>
    )
  }

  // Get stats for a specific container
  const getContainerStats = (containerId) => {
    // Match by comparing first 12 characters of container ID with stat ID
    const shortId = containerId.substring(0, 12)
    return stats.find(s => {
      if (!s || !s.id) return false
      // Stats ID is already shortened to 12 chars, so compare directly
      return s.id === shortId || shortId.startsWith(s.id) || s.id.startsWith(shortId)
    }) || null
  }

  // Clean up port display - remove IPs and duplicates
  const formatPorts = (portsString) => {
    if (!portsString || portsString === 'None') return 'None'
    
    // Split by comma and process each port mapping
    const portMappings = portsString.split(',').map(p => p.trim())
    const uniquePorts = new Set()
    
    portMappings.forEach(mapping => {
      // Extract port mapping like "0.0.0.0:8080->80/tcp" or "[::]:8080->80/tcp"
      // We want just "8080->80"
      const match = mapping.match(/(\d+)->(\d+)/)
      if (match) {
        uniquePorts.add(`${match[1]}->${match[2]}`)
      }
    })
    
    return uniquePorts.size > 0 ? Array.from(uniquePorts).join(', ') : 'None'
  }

  // Filter containers based on search query
  const filteredContainers = containers.filter(container => 
    container.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Sort containers
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    // If CPU sorting is active
    if (cpuSortOrder) {
      const aStats = getContainerStats(a.id)
      const bStats = getContainerStats(b.id)
      const aCpu = aStats?.cpuPerc || 0
      const bCpu = bStats?.cpuPerc || 0
      
      if (cpuSortOrder === 'asc') {
        return aCpu - bCpu
      } else {
        return bCpu - aCpu
      }
    }
    
    // If Memory sorting is active
    if (memorySortOrder) {
      const aStats = getContainerStats(a.id)
      const bStats = getContainerStats(b.id)
      const aMem = aStats?.memPerc || 0
      const bMem = bStats?.memPerc || 0
      
      if (memorySortOrder === 'asc') {
        return aMem - bMem
      } else {
        return bMem - aMem
      }
    }
    
    // Default: sort by image name (ascending)
    return a.image.localeCompare(b.image)
  })
  
  // Handle CPU sort toggle
  const handleCpuSort = () => {
    setMemorySortOrder(null) // Clear memory sort
    if (cpuSortOrder === null) {
      setCpuSortOrder('asc')
    } else if (cpuSortOrder === 'asc') {
      setCpuSortOrder('desc')
    } else {
      setCpuSortOrder(null)
    }
  }
  
  // Handle Memory sort toggle
  const handleMemorySort = () => {
    setCpuSortOrder(null) // Clear CPU sort
    if (memorySortOrder === null) {
      setMemorySortOrder('asc')
    } else if (memorySortOrder === 'asc') {
      setMemorySortOrder('desc')
    } else {
      setMemorySortOrder(null)
    }
  }

  // Filter images based on search query
  const filteredImages = images.filter(image => 
    image.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle view details
  const handleViewDetails = async (container) => {
    const containerStats = getContainerStats(container.id)
    try {
      const inspectData = await dockerService.inspectContainer(container.id)
      setDetailsModal({ 
        show: true, 
        container: { ...container, inspect: inspectData.data },
        containerStats 
      })
    } catch (error) {
      showToast(error.message || 'Failed to fetch container details', 'error')
    }
  }

  // Handle view action history
  const handleViewHistory = (container) => {
    // Get action history for this container from containerActionLogs
    const shortId = container.id.substring(0, 12)
    let history = containerActionLogs[container.id] || []
    
    // If no history with full ID, try short ID
    if (history.length === 0) {
      history = containerActionLogs[shortId] || []
    }
    
    // If still no history, search through all logs
    if (history.length === 0) {
      const allLogs = Object.values(containerActionLogs).flat()
      history = allLogs.filter(log => 
        log.targetId === container.id || 
        log.targetId === shortId ||
        container.id.startsWith(log.targetId) ||
        log.targetId.startsWith(shortId) ||
        log.targetName === container.name
      )
    }
    
    setHistoryModal({
      show: true,
      container,
      history
    })
  }

  // Get last action date for a container
  const getLastActionDate = (containerId, action) => {
    // Try to find logs by full ID or short ID (first 12 chars)
    const shortId = containerId.substring(0, 12)
    let logs = containerActionLogs[containerId] || []
    
    // If no logs found with full ID, try with short ID
    if (logs.length === 0) {
      logs = containerActionLogs[shortId] || []
    }
    
    // If still no logs, search through all logs for matching IDs
    if (logs.length === 0) {
      const allLogs = Object.values(containerActionLogs).flat()
      logs = allLogs.filter(log => 
        log.targetId === containerId || 
        log.targetId === shortId ||
        containerId.startsWith(log.targetId) ||
        log.targetId.startsWith(shortId)
      )
    }
    
    const actionLogs = logs.filter(log => log.action === action && log.success)
    if (actionLogs.length === 0) return null
    
    // Get the most recent
    const latest = actionLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const date = new Date(latest.createdAt)
    
    // Format: Jan. 2, 2026 10:07:21 PM
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Widgets Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonWidget />
          <SkeletonWidget />
          <SkeletonWidget />
          <SkeletonWidget />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          </div>
          <SkeletonTable rows={5} columns={9} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Container className="w-7 h-7" />
            Docker Monitor
            {socketConnected ? (
              <Wifi className="w-5 h-5 text-green-500" title="WebSocket Connected" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" title="WebSocket Disconnected" />
            )}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage Docker containers and images {socketConnected && '• Live updates via WebSocket'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Refresh containers and images list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgetsLoading ? (
          // Show skeleton loaders while loading
          <>
            <SkeletonWidget />
            <SkeletonWidget />
            <SkeletonWidget />
            <SkeletonWidget />
          </>
        ) : systemInfo ? (
          <>
            {/* Total Containers Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Containers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300">
                    {systemInfo.containers?.total || containers.length}
                  </p>
                </div>
                <Container className="w-10 h-10 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="text-green-600 dark:text-green-400 transition-all duration-300">
                  ● {systemInfo.containers?.running || containers.filter(c => c.state.toLowerCase() === 'running').length} Running
                </span>
                <span className="text-red-600 dark:text-red-400 transition-all duration-300">
                  ● {systemInfo.containers?.stopped || containers.filter(c => c.state.toLowerCase() !== 'running').length} Stopped
                </span>
              </div>
            </div>

            {/* Total Images Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Images</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300">
                    {systemInfo.images || 0}
                  </p>
                </div>
                <Image className="w-10 h-10 text-purple-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{systemInfo.serverVersion}</p>
              </div>
            </div>

            {/* CPU Cores Widget - HOST SYSTEM */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage (Host)</p>
                  {systemInfo.cpu?.host ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300">
                        {systemInfo.cpu.host.usage}% / {systemInfo.cpu.host.cores} Cores
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({systemInfo.cpu.host.percentage}% Used)
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {systemInfo.cpus || 0} Cores
                    </p>
                  )}
                </div>
                <Cpu className="w-10 h-10 text-orange-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{systemInfo.architecture || 'Ubuntu System'}</p>
              </div>
            </div>

            {/* Memory Widget - HOST SYSTEM */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory (Host)</p>
                  {systemInfo.memory?.host ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-all duration-300">
                        {systemInfo.memory.host.usedGB}GB/{systemInfo.memory.host.totalGB}GB
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({systemInfo.memory.host.percentage}%)
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {systemInfo.memory?.totalGB ? `${systemInfo.memory.totalGB} GB` : 'N/A'}
                    </p>
                  )}
                </div>
                <Database className="w-10 h-10 text-green-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{systemInfo.operatingSystem || 'Ubuntu'}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'containers', label: 'Containers', icon: Container },
              { id: 'images', label: 'Images', icon: Image },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Containers Tab */}
          {activeTab === 'containers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Containers ({filteredContainers.length})
                  {selectionMode && (
                    <span className="ml-3 text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({selectedContainers.length} selected)
                    </span>
                  )}
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search Bar */}
                  {!selectionMode && (
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search containers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* Create Container Button */}
                  {!selectionMode && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="whitespace-nowrap">Create Container</span>
                    </button>
                  )}
                  
                  {/* Bulk Action Buttons */}
                  {selectionMode && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleBulkStop}
                        disabled={selectedContainers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Stop Selected"
                      >
                        <StopCircle className="w-4 h-4" />
                        Stop ({selectedContainers.length})
                      </button>
                      <button
                        onClick={handleBulkRestart}
                        disabled={selectedContainers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Restart Selected"
                      >
                        <RotateCw className="w-4 h-4" />
                        Restart ({selectedContainers.length})
                      </button>
                      <button
                        onClick={handleBulkRecreate}
                        disabled={selectedContainers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Recreate Selected"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Recreate ({selectedContainers.length})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={selectedContainers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Selected Completely"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedContainers.length})
                      </button>
                      <button
                        onClick={exitSelectionMode}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        title="Cancel Selection"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {/* Checkbox column for selection mode */}
                      {selectionMode && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title={selectedContainers.length === filteredContainers.length ? "Deselect All" : "Select All"}
                          >
                            {selectedContainers.length === filteredContainers.length ? (
                              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </th>
                      )}
                      
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ports</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Restarted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Stopped</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        <button
                          onClick={handleCpuSort}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          CPU Usage
                          {cpuSortOrder === null && <ArrowUpDown className="w-3 h-3" />}
                          {cpuSortOrder === 'asc' && <ArrowUp className="w-3 h-3 text-blue-500" />}
                          {cpuSortOrder === 'desc' && <ArrowDown className="w-3 h-3 text-blue-500" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        <button
                          onClick={handleMemorySort}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          Memory Usage
                          {memorySortOrder === null && <ArrowUpDown className="w-3 h-3" />}
                          {memorySortOrder === 'asc' && <ArrowUp className="w-3 h-3 text-green-500" />}
                          {memorySortOrder === 'desc' && <ArrowDown className="w-3 h-3 text-green-500" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Network I/O</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedContainers.map((container) => {
                      const containerStats = getContainerStats(container.id)
                      const isSelected = selectedContainers.includes(container.id)
                      
                      return (
                        <tr 
                          key={container.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onMouseDown={() => !selectionMode && handleMouseDown(container.id)}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => selectionMode && toggleContainerSelection(container.id)}
                          style={{ cursor: selectionMode ? 'pointer' : 'default' }}
                        >
                          {/* Checkbox column */}
                          {selectionMode && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleContainerSelection(container.id)
                                }}
                                className="flex items-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </td>
                          )}
                          
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{container.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{container.id.substring(0, 12)}</div>
                          </td>
                        
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(container.state)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                              {formatPorts(container.ports)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getLastActionDate(container.id, 'restart') || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getLastActionDate(container.id, 'stop') || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {containerStats && !containerStats.error ? (
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white transition-all duration-300">
                                  {typeof containerStats.cpuPerc === 'number' ? containerStats.cpuPerc.toFixed(1) : '0.0'}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {containerStats && !containerStats.error ? (
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white transition-all duration-300">
                                  {typeof containerStats.memPerc === 'number' ? containerStats.memPerc.toFixed(1) : '0.0'}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {containerStats && !containerStats.error ? (
                              <div className="flex items-center gap-2">
                                <Network className="w-4 h-4 text-purple-500" />
                                <span className="text-xs text-gray-700 dark:text-gray-300">{containerStats.netIO}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-1">
                              {container.state.toLowerCase() === 'running' ? (
                                <>
                                  <button
                                    onClick={() => handleStopContainer(container.id, container.name)}
                                    className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Stop"
                                  >
                                    <StopCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRestartContainer(container.id, container.name)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Restart"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleStartContainer(container.id, container.name)}
                                  className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                  title="Start"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(container)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewHistory(container)}
                                className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                title="View Action History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewLogs(container.id, container.name)}
                                className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="View Logs"
                              >
                                <Terminal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenTerminal(container)}
                                className="p-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors"
                                title="Open Terminal (SSH or Docker Exec)"
                                disabled={container.state.toLowerCase() !== 'running'}
                              >
                                <Terminal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRecreateContainer(container.id, container.name)}
                                className="p-1.5 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                title="Recreate Container"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContainerCompletely(container.id, container.name)}
                                className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Delete Completely (with volumes)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredContainers.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Container className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{searchQuery ? 'No containers match your search' : 'No containers found'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Docker Images ({filteredImages.length})
                </h2>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={handlePruneImages}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Prune
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Repository</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tag</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Image ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredImages.map((image) => (
                      <tr key={image.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{image.repository}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{image.tag}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{image.id.substring(0, 12)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{image.size}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{image.created}</td>
                        {/* <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRemoveImage(image.id, `${image.repository}:${image.tag}`)}
                            className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredImages.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{searchQuery ? 'No images match your search' : 'No images found'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          isOpen={confirmDialog.show}
          onClose={() => setConfirmDialog({ ...confirmDialog, show: false })}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.onConfirm()
            setConfirmDialog({ ...confirmDialog, show: false })
          }}
        />
      )}

      {/* Logs Modal */}
      {logsModal.show && (
        <Modal
          isOpen={logsModal.show}
          onClose={() => setLogsModal({ ...logsModal, show: false })}
          title={`Container: ${logsModal.containerName}`}
        >
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="flex -mb-px">
              <button
                onClick={() => setLogsModal({ ...logsModal, activeTab: 'bash' })}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  logsModal.activeTab === 'bash'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Bash History
                </div>
              </button>
              <button
                onClick={() => setLogsModal({ ...logsModal, activeTab: 'logs' })}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  logsModal.activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Container Logs
                </div>
              </button>
              
            </nav>
          </div>

          {/* Container Logs Tab */}
          {logsModal.activeTab === 'logs' && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap">{logsModal.logs || 'No logs available'}</pre>
            </div>
          )}

          {/* Bash History Tab */}
          {logsModal.activeTab === 'bash' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📜</div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      Bash Command History
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Monitor what commands students are running inside their containers. 
                      This shows all bash commands executed in chronological order.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 border border-gray-700 shadow-inner">
                <pre className="whitespace-pre leading-relaxed">{logsModal.bashHistory || 'Bash history not available for this container'}</pre>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Action History Modal */}
      {historyModal.show && (
        <Modal
          isOpen={historyModal.show}
          onClose={() => setHistoryModal({ show: false, container: null, history: [] })}
          title={`Action History: ${historyModal.container?.name || 'Container'}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {historyModal.history.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No action history yet</p>
                <p className="text-sm mt-1">Actions will be logged when you stop, start, restart, or remove this container</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {historyModal.history.filter(h => h.action === 'start').length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Started</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {historyModal.history.filter(h => h.action === 'stop').length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Stopped</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {historyModal.history.filter(h => h.action === 'restart').length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Restarted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {historyModal.history.filter(h => h.action === 'remove').length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Removed</p>
                    </div>
                  </div>
                </div>

                {/* Action List */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Action Log</h3>
                  <div className="space-y-2">
                    {historyModal.history
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${
                              log.action === 'start' ? 'bg-green-100 dark:bg-green-900/30' :
                              log.action === 'stop' ? 'bg-red-100 dark:bg-red-900/30' :
                              log.action === 'restart' ? 'bg-blue-100 dark:bg-blue-900/30' :
                              'bg-orange-100 dark:bg-orange-900/30'
                            }`}>
                              {log.action === 'start' && <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                              {log.action === 'stop' && <StopCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                              {log.action === 'restart' && <RotateCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                              {log.action === 'remove' && <Trash2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {log.action}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            {log.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryModal({ show: false, container: null, history: [] })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Container Details Modal */}
      {detailsModal.show && detailsModal.container && (
        <Modal
          isOpen={detailsModal.show}
          onClose={() => setDetailsModal({ show: false, container: null, containerStats: null })}
          title={`Container Details: ${detailsModal.container.name}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Container ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{detailsModal.container.id.substring(0, 12)}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(detailsModal.container.state)}</div>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Image</p>
                  <p className="font-medium text-gray-900 dark:text-white break-all">{detailsModal.container.image}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">{detailsModal.container.status}</p>
                </div>
                {detailsModal.container.ports && (
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-gray-400">Ports</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPorts(detailsModal.container.ports)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats (Realtime) */}
            {detailsModal.containerStats && !detailsModal.containerStats.error && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Resource Usage (Realtime)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <Cpu className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">CPU Usage</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white transition-all duration-300">
                        {typeof detailsModal.containerStats.cpuPerc === 'number' ? detailsModal.containerStats.cpuPerc.toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <Database className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Memory Usage</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white transition-all duration-300">
                        {typeof detailsModal.containerStats.memPerc === 'number' ? detailsModal.containerStats.memPerc.toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{detailsModal.containerStats.memUsage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                      <Network className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Network I/O</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{detailsModal.containerStats.netIO}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <HardDrive className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Block I/O</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{detailsModal.containerStats.blockIO}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inspect Data */}
            {detailsModal.container.inspect && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  {detailsModal.container.inspect.HostConfig?.Memory && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Memory Limit</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {detailsModal.container.inspect.HostConfig.Memory > 0 
                          ? `${(detailsModal.container.inspect.HostConfig.Memory / (1024**3)).toFixed(2)} GB` 
                          : 'No limit'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              
              <button
                onClick={() => setDetailsModal({ show: false, container: null, containerStats: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Container Form Modal */}
      {showCreateForm && (
        <CreateContainerForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={(message) => {
            showToast(message, 'success')
            loadData() // Reload containers list
          }}
        />
      )}

      {/* Password Prompt for SSH */}
      {showPasswordPrompt && pendingTerminal && (
        <PasswordPrompt
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
          title="Terminal Connection"
          message="Choose connection method"
          showCloudflaredOption={true}
          defaultHost={pendingTerminal.sshConfig?.host || ''}
          sshPort={pendingTerminal.sshPort}
        />
      )}

      {/* Docker Terminal Modal */}
      {terminalOpen && terminalContainer && socket && (
        <DockerTerminal
          containerId={terminalContainer.id}
          containerName={terminalContainer.name}
          onClose={handleCloseTerminal}
          socket={socket}
          sshConfig={terminalContainer.sshConfig}
        />
      )}
    </div>
  )
}
