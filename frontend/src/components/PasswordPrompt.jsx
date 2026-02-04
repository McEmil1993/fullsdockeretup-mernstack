import { useState } from 'react'
import { X, Key } from 'lucide-react'

export default function PasswordPrompt({ onSubmit, onCancel, title, message, showCloudflaredOption = false, defaultHost = '', defaultUsername = 'root', sshPort = null }) {
  const [password, setPassword] = useState('')
  const [useCloudflared, setUseCloudflared] = useState(false)
  const [customHost, setCustomHost] = useState(defaultHost)
  const [username, setUsername] = useState(defaultUsername)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password) {
      onSubmit(password, useCloudflared, customHost, username)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || 'SSH Password Required'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {message}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Custom SSH Host */}
          {showCloudflaredOption && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSH Host
              </label>
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="e.g., bsit3block1group1ssh.markemilcajesdacoylo.online"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Custom SSH hostname (e.g., for Cloudflare Access)
              </p>
            </div>
          )}

          {/* Username */}
          {showCloudflaredOption && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="root"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter SSH password"
              autoFocus={!showCloudflaredOption}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Connection Method */}
          {showCloudflaredOption && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Connection Method
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="connectionMethod"
                    checked={!useCloudflared}
                    onChange={() => setUseCloudflared(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {sshPort ? `SSH localhost:${sshPort} (Recommended)` : 'Docker Exec (Recommended)'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      {sshPort ? 'Direct SSH to container port' : 'Direct container access, no SSH required'}
                    </p>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="connectionMethod"
                    checked={useCloudflared}
                    onChange={() => setUseCloudflared(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SSH via Cloudflared
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      For remote SSH access through Cloudflare
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
