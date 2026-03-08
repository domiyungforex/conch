// CONCH Platform - Collaboration Hub Page

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchUserCollaborations, suggestCollaborators, type CollaborationConch, type Collaborator } from '../lib/api'
import Loader from '../components/Loader'

export default function CollaborationHub() {
  const [collaborations, setCollaborations] = useState<CollaborationConch[]>([])
  const [suggestions, setSuggestions] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-conches' | 'suggestions'>('my-conches')
  const currentUser = 'anonymous' // In real app, get from auth

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [collabData, suggestedData] = await Promise.all([
          fetchUserCollaborations(currentUser),
          suggestCollaborators(currentUser)
        ])
        setCollaborations(collabData)
        setSuggestions(suggestedData)
      } catch (error) {
        console.error('Failed to load collaboration data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentUser])

  if (loading) {
    return (
      <div className="collab-page">
        <Loader fullPage message="Loading collaboration hub..." />
      </div>
    )
  }

  return (
    <div className="collab-page">
      <div className="container">
        <header className="page-header">
          <h1>Collaboration Hub</h1>
          <p className="text-muted">Manage your collaborations and discover potential collaborators</p>
        </header>

        {/* Tab Navigation */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'my-conches' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-conches')}
          >
            My Collaborations ({collaborations.length})
          </button>
          <button 
            className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggested Collaborators ({suggestions.length})
          </button>
        </div>

        {activeTab === 'my-conches' ? (
          <div className="collaborations-section">
            {collaborations.length === 0 ? (
              <div className="empty-state">
                <h3>No collaborations yet</h3>
                <p>Start by creating a conch or exploring to find others to collaborate with.</p>
                <Link to="/create" className="btn btn-primary">Create Conch</Link>
              </div>
            ) : (
              <div className="collaboration-grid">
                {collaborations.map((item) => (
                  <div key={item.conch.id} className="collab-card">
                    <div className="collab-header">
                      <h3>{item.conch.intent || 'Untitled Conch'}</h3>
                      <span className={`role-badge ${item.role}`}>{item.role}</span>
                    </div>
                    <p className="collab-story">{item.conch.story?.substring(0, 100) || 'No description'}...</p>
                    <div className="collab-meta">
                      <span>Owner: {item.conch.owner}</span>
                      {item.lastEdited && <span>Last edited: {new Date(item.lastEdited).toLocaleDateString()}</span>}
                    </div>
                    <div className="collaborators">
                      {item.collaborators.slice(0, 3).map((collab, i) => (
                        <div key={i} className="collaborator-avatar" title={collab}>
                          {collab[0]?.toUpperCase() || '?'}
                        </div>
                      ))}
                      {item.collaborators.length > 3 && (
                        <div className="collaborator-more">+{item.collaborators.length - 3}</div>
                      )}
                    </div>
                    <Link to={`/conch/${item.conch.id}`} className="btn btn-secondary">
                      View Conch
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="suggestions-section">
            {suggestions.length === 0 ? (
              <div className="empty-state">
                <h3>No suggestions available</h3>
                <p>Check back later for collaborator suggestions based on your expertise and interests.</p>
              </div>
            ) : (
              <div className="suggestions-grid">
                {suggestions.map((user) => (
                  <div key={user.username} className="suggestion-card">
                    <div className="suggestion-avatar">
                      {user.username[0]?.toUpperCase() || '?'}
                    </div>
                    <h3>{user.username}</h3>
                    <div className="expertise">
                      <span className="label">Expertise:</span>
                      <div className="tags">
                        {user.expertise.slice(0, 3).map((exp, i) => (
                          <span key={i} className="tag">{exp}</span>
                        ))}
                      </div>
                    </div>
                    <div className="interests">
                      <span className="label">Interests:</span>
                      <div className="tags">
                        {user.interests.slice(0, 3).map((int, i) => (
                          <span key={i} className="tag interest">{int}</span>
                        ))}
                      </div>
                    </div>
                    <div className="connection-score">
                      <span>{user.commonConnections} common connections</span>
                    </div>
                    <button className="btn btn-primary">Connect</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .collab-page {
          min-height: 100vh;
          padding-top: 80px;
          padding-bottom: 40px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        
        .text-muted {
          color: var(--color-text-muted);
        }
        
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 8px;
        }
        
        .tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--radius-lg);
          transition: all 0.2s;
        }
        
        .tab:hover {
          background: var(--color-bg-elevated);
        }
        
        .tab.active {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        .collaboration-grid, .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .collab-card, .suggestion-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          transition: all 0.2s;
        }
        
        .collab-card:hover, .suggestion-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }
        
        .collab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .collab-header h3 {
          font-size: 1.1rem;
          margin: 0;
        }
        
        .role-badge {
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .role-badge.owner {
          background: var(--color-gold-muted);
          color: var(--color-gold);
        }
        
        .role-badge.editor {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        .role-badge.viewer {
          background: var(--color-bg-elevated);
          color: var(--color-text-muted);
        }
        
        .collab-story {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .collab-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 16px;
        }
        
        .collaborators {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .collaborator-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }
        
        .collaborator-more {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--color-text-muted);
        }
        
        .suggestion-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-gold));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }
        
        .suggestion-card h3 {
          margin-bottom: 12px;
        }
        
        .expertise, .interests {
          margin-bottom: 12px;
        }
        
        .label {
          font-size: 12px;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 6px;
        }
        
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .tag {
          padding: 4px 10px;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 12px;
        }
        
        .tag.interest {
          background: var(--color-bg-elevated);
          color: var(--color-text-muted);
        }
        
        .connection-score {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 16px;
        }
        
        .suggestion-card .btn {
          width: 100%;
          justify-content: center;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        
        .empty-state h3 {
          margin-bottom: 8px;
        }
        
        .empty-state p {
          color: var(--color-text-muted);
          margin-bottom: 24px;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }
        
        .btn-primary {
          background: var(--color-primary);
          color: white;
        }
        
        .btn-secondary {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text);
        }
        
        .btn-primary:hover {
          background: var(--color-gold);
        }
        
        .btn-secondary:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 1.75rem;
          }
          
          .tabs {
            overflow-x: auto;
          }
          
          .collaboration-grid, .suggestions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
