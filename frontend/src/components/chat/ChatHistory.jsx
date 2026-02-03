import { Trash2, MessageSquare } from 'lucide-react'

const ChatHistory = ({ conversations, currentId, onSelect, onDelete, onNew, className = '' }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={onNew}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        New Chat
      </button>
      
      <div className="space-y-2 mt-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id || conv.id}
              onClick={() => onSelect(conv)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentId === (conv._id || conv.id)
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                    {conv.title || 'New Conversation'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(conv.updatedAt || conv.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conv)
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatHistory
