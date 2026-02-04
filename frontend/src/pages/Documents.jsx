import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Save, Download, Plus, Eye, EyeOff, FileText, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { marked } from 'marked'
import Split from 'react-split'
import MarkdownEditor from '../components/markdown/MarkdownEditor'
import MarkdownPreview from '../components/markdown/MarkdownPreview'
import MarkdownToolbar from '../components/markdown/MarkdownToolbar'
import DocumentsList from '../components/markdown/DocumentsList'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import * as documentService from '../services/documents'
import * as preferenceService from '../services/preferences'

const Documents = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [documents, setDocuments] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showEditor, setShowEditor] = useState(true)
  const [panelSizes, setPanelSizes] = useState([20, 40, 40])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [exportModal, setExportModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [blockedNavigation, setBlockedNavigation] = useState(null)
  const [editorFontFamily, setEditorFontFamily] = useState('monospace')
  const [editorFontSize, setEditorFontSize] = useState('14')
  const editorRef = useRef(null)
  const splitRef = useRef(null)

  // Load documents and preferences on mount
  useEffect(() => {
    loadDocuments()
    loadPreferences()
  }, [])
  
  // Load user preferences
  const loadPreferences = async () => {
    try {
      const response = await preferenceService.getPreferences()
      const prefs = response.data
      
      if (prefs.editorFontFamily) setEditorFontFamily(prefs.editorFontFamily)
      if (prefs.editorFontSize) setEditorFontSize(prefs.editorFontSize)
      if (prefs.docPanelSizes) setPanelSizes(prefs.docPanelSizes)
    } catch (error) {
      // Silently fall back to localStorage (API not available yet)
      const fontFamily = localStorage.getItem('editor_font_family')
      const fontSize = localStorage.getItem('editor_font_size')
      const savedSizes = localStorage.getItem('doc_panel_sizes')
      
      if (fontFamily) setEditorFontFamily(fontFamily)
      if (fontSize) setEditorFontSize(fontSize)
      if (savedSizes) setPanelSizes(JSON.parse(savedSizes))
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      // Ctrl+N or Cmd+N to create new
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNew()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, content]) // Re-attach when title/content changes
  
  // Auto-save before page reload/close if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (hasUnsavedChanges && title.trim()) {
        // Show browser confirmation dialog
        e.preventDefault()
        e.returnValue = ''
        
        // Note: Modern browsers don't allow custom async operations here
        // The user will see a generic "unsaved changes" dialog
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, title, content])
  
  // Block navigation to other pages if unsaved changes
  useEffect(() => {
    // Custom navigation blocker
    const handleClick = (e) => {
      // Check if clicking a navigation link
      const link = e.target.closest('a')
      if (link && hasUnsavedChanges) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('/') && href !== location.pathname) {
          e.preventDefault()
          setBlockedNavigation(href)
          setConfirmDialog({
            isOpen: true,
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Do you want to save before leaving?',
            confirmText: 'Save Changes',
            cancelText: 'Discard Changes',
            type: 'warning',
            onConfirm: async () => {
              await handleSave()
              setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })
              setHasUnsavedChanges(false)
              if (blockedNavigation) {
                navigate(blockedNavigation)
              }
            },
          })
        }
      }
    }
    
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [hasUnsavedChanges, location.pathname, blockedNavigation, navigate])
  
  // Save panel sizes when changed
  const handleDragEnd = async (sizes) => {
    setPanelSizes(sizes)
    // Try API, fall back to localStorage
    try {
      await preferenceService.updatePreference('docPanelSizes', sizes)
    } catch (error) {
      localStorage.setItem('doc_panel_sizes', JSON.stringify(sizes))
    }
  }
  
  // Calculate sizes based on visibility
  const getSizes = () => {
    const visiblePanels = [showSidebar, showEditor, showPreview].filter(Boolean).length
    
    if (visiblePanels === 3) {
      // All visible
      return panelSizes
    } else if (visiblePanels === 2) {
      // Two panels visible
      if (showSidebar && showEditor && !showPreview) {
        return [panelSizes[0], 100 - panelSizes[0]]
      } else if (showSidebar && showPreview && !showEditor) {
        return [panelSizes[0], 100 - panelSizes[0]]
      } else if (showEditor && showPreview && !showSidebar) {
        const total = panelSizes[1] + panelSizes[2]
        return [panelSizes[1] / total * 100, panelSizes[2] / total * 100]
      }
    } else if (visiblePanels === 1) {
      // One panel visible
      return [100]
    }
    
    return panelSizes
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      
      // Try to load from API first
      try {
        const response = await documentService.getDocuments()
        setDocuments(response.data || [])
        
        // Migrate from localStorage if API has no documents but localStorage does
        const localDocs = localStorage.getItem('markdown_documents')
        if (localDocs && (!response.data || response.data.length === 0)) {
          const docs = JSON.parse(localDocs)
          if (docs.length > 0) {
            // Migrate documents to API
            for (const doc of docs) {
              try {
                await documentService.createDocument({
                  title: doc.title,
                  content: doc.content
                })
              } catch (err) {
                console.error('Failed to migrate document:', err)
              }
            }
            // Reload after migration
            const newResponse = await documentService.getDocuments()
            setDocuments(newResponse.data || [])
            showToast('Documents migrated to database', 'success')
          }
        }
      } catch (apiError) {
        // If API not available, fall back to localStorage
        console.log('API not available, using localStorage')
        const localDocs = localStorage.getItem('markdown_documents')
        if (localDocs) {
          setDocuments(JSON.parse(localDocs))
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const checkUnsavedChanges = (callback) => {
    if (hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you want to save before leaving?',
        confirmText: 'Save Changes',
        cancelText: 'Discard Changes',
        type: 'warning',
        onConfirm: async () => {
          await handleSave()
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })
          callback()
        },
      })
    } else {
      callback()
    }
  }

  const handleNew = () => {
    checkUnsavedChanges(() => {
      setCurrentDoc(null)
      setTitle('')
      setContent('')
      setHasUnsavedChanges(false)
    })
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Try to save to API first
      try {
        let savedDoc
        
        if (currentDoc && currentDoc._id) {
          // Update existing document
          const response = await documentService.updateDocument(currentDoc._id, {
            title: title.trim(),
            content: content
          })
          savedDoc = response.data
          
          // Update local state
          const updatedDocs = documents.map(d => d._id === savedDoc._id ? savedDoc : d)
          setDocuments(updatedDocs)
        } else {
          // Create new document
          const response = await documentService.createDocument({
            title: title.trim(),
            content: content
          })
          savedDoc = response.data
          
          // Add to local state
          setDocuments([savedDoc, ...documents])
        }
        
        setCurrentDoc(savedDoc)
        setHasUnsavedChanges(false)
        showToast('Document saved successfully', 'success')
      } catch (apiError) {
        // Fall back to localStorage if API not available
        console.log('API not available, saving to localStorage')
        
        const doc = {
          _id: currentDoc?._id || Date.now().toString(),
          title: title.trim(),
          content: content,
          createdAt: currentDoc?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        let updatedDocs
        if (currentDoc) {
          updatedDocs = documents.map(d => d._id === doc._id ? doc : d)
        } else {
          updatedDocs = [doc, ...documents]
        }

        setDocuments(updatedDocs)
        setCurrentDoc(doc)
        localStorage.setItem('markdown_documents', JSON.stringify(updatedDocs))
        setHasUnsavedChanges(false)
        showToast('Document saved successfully', 'success')
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      showToast('Failed to save document', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (doc) => {
    checkUnsavedChanges(() => {
      setCurrentDoc(doc)
      setTitle(doc.title)
      setContent(doc.content)
      setHasUnsavedChanges(false)
    })
  }

  const handleDelete = (doc) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.title}"?`,
      onConfirm: async () => {
        try {
          // Try API first
          try {
            await documentService.deleteDocument(doc._id)
          } catch (apiError) {
            console.log('API not available, deleting from localStorage')
          }
          
          // Always update local state and localStorage
          const updatedDocs = documents.filter(d => d._id !== doc._id)
          setDocuments(updatedDocs)
          localStorage.setItem('markdown_documents', JSON.stringify(updatedDocs))
          
          if (currentDoc?._id === doc._id) {
            handleNew()
          }
          
          showToast('Document deleted', 'success')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Failed to delete document:', error)
          showToast('Failed to delete document', 'error')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  const handleInsertMarkdown = (before, after, placeholder) => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end) || placeholder
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    
    setContent(newText)
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const handleExportHTML = () => {
    // Convert markdown to clean HTML using marked library (same as preview)
    const contentHTML = marked(content || '*No content*', {
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false
    })
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Markdown Document'}</title>
  
  <style>
    /* Base Styles - Matching MarkdownPreview */
    body {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      background: #ffffff;
    }
    
    /* Typography - Prose styles */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 700;
      line-height: 1.25;
      color: #111827;
    }
    h1 { font-size: 2.25em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; margin-top: 0; }
    h2 { font-size: 1.875em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1.125em; }
    h6 { font-size: 1em; color: #6b7280; }
    
    /* Paragraphs */
    p { 
      margin: 1.5em 0;
      line-height: 1.8;
    }
    
    p:first-child {
      margin-top: 0;
    }
    
    /* Links */
    a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
    
    /* Lists */
    ul, ol {
      margin: 1em 0;
      padding-left: 1.625em;
    }
    li { margin: 0.5em 0; }
    li > p { margin: 0.5em 0; }
    
    /* Inline code - matching pink color from preview (but NOT in pre blocks) */
    code:not(pre code) {
      background: #fce7f3;
      color: #db2777;
      padding: 0.2em 0.4em;
      border-radius: 0.25rem;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.875em;
      font-weight: 600;
    }
    
    /* Code blocks - Simple dark theme without Prism */
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 0;
      border-radius: 0.5rem;
      overflow: hidden;
      margin: 1.5em 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    pre code {
      background: transparent;
      color: #d4d4d4;
      padding: 1rem;
      display: block;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.7;
      font-weight: normal;
    }
    
    /* Code block header with language label */
    pre::before {
      content: attr(data-lang);
      display: block;
      background: #1e1e1e;
      color: #9ca3af;
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      font-family: 'Courier New', Courier, monospace;
      border-bottom: 1px solid #374151;
    }
    
    /* Copy button for code blocks */
    .code-block-wrapper {
      position: relative;
      margin: 1.5em 0;
    }
    .copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #374151;
      color: #d1d5db;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      transition: all 0.2s;
      z-index: 10;
    }
    .copy-button:hover {
      background: #4b5563;
      color: #ffffff;
    }
    .copy-button.copied {
      background: #059669;
      color: #ffffff;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid #3b82f6;
      margin: 1.5em 0;
      padding: 0.5em 1em;
      background: #eff6ff;
      color: #1e40af;
      font-style: italic;
    }
    blockquote p { margin: 0.5em 0; }
    
    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      font-size: 0.875em;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    thead { background: #f3f4f6; }
    th {
      border: 1px solid #e5e7eb;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #111827;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem 1rem;
    }
    tbody tr:hover { background: #f9fafb; }
    
    /* Horizontal rule */
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2em 0;
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1em 0;
    }
    
    /* Strong and emphasis */
    strong { font-weight: 700; color: #111827; }
    em { font-style: italic; }
    
    /* Delete */
    del { text-decoration: line-through; color: #6b7280; }
    
    /* Print styles */
    @media print {
      body { max-width: 100%; padding: 1rem; }
      .copy-button { display: none; }
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Wrap code blocks and add copy buttons (no Prism dependency)
      document.querySelectorAll('pre').forEach(function(pre) {
        // Skip if already wrapped
        if (pre.parentElement.classList.contains('code-block-wrapper')) {
          return;
        }
        
        var codeBlock = pre.querySelector('code');
        if (!codeBlock) return;
        
        // Try to detect language from class
        var lang = 'TEXT';
        var className = codeBlock.className;
        if (className) {
          var match = className.match(/language-(\\w+)/);
          if (match) lang = match[1].toUpperCase();
        }
        pre.setAttribute('data-lang', lang);
        
        // Create wrapper
        var wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        
        // Add copy button
        var button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        button.onclick = function() {
          var code = codeBlock.textContent;
          navigator.clipboard.writeText(code).then(function() {
            button.textContent = '✓ Copied';
            button.classList.add('copied');
            setTimeout(function() {
              button.textContent = 'Copy';
              button.classList.remove('copied');
            }, 2000);
          }).catch(function(err) {
            console.error('Copy failed:', err);
            alert('Failed to copy. Please copy manually.');
          });
        };
        wrapper.appendChild(button);
      });
    });
  </script>
</head>
<body>
  <article>
    ${contentHTML}
  </article>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
    
    showToast('Exported to HTML successfully', 'success')
    setExportModal(false)
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="ml-5 mr-5 mt-5 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Documents
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage documents
          </p>
        </div>
       
      </div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-6 h-6 text-blue-600" />
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setHasUnsavedChanges(true)
              }}
              placeholder="Document Title"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNew} size="sm" center variant="success">
              <Plus className="w-4 h-4 " />
              
            </Button>
            <Button onClick={handleSave} variant="primary" center size="sm">
              <Save className="w-4 h-4 " />
              
            </Button>
            {/* <Button 
              onClick={() => setShowSidebar(!showSidebar)} 
              variant="secondary"
              size="sm"
              title={showSidebar ? "Hide documents" : "Show documents"}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button> */}
            {/* <Button 
              size="sm"
              onClick={() => setShowEditor(!showEditor)} 
              variant="secondary"
              title={showEditor ? "Hide editor" : "Show editor"}
            >
              {showEditor ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button> */}
            {/* <Button 
              onClick={() => setShowPreview(!showPreview)} 
              variant="secondary"
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button> */}
            <Button onClick={() => setExportModal(true)} size="sm" center variant="warning">
              <Download className="w-4 h-4 " />
              
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 flex overflow-hidden">
        <Split
          ref={splitRef}
          className="flex flex-1"
          sizes={getSizes()}
          minSize={200}
          gutterSize={6}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
          onDragEnd={handleDragEnd}
          gutter={(index, direction) => {
            const gutter = document.createElement('div')
            gutter.className = `gutter gutter-${direction} bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors cursor-col-resize`
            return gutter
          }}
        >
          {/* Sidebar - Documents List */}
          {showSidebar && (
            <div className="bg-gray-50 dark:bg-gray-900 overflow-y-auto p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">My Documents</h2>
              <DocumentsList
                documents={documents}
                selectedId={currentDoc?._id}
                onSelect={handleSelect}
                onEdit={handleSelect}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Editor */}
          {showEditor && (
            <div className="flex flex-col h-full">
              {/* Editor Settings Toolbar */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Font:</span>
                  <select
                    value={editorFontFamily}
                    onChange={async (e) => {
                      const newValue = e.target.value
                      setEditorFontFamily(newValue)
                      try {
                        await preferenceService.updatePreference('editorFontFamily', newValue)
                      } catch (error) {
                        localStorage.setItem('editor_font_family', newValue)
                      }
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <optgroup label="Monospace (Coding)">
                      <option value="monospace">Monospace (System)</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      <option value="'Consolas', 'Courier New', monospace">Consolas</option>
                      <option value="'Monaco', 'Courier New', monospace">Monaco</option>
                      <option value="'Menlo', 'Monaco', 'Courier New', monospace">Menlo</option>
                      <option value="'Fira Code', 'Consolas', monospace">Fira Code</option>
                      <option value="'Source Code Pro', 'Monaco', monospace">Source Code Pro</option>
                      <option value="'JetBrains Mono', 'Fira Code', monospace">JetBrains Mono</option>
                      <option value="'IBM Plex Mono', 'Courier New', monospace">IBM Plex Mono</option>
                      <option value="'Roboto Mono', 'Monaco', monospace">Roboto Mono</option>
                      <option value="'Ubuntu Mono', 'Courier New', monospace">Ubuntu Mono</option>
                      <option value="'Cascadia Code', 'Consolas', monospace">Cascadia Code</option>
                      <option value="'SF Mono', 'Monaco', monospace">SF Mono</option>
                      <option value="'Inconsolata', 'Monaco', monospace">Inconsolata</option>
                      <option value="'Hack', 'Consolas', monospace">Hack</option>
                      <option value="'Droid Sans Mono', 'monospace'">Droid Sans Mono</option>
                    </optgroup>
                    <optgroup label="Sans-Serif (Modern)">
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                      <option value="Verdana, Geneva, sans-serif">Verdana</option>
                      <option value="'Segoe UI', Tahoma, Geneva, sans-serif">Segoe UI</option>
                      <option value="'Open Sans', Arial, sans-serif">Open Sans</option>
                      <option value="'Roboto', Arial, sans-serif">Roboto</option>
                      <option value="'Lato', Arial, sans-serif">Lato</option>
                      <option value="'Montserrat', Arial, sans-serif">Montserrat</option>
                      <option value="'Poppins', Arial, sans-serif">Poppins</option>
                      <option value="'Inter', Arial, sans-serif">Inter</option>
                      <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      <option value="'Arial Black', sans-serif">Arial Black</option>
                    </optgroup>
                    <optgroup label="Serif (Classic)">
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                      <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                      <option value="'Garamond', serif">Garamond</option>
                      <option value="'Baskerville', serif">Baskerville</option>
                      <option value="'Cambria', serif">Cambria</option>
                      <option value="'Merriweather', Georgia, serif">Merriweather</option>
                      <option value="'Playfair Display', Georgia, serif">Playfair Display</option>
                    </optgroup>
                    <optgroup label="Handwriting/Display">
                      <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                      <option value="'Brush Script MT', cursive">Brush Script</option>
                      <option value="'Lucida Handwriting', cursive">Lucida Handwriting</option>
                      <option value="Impact, Charcoal, sans-serif">Impact</option>
                    </optgroup>
                  </select>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Size:</span>
                  <select
                    value={editorFontSize}
                    onChange={async (e) => {
                      const newValue = e.target.value
                      setEditorFontSize(newValue)
                      try {
                        await preferenceService.updatePreference('editorFontSize', newValue)
                      } catch (error) {
                        localStorage.setItem('editor_font_size', newValue)
                      }
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="10">10px</option>
                    <option value="11">11px</option>
                    <option value="12">12px</option>
                    <option value="13">13px</option>
                    <option value="14">14px (Default)</option>
                    <option value="15">15px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="22">22px</option>
                    <option value="24">24px</option>
                  </select>
                </label>
              </div>
              
              <MarkdownToolbar onInsert={handleInsertMarkdown} />
              <div className="flex-1 overflow-hidden">
                <MarkdownEditor
                  value={content}
                  onChange={(newContent) => {
                    setContent(newContent)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="# Start writing your markdown here...&#10;&#10;**Bold** *Italic* `code`"
                  fontFamily={editorFontFamily}
                  fontSize={editorFontSize}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div className="overflow-auto bg-white dark:bg-gray-800 h-full">
              {content ? (
                <MarkdownPreview content={content} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center p-8">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Preview will appear here</p>
                    <p className="text-sm mt-2">Start typing in the editor to see live preview</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Split>
      </div>

      {/* Export Modal */}
      {exportModal && (
        <Modal isOpen={exportModal} onClose={() => setExportModal(false)} title="Export Document">
          <div className="space-y-4">
            {/* <p className="text-gray-600 dark:text-gray-400">
              Export your markdown document as HTML file with styling.
            </p> */}
            <div className="flex gap-2">
              <Button onClick={handleExportHTML} variant="primary" className="flex-1">
                <Download className="w-4 h-4 " />
                Export as HTML
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })
          // If user discards changes and was trying to navigate, allow navigation
          if (blockedNavigation) {
            setHasUnsavedChanges(false)
            navigate(blockedNavigation)
            setBlockedNavigation(null)
          }
        }}
      />
    </div>
  )
}

export default Documents
