// CONCH Platform - Create Conch Page

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createConch } from '../lib/api'
import { useConchStore } from '../lib/store'
import { useSSE } from '../hooks/useSSE'

export default function CreateConch() {
  const navigate = useNavigate()
  const { addConch } = useConchStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Connect to SSE for real-time updates
  useSSE()
  
  const [formData, setFormData] = useState({
    story: '',
    intent: '',
    stateType: 'memory'
  })

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
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="story">Story</label>
            <textarea
              id="story"
              className="input textarea"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Tell the story of this Conch..."
              required
              rows={6}
            />
            <span className="form-hint">The narrative and content of your Conch</span>
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
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                  Creating...
                </span>
              ) : (
                'Create Conch'
              )}
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
        
        .btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
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
