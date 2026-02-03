import Modal from '../Modal'
import { Server, Globe, Terminal, FileText, Calendar } from 'lucide-react'

const ServerDetailsModal = ({ isOpen, onClose, server }) => {
  if (!server) return null

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server Details">
      <div className="space-y-6">
        {/* Server Name & Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {server.name}
            </h3>
          </div>
          {server.description && (
            <p className="text-gray-600 dark:text-gray-400">{server.description}</p>
          )}
        </div>

        {/* Domains */}
        {server.domains && server.domains.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Domains</h4>
            </div>
            <div className="space-y-2">
              {server.domains.map((domain, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {domain.domain}
                  </div>
                  {domain.purpose && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {domain.purpose}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SSH Connections */}
        {server.connections && server.connections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">SSH Connections</h4>
            </div>
            <div className="space-y-2">
              {server.connections.map((conn, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Host:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{conn.host}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Port:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{conn.port}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Username:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{conn.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Password:</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{'•'.repeat(8)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {server.notes && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Notes</h4>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {server.notes}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Created: {formatDate(server.createdAt)}
            </span>
          </div>
          {server.updatedAt !== server.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Updated: {formatDate(server.updatedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ServerDetailsModal
