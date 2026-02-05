import { useState, useEffect, useRef } from 'react'
import { X, Plus, Minus, AlertCircle, CheckCircle, Search, ChevronDown } from 'lucide-react'
import * as dockerService from '../../services/docker'

const OS_OPTIONS = [
  // ===== POPULAR / RECOMMENDED =====
  { value: 'ubuntu:24.04', label: '⭐ Ubuntu 24.04 (Recommended)' },
  { value: 'ubuntu:22.04', label: '⭐ Ubuntu 22.04 LTS (Recommended)' },
  { value: 'debian:12', label: '⭐ Debian 12 (Recommended)' },
  { value: 'alpine:latest', label: '⭐ Alpine Linux (Recommended)' },
  { value: 'rockylinux:9', label: '⭐ Rocky Linux 9 (Recommended)' },
  { value: 'almalinux:9', label: '⭐ AlmaLinux 9 (Recommended)' },
  
  // ===== DEBIAN-BASED =====
  { value: 'debian:11', label: '📦 Debian 11 (Bullseye)' },
  { value: 'debian:10', label: '📦 Debian 10 (Buster)' },
  { value: 'ubuntu:20.04', label: '📦 Ubuntu 20.04 LTS' },
  { value: 'ubuntu:18.04', label: '📦 Ubuntu 18.04 LTS' },
  { value: 'kalilinux/kali-rolling', label: '📦 Kali Linux (Rolling)' },
  { value: 'parrotsec/security', label: '📦 Parrot Security OS' },
  { value: 'mxlinux/mxlinux', label: '📦 MX Linux' },
  { value: 'pureos/pureos', label: '📦 PureOS' },
  { value: 'devuan/devuan', label: '📦 Devuan' },
  
  // ===== RED HAT–BASED =====
  { value: 'redhat/ubi9', label: '🏢 Red Hat UBI 9' },
  { value: 'redhat/ubi8', label: '🏢 Red Hat UBI 8' },
  { value: 'fedora:40', label: '🏢 Fedora 40' },
  { value: 'fedora:39', label: '🏢 Fedora 39' },
  { value: 'fedora:38', label: '🏢 Fedora 38' },
  { value: 'centos:stream9', label: '🏢 CentOS Stream 9' },
  { value: 'centos:stream8', label: '🏢 CentOS Stream 8' },
  { value: 'centos:7', label: '🏢 CentOS 7' },
  { value: 'rockylinux:8', label: '🏢 Rocky Linux 8' },
  { value: 'almalinux:8', label: '🏢 AlmaLinux 8' },
  { value: 'oraclelinux:9', label: '🏢 Oracle Linux 9' },
  { value: 'oraclelinux:8', label: '🏢 Oracle Linux 8' },
  { value: 'amazonlinux:2023', label: '🏢 Amazon Linux 2023' },
  { value: 'amazonlinux:2', label: '🏢 Amazon Linux 2' },
  { value: 'clearos/clearos', label: '🏢 ClearOS' },
  
  // ===== ARCH-BASED =====
  { value: 'archlinux:latest', label: '🐧 Arch Linux' },
  { value: 'manjarolinux/base', label: '🐧 Manjaro' },
  { value: 'endeavouros/endeavouros', label: '🐧 EndeavourOS' },
  { value: 'garudalinux/garuda', label: '🐧 Garuda Linux' },
  { value: 'arcolinux/arcolinux', label: '🐧 ArcoLinux' },
  { value: 'artixlinux/artix', label: '🐧 Artix Linux' },
  { value: 'blackarch/blackarch', label: '🐧 BlackArch' },
  
  // ===== SUSE-BASED =====
  { value: 'opensuse/leap:15.6', label: '🦎 openSUSE Leap 15.6' },
  { value: 'opensuse/leap:15.5', label: '🦎 openSUSE Leap 15.5' },
  { value: 'opensuse/tumbleweed:latest', label: '🦎 openSUSE Tumbleweed' },
  { value: 'registry.suse.com/suse/sle15', label: '🦎 SUSE Linux Enterprise 15' },
  
  // ===== GENTOO-BASED =====
  { value: 'gentoo/stage3', label: '⚙️ Gentoo Linux' },
  { value: 'calculate/calculate', label: '⚙️ Calculate Linux' },
  
  // ===== SLACKWARE-BASED =====
  { value: 'vbatts/slackware', label: '📀 Slackware' },
  { value: 'salix/salix', label: '📀 Salix OS' },
  
  // ===== INDEPENDENT =====
  { value: 'voidlinux/voidlinux', label: '🔷 Void Linux' },
  { value: 'alpine:3.19', label: '🔷 Alpine Linux 3.19' },
  { value: 'alpine:3.18', label: '🔷 Alpine Linux 3.18' },
  { value: 'alpine:edge', label: '🔷 Alpine Linux Edge' },
  { value: 'nixos/nix', label: '🔷 NixOS' },
  { value: 'clearlinux/clear-linux-os', label: '🔷 Clear Linux' },
  { value: 'mageia/mageia', label: '🔷 Mageia' },
  { value: 'openmandriva/cooker', label: '🔷 OpenMandriva' },
  
  // ===== MINIMAL / EMBEDDED =====
  { value: 'alpine:3.19', label: '📦 Alpine Linux 3.19' },
  { value: 'alpine:3.18', label: '📦 Alpine Linux 3.18' },
  { value: 'alpine:edge', label: '📦 Alpine Linux Edge' },
  { value: 'busybox:latest', label: '📦 BusyBox' },
  { value: 'tinycore/tinycore', label: '📦 Tiny Core Linux' },
  
  // ===== SPECIAL PURPOSE =====
  { value: 'proxmox/proxmox-ve', label: '🔧 Proxmox VE' },
  { value: 'openwrt/rootfs', label: '🔧 OpenWRT' },
  { value: 'qubes/qubes', label: '🔧 Qubes OS' },
  
  // ===== WINDOWS (Requires Windows Docker Host) =====
  { value: 'mcr.microsoft.com/windows/servercore:ltsc2022', label: '🪟 Windows Server 2022 Core' },
  { value: 'mcr.microsoft.com/windows/servercore:ltsc2019', label: '🪟 Windows Server 2019 Core' },
  { value: 'mcr.microsoft.com/windows/nanoserver:ltsc2022', label: '🪟 Windows Nano Server 2022' },
  { value: 'mcr.microsoft.com/windows/nanoserver:ltsc2019', label: '🪟 Windows Nano Server 2019' },
  { value: 'mcr.microsoft.com/windows:latest', label: '🪟 Windows (Latest)' },
  { value: 'mcr.microsoft.com/windows/server:ltsc2022', label: '🪟 Windows Server 2022 (Full)' },
]

