import { useState, useEffect, useRef } from 'react'
import { Save, Download, Plus, Eye, EyeOff, FileText } from 'lucide-react'
import { marked } from 'marked'
import MarkdownEditor from '../components/markdown/MarkdownEditor'
import MarkdownPreview from '../components/markdown/MarkdownPreview'
import MarkdownToolbar from '../components/markdown/MarkdownToolbar'
import DocumentsList from '../components/markdown/DocumentsList'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const Documents = () => {
  const [documents, setDocuments] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [exportModal, setExportModal] = useState(false)
  const editorRef = useRef(null)

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const mockDocs = JSON.parse(localStorage.getItem('markdown_documents') || '[]')
      setDocuments(mockDocs)
    } catch (error) {
      showToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const handleNew = () => {
    setCurrentDoc(null)
    setTitle('')
    setContent('')
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a title', 'error')
      return
    }

    try {
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
      showToast('Document saved successfully', 'success')
    } catch (error) {
      showToast('Failed to save document', 'error')
    }
  }

  const handleSelect = (doc) => {
    setCurrentDoc(doc)
    setTitle(doc.title)
    setContent(doc.content)
  }

  const handleDelete = (doc) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.title}"?`,
      onConfirm: () => {
        const updatedDocs = documents.filter(d => d._id !== doc._id)
        setDocuments(updatedDocs)
        localStorage.setItem('markdown_documents', JSON.stringify(updatedDocs))
        if (currentDoc?._id === doc._id) {
          handleNew()
        }
        showToast('Document deleted', 'success')
        setConfirmDialog({ ...confirmDialog, isOpen: false })
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
    // Convert markdown to clean HTML using marked library
    const contentHTML = marked(content || '*No content*', {
      gfm: true,
      breaks: true
    })
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Markdown Document'}</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 85%; color: #333; }
    pre { background: #f6f8fa; color: #333; padding: 16px; border-radius: 6px; overflow-x: auto; position: relative; border: 1px solid #e1e4e8; }
    pre code { background: none; padding: 0; display: block; color: #333; }
    pre button { position: absolute; top: 8px; right: 8px; background: #fff; border: 1px solid #d0d7de; color: #24292f; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; opacity: 0; transition: opacity 0.2s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    pre:hover button { opacity: 1; }
    pre button:hover { background: #f3f4f6; border-color: #b0b7be; }
    pre button:active { background: #e5e7eb; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 2px solid #eee; margin: 24px 0; }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Add copy buttons to all pre elements that don't have them
      document.querySelectorAll('pre').forEach(function(pre) {
        // Check if button already exists
        if (pre.querySelector('button')) return;
        
        var button = document.createElement('button');
        button.textContent = 'Copy';
        button.onclick = function() {
          var code = pre.querySelector('code').textContent;
          navigator.clipboard.writeText(code).then(function() {
            button.textContent = '✓ Copied';
            setTimeout(function() {
              button.textContent = 'Copy';
            }, 2000);
          });
        };
        pre.appendChild(button);
      });
    });
  </script>
</head>
<body>
  ${contentHTML}
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="w-6 h-6 text-blue-600" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNew} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
            <Button onClick={handleSave} variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => setShowPreview(!showPreview)} variant="secondary">
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button onClick={() => setExportModal(true)} variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Documents List */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">My Documents</h2>
          <DocumentsList
            documents={documents}
            selectedId={currentDoc?._id}
            onSelect={handleSelect}
            onEdit={handleSelect}
            onDelete={handleDelete}
          />
        </div>

        {/* Editor and Preview */}
        <div className="flex-1 flex">
          {/* Editor */}
          <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700`}>
            <MarkdownToolbar onInsert={handleInsertMarkdown} />
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="# Start writing your markdown here...&#10;&#10;**Bold** *Italic* `code`"
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 overflow-auto bg-white dark:bg-gray-800">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {exportModal && (
        <Modal isOpen={exportModal} onClose={() => setExportModal(false)} title="Export Document">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Export your markdown document as HTML file with styling.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleExportHTML} variant="primary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
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
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}

export default Documents
