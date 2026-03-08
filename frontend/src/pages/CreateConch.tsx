// CONCH Platform - Create Conch Page

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createConch, searchTags } from '../lib/api'
import { useConchStore } from '../lib/store'
import { useSSE } from '../hooks/useSSE'

// Rich text editor icons
const BoldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
)

const ItalicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
)

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

export default function CreateConch() {
  const navigate = useNavigate()
  const { addConch } = useConchStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagQuery, setTagQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  
  // Connect to SSE for real-time updates
  useSSE()
  
  const [formData, setFormData] = useState({
    story: '',
    intent: '',
    stateType: 'memory',
    tags: [] as string[]
  })

  // Search tags on input
  useEffect(() => {
    const searchTagsDebounced = setTimeout(async () => {
      if (tagQuery.length >= 2) {
        try {
          const tags = await searchTags(tagQuery, 5)
          setTagSuggestions(tags.map(t => t.name).filter(t => !formData.tags.includes(t)))
          setShowSuggestions(true)
        } catch (e) {
          console.warn('Tag search failed:', e)
        }
      } else {
        setTagSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    
    return () => clearTimeout(searchTagsDebounced)
  }, [tagQuery, formData.tags])

  // Add tag
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }))
    }
    setTagQuery('')
    setShowSuggestions(false)
  }

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  // Rich text formatting
  const formatText = (format: string) => {
    const textarea = document.getElementById('story') as HTMLTextAreaElement
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.story.substring(start, end)
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = '**' + selectedText + '**'
        break
      case 'italic':
        formattedText = '*' + selectedText + '*'
        break
      case 'list':
        formattedText = '\n- ' + selectedText
        break
      case 'link':
        formattedText = '[' + selectedText + '](url)'
        break
      default:
        formattedText = selectedText
    }
    
    const newStory = formData.story.substring(0, start) + formattedText + formData.story.substring(end)
    setFormData({ ...formData, story: newStory })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const state = { type: formData.stateType }
      const newConch = await createConch({
        state,
        story: formData.story,
        intent: formData.intent,
      })
      
      if (!newConch) {
        throw new Error('Failed to create Conch - no response from server')
      }
      
      addConch(newConch)
      navigate(`/conch/${newConch.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Conch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="container">
        <header className="page-header">
          <h1>Create a Conch</h1>
          <p className="text-muted">Forge a new memory in the spiral</p>
        </header>

        <form onSubmit={handleSubmit} className="create-form">
          {error && (
            <div className="error-message">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="story">Story</label>
            <div className="rich-text-toolbar">
              <button type="button" className="toolbar-btn" onClick={() => formatText('bold')} title="Bold">
                <BoldIcon />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatText('italic')} title="Italic">
                <ItalicIcon />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatText('list')} title="List">
                <ListIcon />
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatText('link')} title="Link">
                <LinkIcon />
              </button>
            </div>
            <textarea
              id="story"
              className="input textarea"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Tell the story of this Conch... (Supports **bold**, *italic*, - lists, [links](url))"
              required
              rows={8}
            />
            <span className="form-hint">The narrative and content of your Conch. Use toolbar for formatting.</span>
          </div>

          <div className="form-group">
            <label htmlFor="intent">Intent</label>
            <input
              id="intent"
              type="text"
              className="input"
              value={formData.intent}
              onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
              placeholder="What is the purpose of this Conch?"
              required
            />
            <span className="form-hint">A brief summary of the Conch's purpose</span>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input-container">
              <div className="tags-list">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>x</button>
                  </span>
                ))}
              </div>
              <div className="tag-input-wrapper">
                <input
                  ref={tagInputRef}
                  type="text"
                  className="input tag-input"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagQuery)
                    }
                  }}
                  placeholder="Add tags..."
                />
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div className="tag-suggestions">
                    {tagSuggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="tag-suggestion"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <span className="form-hint">Add tags to help others discover your Conch</span>
          </div>

          <div className="form-group">
            <label htmlFor="stateType">Type</label>
            <select
              id="stateType"
              className="input"
              value={formData.stateType}
              onChange={(e) => setFormData({ ...formData, stateType: e.target.value })}
            >
              <option value="memory">Memory</option>
              <option value="knowledge">Knowledge</option>
              <option value="wisdom">Wisdom</option>
              <option value="artifact">Artifact</option>
            </select>
            <span className="form-hint">The category of this Conch</span>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-ghost"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Conch'}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        .create-page {
          min-height: 100vh;
          padding-top: 80px;
          padding-bottom: 60px;
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        
        .create-form {
          max-width: 640px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 32px;
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 8px;
        }
        
        .input {
          width: 100%;
          padding: 14px 16px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          color: var(--color-text);
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-muted);
        }
        
        .input::placeholder {
          color: var(--color-text-muted);
        }
        
        .textarea {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }
        
        .form-hint {
          display: block;
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 6px;
        }
        
        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          margin-bottom: 24px;
        }
        
        .error-message span {
          font-size: 18px;
          font-weight: bold;
          color: #ef4444;
        }
        
        .error-message p {
          color: #ef4444;
          font-size: 14px;
          margin: 0;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .btn-primary {
          background: var(--color-primary);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: var(--color-gold);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-ghost {
          background: transparent;
          color: var(--color-text-muted);
        }
        
        .btn-ghost:hover:not(:disabled) {
          color: var(--color-text);
          background: var(--color-white-10);
        }
        
        /* Rich text editor */
        .rich-text-toolbar {
          display: flex;
          gap: 4px;
          padding: 8px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-bottom: none;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }
        
        .toolbar-btn {
          padding: 6px 10px;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toolbar-btn:hover {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        .textarea {
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }
        
        /* Tags input */
        .tags-input-container {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-bg-elevated);
          padding: 8px;
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 500;
        }
        
        .tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: transparent;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          border-radius: 50%;
        }
        
        .tag-remove:hover {
          background: var(--color-primary);
          color: white;
        }
        
        .tag-input-wrapper {
          position: relative;
        }
        
        .tag-input {
          border: none;
          background: transparent;
          padding: 8px 0;
        }
        
        .tag-input:focus {
          box-shadow: none;
        }
        
        .tag-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 10;
          margin-top: 4px;
          overflow: hidden;
        }
        
        .tag-suggestion {
          display: block;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          text-align: left;
          color: var(--color-text);
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .tag-suggestion:hover {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        /* Light theme */
        [data-theme="light"] .create-form { background: #FFFFFF; border-color: rgba(0,0,0,0.1); }
        [data-theme="light"] .form-group label { color: #666; }
        [data-theme="light"] .input { background: #F5F4F1; border-color: rgba(0,0,0,0.15); color: #1A1A1A; }
        [data-theme="light"] .tags-input-container { background: #F5F4F1; border-color: rgba(0,0,0,0.15); }
        [data-theme="light"] .tag { background: rgba(255,111,97,0.15); color: #E85A4A; }
        [data-theme="light"] .tag-suggestions { background: #FFFFFF; border-color: rgba(0,0,0,0.15); }
        [data-theme="light"] .toolbar-btn { color: #666; }
        [data-theme="light"] .toolbar-btn:hover { background: rgba(255,111,97,0.15); color: #E85A4A; }
        [data-theme="light"] .rich-text-toolbar { background: #F5F4F1; border-color: rgba(0,0,0,0.15); }
        
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 1.75rem;
          }
          
          .create-form {
            padding: 20px;
          }
          
          .form-actions {
            flex-direction: column-reverse;
          }
          
          .form-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
