import { FileText, Trash2, Edit, Calendar } from 'lucide-react'

const DocumentsList = ({ documents, onSelect, onEdit, onDelete, selectedId, className = '' }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No documents yet</p>
          <p className="text-sm">Create your first document!</p>
        </div>
      ) : (
        documents.map((doc) => (
          <div
            key={doc._id}
            onClick={() => onSelect(doc)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedId === doc._id
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {doc.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(doc.updatedAt || doc.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(doc)
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(doc)
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default DocumentsList
