import { useState, useEffect, useRef } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import ChatHistory from '../components/chat/ChatHistory'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import * as aiService from '../services/ai'
import * as conversationService from '../services/conversations'

const AIChat = () => {
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const messagesEndRef = useRef(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])
  
  // Mark when initial load is complete
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await conversationService.getConversations({ limit: 50 })
      const saved = response.data.data || []
      setConversations(saved)
      
      // Load last conversation
      if (saved.length > 0) {
        const last = saved[0]
        setCurrentConversation(last)
        setMessages(last.messages || [])
      } else {
        // No conversations exist, create a new one
        await handleNewChat()
      }
      
      setInitialLoadDone(true)
    } catch (error) {
      console.error('Failed to load conversations:', error)
      showToast('Failed to load conversations', 'error')
      setInitialLoadDone(true)
    }
  }

  const saveConversation = async (conv) => {
    try {
      if (conv._id) {
        // Update existing conversation
        await conversationService.updateConversation(conv._id, {
          title: conv.title,
          messages: conv.messages,
        })
        
        const updated = conversations.map(c => c._id === conv._id ? conv : c)
        setConversations(updated)
      } else {
        // Create new conversation
        const response = await conversationService.createConversation({
          title: conv.title,
          messages: conv.messages,
        })
        const newConv = response.data.data
        setConversations([newConv, ...conversations])
        setCurrentConversation(newConv)
      }
    } catch (error) {
      console.error('Failed to save conversation:', error)
      showToast('Failed to save conversation', 'error')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const handleNewChat = async () => {
    try {
      const response = await conversationService.createConversation({
        title: 'New Conversation',
        messages: [],
      })
      const newConv = response.data.data
      setConversations([newConv, ...conversations])
      setCurrentConversation(newConv)
      setMessages([])
    } catch (error) {
      console.error('Failed to create conversation:', error)
      showToast('Failed to create conversation', 'error')
    }
  }

  const handleSendMessage = async (content) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    // Add "thinking..." placeholder message
    const thinkingMessage = {
      id: 'thinking',
      role: 'assistant',
      content: 'Thinking ',
      timestamp: new Date().toISOString(),
      isThinking: true
    }
    setMessages([...updatedMessages, thinkingMessage])

    try {
      // Call AI API
      const response = await aiService.chat(updatedMessages.map(m => ({ role: m.role, content: m.content })))
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.data.message,
        timestamp: new Date().toISOString()
      }

      // Remove thinking message and add real response
      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)

      // Update conversation
      const conv = {
        ...currentConversation,
        messages: finalMessages,
        title: currentConversation.title === 'New Conversation' ? content.substring(0, 50) : currentConversation.title,
        updatedAt: new Date().toISOString()
      }
      setCurrentConversation(conv)
      saveConversation(conv)

    } catch (error) {
      showToast(error.message || 'Failed to send message', 'error')
      // Remove thinking message and user message on error
      setMessages(updatedMessages.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conv) => {
    setCurrentConversation(conv)
    setMessages(conv.messages || [])
  }

  const handleDeleteConversation = (conv) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Conversation',
      message: `Delete "${conv.title}"?`,
      onConfirm: async () => {
        try {
          await conversationService.deleteConversation(conv._id)
          
          const updated = conversations.filter(c => c._id !== conv._id)
          setConversations(updated)
          
          if (currentConversation?._id === conv._id) {
            if (updated.length > 0) {
              handleSelectConversation(updated[0])
            } else {
              handleNewChat()
            }
          }
          
          showToast('Conversation deleted', 'success')
        } catch (error) {
          console.error('Failed to delete conversation:', error)
          showToast('Failed to delete conversation', 'error')
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  const handleClearChat = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Chat',
      message: 'Clear all messages in this conversation?',
      onConfirm: () => {
        setMessages([])
        if (currentConversation) {
          const conv = { ...currentConversation, messages: [] }
          setCurrentConversation(conv)
          saveConversation(conv)
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  // Removed duplicate initialization effect - now handled in loadConversations

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar - Chat History */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          AI Chat
        </h2>
        <ChatHistory
          conversations={conversations}
          currentId={currentConversation?._id}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onNew={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentConversation?.title || 'New Conversation'}
          </h1>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h2 className="text-2xl font-semibold mb-2">AI Assistant</h2>
                <p>Ask me anything! I'm here to help.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isUser={msg.role === 'user'}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <ChatInput
            onSend={handleSendMessage}
            disabled={loading}
            placeholder="Ask me anything..."
          />
        </div>
      </div>

      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}

export default AIChat
