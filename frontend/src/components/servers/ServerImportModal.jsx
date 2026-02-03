import { useState } from 'react'
import Modal from '../Modal'
import Button from '../Button'
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react'

const ServerImportModal = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [previewData, setPreviewData] = useState(null)

  const handleValidate = () => {
    try {
      const data = JSON.parse(jsonInput)
      
      // Validate structure
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of server objects')
      }

      // Validate each server
      const invalidServers = data.filter(server => !server.name)
      if (invalidServers.length > 0) {
        throw new Error('All servers must have a "name" field')
      }

      setPreviewData(data)
      setValidationError('')
    } catch (error) {
      setValidationError(error.message)
      setPreviewData(null)
    }
  }

  const handleImport = () => {
    if (previewData) {
      onImport(previewData)
      handleClose()
    }
  }

  const handleClose = () => {
    setJsonInput('')
    setValidationError('')
    setPreviewData(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Servers from JSON">
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Paste your JSON array of servers below. Each server should have at minimum a "name" field.
            Optional fields: description, domains, connections, notes.
          </p>
        </div>

        {/* JSON Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JSON Data
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value)
              setValidationError('')
              setPreviewData(null)
            }}
            rows="10"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            placeholder='[{"name": "Server 1", "description": "My server"}]'
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Validation Error</p>
              <p className="text-sm text-red-700 dark:text-red-400">{validationError}</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Valid JSON! Ready to import {previewData.length} server{previewData.length !== 1 ? 's' : ''}
              </p>
              <ul className="mt-2 space-y-1">
                {previewData.slice(0, 5).map((server, index) => (
                  <li key={index} className="text-sm text-green-700 dark:text-green-400">
                    • {server.name}
                  </li>
                ))}
                {previewData.length > 5 && (
                  <li className="text-sm text-green-700 dark:text-green-400">
                    ... and {previewData.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleValidate}
            disabled={!jsonInput.trim()}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Validate JSON
          </Button>
          <Button
            onClick={handleImport}
            disabled={!previewData}
            variant="primary"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import {previewData ? `(${previewData.length})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ServerImportModal
