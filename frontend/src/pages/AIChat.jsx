import { useState, useEffect, useRef } from 'react'
import { Sparkles, Trash2, Menu, X, Info, ChevronDown } from 'lucide-react'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import ChatHistory from '../components/chat/ChatHistory'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import * as aiService from '../services/ai'
import * as conversationService from '../services/conversations'
import { usePermissions } from '../contexts/PermissionContext'

const AIChat = () => {
  const { hasPermission, getAllowedModels, permissions } = usePermissions()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamAbortController, setStreamAbortController] = useState(null)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('orca-mini:latest')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [showModelInfo, setShowModelInfo] = useState(false)
  const [expandedModels, setExpandedModels] = useState({})
  const messagesEndRef = useRef(null)

  // Model information for the info modal
  const modelInfo = {
    'orca-mini:latest': {
      size: '~2GB',
      description: 'Lightweight and fast model perfect for basic chat and Q&A tasks. Ideal for low-end hardware with limited RAM (~4GB).',
      strengths: 'Quick responses, low resource usage, good for simple conversations and basic questions.',
      bestFor: 'Personal assistants, simple chatbots, learning AI basics, testing on low-spec machines.',
      limitations: 'Limited knowledge depth, may struggle with complex reasoning or technical topics.'
    },
    'codellama:latest': {
      size: '~7GB',
      description: 'Specialized coding assistant trained specifically for programming tasks. Excels at understanding and generating code across multiple languages.',
      strengths: 'Code generation, debugging, explaining code logic, syntax correction, refactoring suggestions, supports JS, Python, PHP, Java, C++, and more.',
      bestFor: 'Software development, code reviews, learning programming, debugging assistance, API integration help.',
      limitations: 'Not optimized for general conversation, focuses primarily on technical/coding tasks.'
    },
    'llama3:latest': {
      size: '~7GB',
      description: 'Advanced general-purpose AI model with strong natural language understanding. Excellent at maintaining context in long conversations.',
      strengths: 'Natural dialogue, creative writing, summarization, complex reasoning, multi-turn conversations, context retention.',
      bestFor: 'General chat, content creation, brainstorming, research assistance, customer support, educational tutoring.',
      limitations: 'Requires more RAM and processing power compared to smaller models.'
    },
    'phi3:mini': {
      size: '~2GB',
      description: 'Microsoft\'s efficient small model with impressive reasoning capabilities. Balances performance with resource efficiency.',
      strengths: 'Logical reasoning, following detailed instructions, structured output, good at math and analysis despite small size.',
      bestFor: 'Task automation, instruction-following applications, educational tools, low-RAM environments.',
      limitations: 'Limited general knowledge compared to larger models, may lack depth in specialized topics.'
    },
    'llama3.2:1b': {
      size: '~1GB',
      description: 'Ultra-compact model designed for edge devices and testing. Smallest in the Llama family with basic conversational abilities.',
      strengths: 'Extremely low memory footprint, fast inference, suitable for mobile/IoT devices, good for prototyping.',
      bestFor: 'Demos, proof-of-concepts, embedded systems, mobile apps, learning AI integration, resource-constrained environments.',
      limitations: 'Very limited capabilities, basic responses only, not suitable for production or complex tasks.'
    },
    'gemma3:4b': {
      size: '~4GB',
      description: 'Google\'s clean and efficient model known for structured, well-formatted responses. Great for organized information delivery.',
      strengths: 'Clean output formatting, structured reasoning, multi-turn Q&A, domain-specific knowledge extraction, good instruction following.',
      bestFor: 'Documentation generation, FAQ systems, educational content, business reports, structured data extraction.',
      limitations: 'May be overly formal in casual conversations, less creative than larger models.'
    },
    'tinyllama:latest': {
      size: '~637MB',
      description: 'The smallest practical model, designed purely for experimentation and learning. Minimal resource requirements.',
      strengths: 'Fastest inference time, lowest memory usage, great for understanding AI concepts, quick setup and testing.',
      bestFor: 'Educational purposes, AI learning projects, testing workflows, prototype development, extremely low-end hardware.',
      limitations: 'Very basic capabilities, inconsistent responses, not recommended for any production use.'
    },
    'llama3.2:3b': {
      size: '~3GB',
      description: 'Mid-sized model offering good balance between capability and efficiency. More capable than 1B while staying resource-friendly.',
      strengths: 'General conversation, simple instructions, faster than 7B models, decent reasoning for its size, CPU-friendly.',
      bestFor: 'General chat applications, simple task automation, personal projects, budget-friendly deployments.',
      limitations: 'Not as capable as 7B+ models, may struggle with highly technical or specialized topics.'
    },
    'deepseek-coder:6.7b': {
      size: '~6.7GB',
      description: 'Advanced coding-focused model with strong logical reasoning for software development. Excellent at understanding code context and providing debugging help.',
      strengths: 'Code generation, bug detection, algorithm optimization, code explanation, refactoring, multi-language support, API documentation help.',
      bestFor: 'Professional software development, code reviews, technical documentation, debugging complex issues, learning advanced programming.',
      limitations: 'Focused on coding tasks, less effective for general conversation or creative writing.'
    },
    'qwen2.5:7b': {
      size: '~7GB',
      description: 'Alibaba\'s multilingual powerhouse with exceptional context handling. Supports many languages and excels at long-context reasoning.',
      strengths: 'Multilingual support (English, Chinese, Japanese, etc.), long context understanding, strong reasoning, versatile general-purpose use.',
      bestFor: 'International applications, translation tasks, cross-language research, long document analysis, global customer support.',
      limitations: 'Larger memory footprint, may be slower on low-end hardware.'
    },
    'mistral:7b': {
      size: '~7GB',
      description: 'Fast and accurate general-purpose model known for efficiency. Excellent balance of speed and capability with strong instruction following.',
      strengths: 'Fast inference, accurate responses, excellent reasoning, strong instruction adherence, efficient resource usage for its size.',
      bestFor: 'Production chatbots, customer service, content generation, general Q&A, business applications.',
      limitations: 'May lack specialized knowledge in niche technical domains.'
    },
    'deepseek-coder:1.3b': {
      size: '~1.3GB',
      description: 'Compact coding assistant for quick code suggestions and simple programming tasks. Good entry-level coding helper.',
      strengths: 'Lightweight, quick code completions, basic syntax help, simple bug fixes, low resource usage.',
      bestFor: 'Code editors/IDEs, quick code suggestions, learning to code, simple scripting tasks, low-RAM setups.',
      limitations: 'Limited to simpler coding tasks, may miss complex logic errors or architectural issues.'
    },
    'qwen2.5:3b': {
      size: '~3GB',
      description: 'Smaller version of Qwen with retained multilingual capabilities. Efficient choice for international applications on limited hardware.',
      strengths: 'Multilingual support, good reasoning for size, low RAM requirements, faster inference than 7B version.',
      bestFor: 'Multilingual chatbots, budget-friendly international apps, translation assistance, resource-constrained multilingual projects.',
      limitations: 'Reduced capabilities compared to 7B version, less depth in complex reasoning tasks.'
    }
  }

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load models when permissions are ready
  useEffect(() => {
    if (permissions) {
      loadModels()
    }
  }, [permissions])

  const loadModels = async () => {
    try {
      const response = await aiService.getModels()
      let models = response.data.data || []
      
      // Filter models based on user permissions
      const allowedModels = getAllowedModels()
      
      // Check if allowedModels field exists and has values
      if (permissions?.aiChat?.allowedModels && allowedModels.length > 0) {
        // If user has specific allowed models, filter to only those
        models = models.filter(model => allowedModels.includes(model.id))
      }
      
      setAvailableModels(models)
      
      // Set first model as default if available, or if current selection is not in the list
      if (models.length > 0) {
        const isCurrentModelAvailable = models.some(m => m.id === selectedModel)
        if (!selectedModel || !isCurrentModelAvailable) {
          setSelectedModel(models[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      // Set default models if API fails
      let defaultModels = [
        { id: 'tinyllama:latest', name: 'tinyllama:latest' },
        { id: 'orca-mini:latest', name: 'orca-mini:latest' },
        { id: 'deepseek-coder:1.3b', name: 'deepseek-coder:1.3b' },
        { id: 'llama3.2:1b', name: 'llama3.2:1b' },
        { id: 'qwen2.5:3b', name: 'qwen2.5:3b' },
        { id: 'llama3.2:3b', name: 'llama3.2:3b' },
        { id: 'phi3:mini', name: 'phi3:mini' },
        { id: 'gemma3:4b', name: 'gemma3:4b' },
        { id: 'deepseek-coder:6.7b', name: 'deepseek-coder:6.7b' },
        { id: 'llama3:latest', name: 'llama3:latest' },
        { id: 'codellama:latest', name: 'codellama:latest' },
        { id: 'mistral:7b', name: 'mistral:7b' },
        { id: 'qwen2.5:7b', name: 'qwen2.5:7b' }
      ]
      
      // Filter default models based on permissions
      const allowedModels = getAllowedModels()
      if (permissions?.aiChat?.allowedModels && allowedModels.length > 0) {
        defaultModels = defaultModels.filter(model => allowedModels.includes(model.id))
      }
      
      setAvailableModels(defaultModels)
      
      // Set first model as default if available, or if current selection is not in the list
      if (defaultModels.length > 0) {
        const isCurrentModelAvailable = defaultModels.some(m => m.id === selectedModel)
        if (!selectedModel || !isCurrentModelAvailable) {
          setSelectedModel(defaultModels[0].id)
        }
      }
    }
  }
  
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
    setIsStreaming(true)

    // Add "thinking..." placeholder message
    const thinkingMessage = {
      id: 'thinking',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true
    }
    setMessages([...updatedMessages, thinkingMessage])

    // Create abort controller for this stream
    const abortController = new AbortController()
    setStreamAbortController(abortController)

    // Variables accessible in try/catch/finally
    const aiMessageId = (Date.now() + 1).toString()
    let aiContent = '' // Full content received from backend
    let displayedContent = '' // Content currently displayed to user
    let wasCancelled = false
    let typewriterInterval = null

    // Buffer for typewriter effect
    let contentBuffer = ''
    let isTyping = false

    // Typewriter function - displays characters one by one
    const startTypewriter = () => {
      if (isTyping) return
      isTyping = true

      typewriterInterval = setInterval(() => {
        if (abortController.signal.aborted) {
          clearInterval(typewriterInterval)
          isTyping = false
          return
        }

        // Display ONE character at a time for smooth typewriter effect
        if (contentBuffer.length > 0) {
          const nextChar = contentBuffer[0]
          contentBuffer = contentBuffer.slice(1)
          displayedContent += nextChar

          // Update message with displayed content
          const streamingMessage = {
            id: aiMessageId,
            role: 'assistant',
            content: displayedContent,
            timestamp: new Date().toISOString()
          }
          setMessages([...updatedMessages, streamingMessage])
        }

        // Stop interval if no more content in buffer and streaming is done
        if (contentBuffer.length === 0 && !isTyping) {
          clearInterval(typewriterInterval)
          isTyping = false
        }
      }, 15) // 15ms per character = smooth and fast typing animation
    }

    try {
      let firstChunk = true

      // Call AI API with streaming
      await aiService.chatStream(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        (chunk) => {
          // Check if cancelled
          if (abortController.signal.aborted) {
            wasCancelled = true
            return
          }
          
          // Remove thinking message on first chunk
          if (firstChunk) {
            firstChunk = false
            setMessages([...updatedMessages])
            startTypewriter() // Start the typewriter effect
          }

          // Append chunk to full content
          aiContent += chunk
          
          // Add chunk to buffer for typewriter display
          contentBuffer += chunk
        },
        { model: selectedModel },
        abortController.signal
      )

      // Wait for typewriter to finish displaying all content
      const waitForTypewriter = () => {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (contentBuffer.length === 0 && displayedContent.length === aiContent.length) {
              clearInterval(checkInterval)
              if (typewriterInterval) clearInterval(typewriterInterval)
              resolve()
            }
          }, 50)
        })
      }

      await waitForTypewriter()

    } catch (error) {
      // Stop typewriter on error
      if (typewriterInterval) clearInterval(typewriterInterval)
      
      // If aborted, that's fine - we'll save in finally
      if (error.name === 'AbortError' || error.message === 'Generation stopped') {
        wasCancelled = true
        // Display remaining buffer immediately
        displayedContent = aiContent
      } else {
        showToast(error.message || 'Failed to send message', 'error')
        // Remove thinking message on real errors
        setMessages(prev => prev.filter(m => m.id !== 'thinking'))
        return // Exit early on real errors, don't save
      }
    } finally {
      // Clean up typewriter interval
      if (typewriterInterval) clearInterval(typewriterInterval)
      
      setLoading(false)
      setIsStreaming(false)
      setStreamAbortController(null)

      // ALWAYS save if we have content (even partial from stop)
      if (aiContent && aiContent.trim()) {
        const finalMessages = [...updatedMessages, {
          id: aiMessageId,
          role: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString()
        }]
        setMessages(finalMessages)

        const conv = {
          ...currentConversation,
          messages: finalMessages,
          title: currentConversation.title === 'New Conversation' ? content.substring(0, 50) : currentConversation.title,
          updatedAt: new Date().toISOString()
        }
        setCurrentConversation(conv)
        
        // Save to database
        saveConversation(conv).then(() => {
          if (wasCancelled) {
            showToast('Generation stopped. Partial response saved.', 'info')
          }
        }).catch(err => {
          console.error('Failed to save conversation:', err)
          showToast('Failed to save conversation', 'error')
        })
      } else if (aiContent === '') {
        // No content at all - remove thinking message
        setMessages(prev => prev.filter(m => m.id !== 'thinking'))
      }
    }
  }

  const handleStopGeneration = () => {
    if (streamAbortController) {
      streamAbortController.abort()
      setStreamAbortController(null)
      setIsStreaming(false)
      setLoading(false)
      showToast('Generation stopped', 'info')
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
    <div className="h-[calc(100vh-64px)] w-full max-w-full flex relative overflow-x-hidden">
      {/* Mobile Overlay */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Sidebar - Chat History */}
      {/* Desktop: Always visible on left */}
      {/* Mobile: Slide-in overlay from left */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 transition-transform duration-300 transform md:relative md:translate-x-0 ${
          isHistoryOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button - Mobile only */}
        <div className="flex items-center justify-between mb-3 md:hidden">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Chat
          </h2>
          <button
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Desktop header */}
        <h2 className="hidden md:flex font-semibold text-gray-900 dark:text-white mb-3 items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          AI Chat
        </h2>
        
        <ChatHistory
          conversations={conversations}
          currentId={currentConversation?._id}
          onSelect={(conv) => {
            handleSelectConversation(conv)
            setIsHistoryOpen(false) // Close on mobile after selection
          }}
          onDelete={handleDeleteConversation}
          onNew={() => {
            handleNewChat()
            setIsHistoryOpen(false) // Close on mobile after new chat
          }}
        />
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 sm:p-3 md:p-4 w-full">
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h1 className="text-sm sm:text-base md:text-xl font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {currentConversation?.title || 'New Conversation'}
            </h1>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Model Selector */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isStreaming || loading}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed max-w-[120px] sm:max-w-none"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                
                {/* Info Icon */}
                <button
                  onClick={() => setShowModelInfo(true)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Model Information"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
              
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 w-full max-w-full" style={{ paddingBottom: '80px' }}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 px-4">
              <div className="text-center">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-blue-500" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-2">AI Assistant</h2>
                <p className="text-sm sm:text-base">Ask me anything! I'm here to help.</p>
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

        {/* Input - Fixed at bottom of this container */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 md:p-4 bg-white dark:bg-gray-800 z-10 w-full max-w-full">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStopGeneration}
            isStreaming={isStreaming}
            disabled={(loading && !isStreaming) || !hasPermission('aiChat.canUse')}
            placeholder={hasPermission('aiChat.canUse') ? "Ask me anything..." : "You don't have permission to use AI Chat"}
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

      {/* Model Info Modal */}
      <Modal
        isOpen={showModelInfo}
        onClose={() => setShowModelInfo(false)}
        title={
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>AI Model Information</span>
          </div>
        }
        size="md"
      >
        <div className="space-y-2">
          {Object.entries(modelInfo).map(([modelId, info]) => {
            const isExpanded = expandedModels[modelId]
            const isSelected = selectedModel === modelId
            
            return (
              <div
                key={modelId}
                className={`rounded-lg border overflow-hidden transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                }`}
              >
                {/* Header - Always Visible */}
                <button
                  onClick={() => setExpandedModels(prev => ({ ...prev, [modelId]: !prev[modelId] }))}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white break-all">
                      {modelId}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0">
                      {info.size}
                    </span>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full flex-shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Content - Collapsible */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-4 pt-0 space-y-3">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                        {info.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1 flex items-center gap-1">
                          <span>✓</span> Strengths
                        </h4>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {info.strengths}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                          <span>🎯</span> Best For
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {info.bestFor}
                        </p>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <span>⚠️</span> Limitations
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {info.limitations}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Quick Tips:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li><strong>For coding:</strong> Use codellama or deepseek-coder models</li>
            <li><strong>For general chat:</strong> Use llama3, mistral, or qwen models</li>
            <li><strong>For low RAM:</strong> Try tinyllama, orca-mini, or phi3:mini</li>
            <li><strong>For multilingual:</strong> Qwen models support multiple languages</li>
          </ul>
        </div>

        {/* Footer with Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowModelInfo(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default AIChat
