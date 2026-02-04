import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import 'xterm/css/xterm.css'

export default function DockerTerminal({ containerId, containerName, onClose, socket, sshConfig = null }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [error, setError] = useState(null)
  
  // Draggable state
  const modalRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })
  
  // Resizable state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState(null)
  const [size, setSize] = useState({ width: 1200, height: 600 })
  const resizeStartPos = useRef({ x: 0, y: 0 })
  const resizeStartSize = useRef({ width: 0, height: 0 })

  useEffect(() => {
    if (!terminalRef.current || !socket) return

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      rows: 24,
      cols: 80
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    // Open terminal
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Display welcome message
    term.writeln('\x1b[1;32m╔═══════════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[1;32m║              Terminal sa amo.a!               ║\x1b[0m')
    term.writeln('\x1b[1;32m╚═══════════════════════════════════════════════╝\x1b[0m')
    term.writeln(`\x1b[1;36mContainer:\x1b[0m ${containerName}`)
    term.writeln(`\x1b[1;36mContainer ID:\x1b[0m ${containerId}`)
    term.writeln('\x1b[1;33mConnecting...\x1b[0m\r\n')

    // Request connection - SSH or Docker exec
    if (sshConfig) {
      const connStr = sshConfig.useCloudflared 
        ? `${sshConfig.username}@${sshConfig.host} (cloudflared)`
        : `${sshConfig.username}@${sshConfig.host}:${sshConfig.port}`
      // term.writeln(`\x1b[1;36mMode:\x1b[0m SSH (${connStr})`)
      
      socket.emit('terminal:ssh', {
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        password: sshConfig.password,
        useCloudflared: sshConfig.useCloudflared || false
      })
    } else {
      term.writeln(`\x1b[1;36mMode:\x1b[0m Docker Exec`)
      socket.emit('docker:exec', {
        containerId,
        shell: 'bash'
      })
    }

    // Handle terminal data from server
    const handleData = (data) => {
      term.write(data)
    }

    // Handle connection success
    const handleConnected = () => {
      setIsConnected(true)
      // term.writeln('\x1b[1;32m✓ Connected to container!\x1b[0m\r\n')
      // Focus terminal so user can start typing immediately
      term.focus()
    }

    // Handle terminal exit
    const handleExit = ({ code }) => {
      term.writeln(`\r\n\x1b[1;33mProcess exited with code ${code}\x1b[0m`)
      term.writeln('\x1b[1;31mConnection closed.\x1b[0m')
      setIsConnected(false)
    }

    // Handle errors
    const handleError = ({ message }) => {
      term.writeln(`\r\n\x1b[1;31mError: ${message}\x1b[0m`)
      setError(message)
      setIsConnected(false)
    }

    // Listen to socket events
    socket.on('terminal:data', handleData)
    socket.on('terminal:connected', handleConnected)
    socket.on('terminal:exit', handleExit)
    socket.on('terminal:error', handleError)

    // Handle user input - Send immediately, don't wait for isConnected state
    term.onData((data) => {
      socket.emit('terminal:input', data)
    })

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      socket.off('terminal:data', handleData)
      socket.off('terminal:connected', handleConnected)
      socket.off('terminal:exit', handleExit)
      socket.off('terminal:error', handleError)
      socket.emit('terminal:close')
      term.dispose()
    }
  }, [containerId, containerName, socket])

  // Dragging handlers
  const handleMouseDown = (e) => {
    if (isMaximized) return // Don't drag when maximized
    if (e.target.closest('button')) return // Don't drag when clicking buttons
    
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStartPos.current.x
    const newY = e.clientY - dragStartPos.current.y
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add mouse move and up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, position])

  // Resize handlers
  const handleResizeStart = (e, direction) => {
    if (isMaximized) return
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeDirection(direction)
    resizeStartPos.current = { x: e.clientX, y: e.clientY }
    resizeStartSize.current = { ...size }
  }

  const handleResizeMove = (e) => {
    if (!isResizing || !resizeDirection) return
    
    const deltaX = e.clientX - resizeStartPos.current.x
    const deltaY = e.clientY - resizeStartPos.current.y
    
    let newWidth = resizeStartSize.current.width
    let newHeight = resizeStartSize.current.height
    let newX = position.x
    let newY = position.y
    
    // Handle different resize directions
    if (resizeDirection.includes('right')) {
      newWidth = Math.max(400, resizeStartSize.current.width + deltaX)
    }
    if (resizeDirection.includes('left')) {
      const widthChange = resizeStartSize.current.width - deltaX
      if (widthChange >= 400) {
        newWidth = widthChange
        newX = position.x + deltaX
      }
    }
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.max(300, resizeStartSize.current.height + deltaY)
    }
    if (resizeDirection.includes('top')) {
      const heightChange = resizeStartSize.current.height - deltaY
      if (heightChange >= 300) {
        newHeight = heightChange
        newY = position.y + deltaY
      }
    }
    
    setSize({ width: newWidth, height: newHeight })
    setPosition({ x: newX, y: newY })
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)
    
    // Refit terminal after resize
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }, 100)
  }

  // Add resize move and up listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, size, position, resizeDirection])

  const handleMaximize = () => {
    if (!isMaximized) {
      // Save current size before maximizing
      resizeStartSize.current = { ...size }
    } else {
      // Restore previous size
      setSize(resizeStartSize.current)
    }
    setIsMaximized(!isMaximized)
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }, 100)
  }

  const handleClose = () => {
    if (socket) {
      socket.emit('terminal:close')
    }
    onClose()
  }

  return (
    <div 
      ref={modalRef}
      className={`fixed bg-gray-900 rounded-lg shadow-2xl flex flex-col ${
        isDragging ? 'cursor-move' : isResizing ? 'cursor-' + resizeDirection + '-resize' : ''
      }`}
      style={{ 
        zIndex: 50,
        userSelect: isDragging || isResizing ? 'none' : 'auto',
        ...(isMaximized ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100vh',
          transform: 'none'
        } : {
          top: '50%',
          left: '50%',
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        })
      }}
    >
      {/* Resize Handles */}
      {!isMaximized && (
        <>
          {/* Top */}
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-n-resize hover:bg-blue-500/50"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          {/* Bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-blue-500/50"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          {/* Left */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize hover:bg-blue-500/50"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          {/* Right */}
          <div
            className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize hover:bg-blue-500/50"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          {/* Top-Left Corner */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          {/* Top-Right Corner */}
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          {/* Bottom-Left Corner */}
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          {/* Bottom-Right Corner */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />
        </>
      )}
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div>
            <h3 className="text-white font-medium">{containerName}</h3>
            <p className="text-xs text-gray-400">{containerId.substring(0, 12)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected && (
            <span className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Connected</span>
            </span>
          )}
          {error && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
              Error
            </span>
          )}
          <button
            onClick={handleMaximize}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="flex-1 overflow-hidden p-2"
        style={{ background: '#1e1e1e' }}
      />

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Press Ctrl+C to interrupt | Type 'exit' to close</span>
          <span>Shell: bash</span>
        </div>
      </div>
    </div>
  )
}