export default function CreateContainerForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    os: 'ubuntu:24.04',
    user: 'root',
    password: '',
    portsInside: [{ value: '22' }, { value: '3000' }, { value: '3001' }, { value: '3002' }],
    portsOutside: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
  })

  const [usedPorts, setUsedPorts] = useState([])
  const [errors, setErrors] = useState({})
  const [nameExists, setNameExists] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // OS dropdown state
  const [osDropdownOpen, setOsDropdownOpen] = useState(false)
  const [osSearchQuery, setOsSearchQuery] = useState('')
  const osDropdownRef = useRef(null)

  // Load used ports
  useEffect(() => {
    loadUsedPorts()
  }, [])

  const loadUsedPorts = async () => {
    try {
      const response = await dockerService.getUsedPorts()
      setUsedPorts(response.data || [])
    } catch (error) {
      console.error('Failed to load used ports:', error)
    }
  }

  // Check container name
  useEffect(() => {
    const checkName = async () => {
      if (!formData.name || formData.name.length < 2) {
        setNameExists(false)
        return
      }

      setCheckingName(true)
      try {
        const response = await dockerService.checkContainerName(formData.name)
        setNameExists(response.data.exists)
        if (response.data.exists) {
          setErrors(prev => ({ ...prev, name: 'Container name already exists' }))
        } else {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.name
            return newErrors
          })
        }
      } catch (error) {
        console.error('Failed to check container name:', error)
      } finally {
        setCheckingName(false)
      }
    }

    const debounce = setTimeout(checkName, 500)
    return () => clearTimeout(debounce)
  }, [formData.name])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Filter OS options based on search query
  const filteredOsOptions = OS_OPTIONS.filter(option =>
    option.label.toLowerCase().includes(osSearchQuery.toLowerCase()) ||
    option.value.toLowerCase().includes(osSearchQuery.toLowerCase())
  )

  // Get selected OS label
  const selectedOsLabel = OS_OPTIONS.find(opt => opt.value === formData.os)?.label || formData.os

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (osDropdownRef.current && !osDropdownRef.current.contains(event.target)) {
        setOsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePortChange = (index, type, value) => {
    setFormData(prev => {
      const newPorts = [...prev[type]]
      newPorts[index].value = value
      return { ...prev, [type]: newPorts }
    })
  }

  const addPort = () => {
    setFormData(prev => ({
      ...prev,
      portsInside: [...prev.portsInside, { value: '' }],
      portsOutside: [...prev.portsOutside, { value: '' }],
    }))
  }

  const removePort = (index) => {
    if (formData.portsInside.length <= 1) return
    setFormData(prev => ({
      ...prev,
      portsInside: prev.portsInside.filter((_, i) => i !== index),
      portsOutside: prev.portsOutside.filter((_, i) => i !== index),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate name
    if (!formData.name) {
      newErrors.name = 'Container name is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name = 'Name must contain only lowercase letters, numbers, and hyphens'
    } else if (nameExists) {
      newErrors.name = 'Container name already exists'
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Validate ports
    const insidePorts = formData.portsInside.map(p => p.value.trim()).filter(p => p)
    const outsidePorts = formData.portsOutside.map(p => p.value.trim()).filter(p => p)

    if (insidePorts.length === 0) {
      newErrors.portsInside = 'At least one inside port is required'
    }

    if (outsidePorts.length === 0) {
      newErrors.portsOutside = 'At least one outside port is required'
    }

    if (insidePorts.length !== outsidePorts.length) {
      newErrors.ports = 'Number of inside and outside ports must match'
    }

    // Check for duplicate ports
    const insideSet = new Set()
    const outsideSet = new Set()
    
    insidePorts.forEach(port => {
      if (insideSet.has(port)) {
        newErrors.portsInside = 'Duplicate inside ports detected'
      }
      insideSet.add(port)
    })

    outsidePorts.forEach(port => {
      if (outsideSet.has(port)) {
        newErrors.portsOutside = 'Duplicate outside ports detected'
      }
      if (usedPorts.includes(parseInt(port))) {
        newErrors.portsOutside = `Port ${port} is already in use`
      }
      outsideSet.add(port)
    })

    // Validate port numbers
    const validatePortNumber = (port) => {
      const num = parseInt(port)
      return !isNaN(num) && num >= 1 && num <= 65535
    }

    insidePorts.forEach(port => {
      if (!validatePortNumber(port)) {
        newErrors.portsInside = 'Invalid port number(s)'
      }
    })

    outsidePorts.forEach(port => {
      if (!validatePortNumber(port)) {
        newErrors.portsOutside = 'Invalid port number(s)'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const insidePorts = formData.portsInside.map(p => p.value.trim()).filter(p => p).join(',')
      const outsidePorts = formData.portsOutside.map(p => p.value.trim()).filter(p => p).join(',')

      const config = {
        name: formData.name,
        os: formData.os,
        user: formData.user,
        password: formData.password,
        portsInside: insidePorts,
        portsOutside: outsidePorts,
      }

      await dockerService.createCustomContainer(config)
      onSuccess('Container created successfully!')
      onClose()
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to create container' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ marginTop: '-20px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Container</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Container Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Container Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., macneil"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {checkingName && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              {!checkingName && formData.name && !nameExists && !errors.name && (
                <div className="absolute right-3 top-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only</p>
          </div>

          {/* Operating System - Custom Searchable Dropdown */}
          <div className="relative" ref={osDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operating System *
            </label>
            
            {/* Selected Value Display */}
            <button
              type="button"
              onClick={() => setOsDropdownOpen(!osDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <span className="text-gray-900 dark:text-white truncate">{selectedOsLabel}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${osDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {osDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-96 flex flex-col">
                {/* Search Box */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={osSearchQuery}
                      onChange={(e) => setOsSearchQuery(e.target.value)}
                      placeholder="Search OS..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto max-h-80">
                  {filteredOsOptions.length > 0 ? (
                    filteredOsOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, os: option.value }))
                          setOsDropdownOpen(false)
                          setOsSearchQuery('')
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                          formData.os === option.value
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{option.label.split(' ')[0]}</span>
                          <span className="flex-1">{option.label.substring(option.label.indexOf(' ') + 1)}</span>
                          {formData.os === option.value && (
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No OS found matching "{osSearchQuery}"</p>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {filteredOsOptions.length} of {OS_OPTIONS.length} distributions
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User *
            </label>
            <input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Default user is root</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password (min 6 characters)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Ports */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port Mappings *
            </label>
            <div className="space-y-3">
              {formData.portsInside.map((port, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={port.value}
                      onChange={(e) => handlePortChange(index, 'portsInside', e.target.value)}
                      placeholder="Inside Port (e.g., 22)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <span className="text-gray-500">→</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.portsOutside[index].value}
                      onChange={(e) => handlePortChange(index, 'portsOutside', e.target.value)}
                      placeholder="Outside Port (e.g., 2090)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePort(index)}
                    disabled={formData.portsInside.length <= 1}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPort}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Port Mapping
            </button>
            {errors.portsInside && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.portsInside}
              </p>
            )}
            {errors.portsOutside && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.portsOutside}
              </p>
            )}
            {errors.ports && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.ports}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Used ports: {usedPorts.length > 0 ? usedPorts.join(', ') : 'None'}
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || nameExists || checkingName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Container
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
