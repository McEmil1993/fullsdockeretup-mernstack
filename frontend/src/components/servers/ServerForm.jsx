const ServerForm = ({ formData, handleInputChange, handleDomainChange, handleConnectionChange, errors }) => {
  return (
    <div className="space-y-4">
      {/* Server Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Server Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="My Server"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Server description..."
        />
      </div>

      {/* Domains */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Domains
        </label>
        {formData.domains.map((domain, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={domain.domain}
              onChange={(e) => handleDomainChange(index, 'domain', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="example.com"
            />
            <input
              type="text"
              value={domain.purpose}
              onChange={(e) => handleDomainChange(index, 'purpose', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Purpose"
            />
            <button
              type="button"
              onClick={() => handleDomainChange(index, 'remove')}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleDomainChange('add')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add Domain
        </button>
      </div>

      {/* SSH Connections */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          SSH Connections
        </label>
        {formData.connections.map((conn, index) => (
          <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={conn.host}
                onChange={(e) => handleConnectionChange(index, 'host', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Host/IP"
              />
              <input
                type="number"
                value={conn.port}
                onChange={(e) => handleConnectionChange(index, 'port', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Port"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={conn.username}
                onChange={(e) => handleConnectionChange(index, 'username', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Username"
              />
              <input
                type="password"
                value={conn.password}
                onChange={(e) => handleConnectionChange(index, 'password', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Password"
              />
            </div>
            <button
              type="button"
              onClick={() => handleConnectionChange(index, 'remove')}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove Connection
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleConnectionChange('add')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add SSH Connection
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Additional notes..."
        />
      </div>
    </div>
  )
}

export default ServerForm
