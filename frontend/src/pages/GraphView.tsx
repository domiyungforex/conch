// CONCH Platform - Graph View Page

import { useEffect, useState, useRef, useMemo } from 'react'
import { fetchGraph, type GraphFilters } from '../lib/api'
import { useSSE } from '../hooks/useSSE'
import Loader from '../components/Loader'
import type { ConchGraph } from '../lib/types'

type SortOption = 'created_at' | 'updated_at' | 'era'

export default function GraphView() {
  const [graph, setGraph] = useState<ConchGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Filter state
  const [authorFilter, setAuthorFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('created_at')
  const [highlightTag, setHighlightTag] = useState('')
  const [highlightState, setHighlightState] = useState('')
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableStates, setAvailableStates] = useState<string[]>([])

  // Connect to SSE for real-time updates
  useSSE()

  // Load graph with filters
  const loadGraph = async (filters?: GraphFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGraph(filters)
      setGraph(data)
      
      // Extract unique authors, tags, and states for filter dropdowns
      if (data.nodes.length > 0) {
        const authors = [...new Set(data.nodes.map(n => n.owner).filter(Boolean))]
        setAvailableAuthors(authors)
        
        // Extract state types from nodes
        const states = [...new Set(data.nodes.map(n => n.state?.type || 'unknown').filter(Boolean))]
        setAvailableStates(states as unknown as string[])
        
        // For tags, we'd need them from the backend - placeholder
        setAvailableTags(['memory', 'knowledge', 'experience', 'wisdom'])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [])

  const handleApplyFilters = () => {
    const filters: GraphFilters = {}
    if (authorFilter) filters.author = authorFilter
    if (sortBy) filters.sortBy = sortBy
    if (highlightTag) filters.tags = [highlightTag]
    if (highlightState) filters.state = highlightState
    loadGraph(filters)
  }

  const handleClearFilters = () => {
    setAuthorFilter('')
    setSortBy('created_at')
    setHighlightTag('')
    setHighlightState('')
    loadGraph()
  }

  // Get unique tags from selected nodes for cluster highlighting
  const highlightedCluster = useMemo(() => {
    if (!graph || !highlightTag) return new Set<string>()
    // In a real implementation, this would highlight connected nodes with same tags
    return new Set(graph.nodes.filter(n => 
      (n.state as any)?.tags?.includes(highlightTag)
    ).map(n => n.id))
  }, [graph, highlightTag])

  if (loading) {
    return (
      <div className="graph-page">
        <div className="container">
          <Loader fullPage message="Loading graph..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="graph-page">
        <div className="container">
          <div className="error-container">
            <h2>Graph Error</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => loadGraph()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="graph-page">
      <div className="container">
        <header className="page-header">
          <h1>Conch Graph</h1>
          <p className="text-muted">Visualize the connected memory network</p>
        </header>

        {/* Filter Controls */}
        <div className="graph-filters">
          <div className="filter-group">
            <label>Author</label>
            <select 
              value={authorFilter} 
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Authors</option>
              {availableAuthors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="filter-select"
            >
              <option value="created_at">Creation Date</option>
              <option value="updated_at">Last Updated</option>
              <option value="era">Era</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Highlight Tag</label>
            <select 
              value={highlightTag} 
              onChange={(e) => setHighlightTag(e.target.value)}
              className="filter-select"
            >
              <option value="">None</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Highlight State</label>
            <select 
              value={highlightState} 
              onChange={(e) => setHighlightState(e.target.value)}
              className="filter-select"
            >
              <option value="">All States</option>
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </div>

        <div className="graph-stats">
          <div className="stat">
            <span className="stat-value">{graph?.nodes.length || 0}</span>
            <span className="stat-label">Nodes</span>
          </div>
          <div className="stat">
            <span className="stat-value">{graph?.edges.length || 0}</span>
            <span className="stat-label">Edges</span>
          </div>
          {(authorFilter || highlightTag || highlightState) && (
            <div className="stat filter-active">
              <span className="stat-label">Filters Active</span>
            </div>
          )}
        </div>

        <div className="graph-container" ref={containerRef}>
          {(!graph || graph.nodes.length === 0) ? (
            <div className="empty-state">
              <p>No nodes in the graph yet</p>
              <p className="text-muted">Create your first Conch to start building the graph</p>
            </div>
          ) : (
            <svg className="graph-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
              {/* Edges */}
              {graph.edges.map((edge, i) => {
                const source = graph.nodes.find(n => n.id === edge.source)
                const target = graph.nodes.find(n => n.id === edge.target)
                if (!source || !target) return null
                
                const x1 = (parseInt(source.id.slice(0, 8), 16) % 700) + 50
                const y1 = (parseInt(source.id.slice(8, 16), 16) % 500) + 50
                const x2 = (parseInt(target.id.slice(0, 8), 16) % 700) + 50
                const y2 = (parseInt(target.id.slice(8, 16), 16) % 500) + 50
                
                const isHighlighted = highlightedCluster.has(source.id) && highlightedCluster.has(target.id)
                
                return (
                  <line 
                    key={`edge-${i}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isHighlighted ? "rgba(255, 111, 97, 0.8)" : "rgba(212, 175, 55, 0.3)"}
                    strokeWidth={isHighlighted ? "2" : "1"}
                  />
                )
              })}
              
              {/* Nodes */}
              {graph.nodes.map((node) => {
                const x = (parseInt(node.id.slice(0, 8), 16) % 700) + 50
                const y = (parseInt(node.id.slice(8, 16), 16) % 500) + 50
                const radius = Math.max(20, Math.min(40, 20 + (node.era || 1) * 5))
                const isSelected = selectedNode === node.id
                const isHighlighted = highlightState && node.state?.type === highlightState
                const isInCluster = highlightedCluster.has(node.id)
                
                return (
                  <g 
                    key={node.id} 
                    className={`graph-node ${isSelected ? 'selected' : ''} ${isHighlighted || isInCluster ? 'highlighted' : ''}`}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={isSelected ? "rgba(255, 111, 97, 0.9)" : isHighlighted || isInCluster ? "rgba(212, 175, 55, 0.7)" : "rgba(30, 27, 75, 0.8)"}
                      stroke="url(#goldGradient)"
                      strokeWidth={isSelected ? "3" : "2"}
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#f8fafc"
                      fontSize="10"
                    >
                      {node.era || 1}
                    </text>
                    <title>{node.intent || 'Untitled'}</title>
                  </g>
                )
              })}
              
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#f5d76e" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* Selected Node Info */}
        {selectedNode && graph && (
          <div className="node-info">
            {(() => {
              const node = graph.nodes.find(n => n.id === selectedNode)
              if (!node) return null
              return (
                <>
                  <h3>{node.intent || 'Untitled'}</h3>
                  <p>{node.story?.substring(0, 100) || 'No description'}...</p>
                  <div className="node-meta">
                    <span>Era: {node.era}</span>
                    <span>Owner: {node.owner}</span>
                    <span>State: {(node.state as any)?.type || 'unknown'}</span>
                    <span>Created: {new Date(node.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(node.updated_at).toLocaleDateString()}</span>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
      
      <style>{`
        .graph-page {
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
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        
        /* Filter Styles */
        .graph-filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          margin-bottom: 24px;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }
        
        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .filter-select {
          padding: 10px 14px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          color: var(--color-text);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-muted);
        }
        
        .filter-actions {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        
        .graph-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          padding: 16px 24px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }
        
        .stat.filter-active {
          border-color: var(--color-primary);
          background: var(--color-primary-muted);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-primary);
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--color-text-muted);
        }
        
        .graph-container {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .graph-svg {
          width: 100%;
          max-width: 800px;
          height: auto;
          max-height: 600px;
        }
        
        .graph-node {
          transition: all 0.2s ease;
        }
        
        .graph-node:hover circle {
          fill: rgba(212, 175, 55, 0.7);
        }
        
        .graph-node.selected circle {
          fill: rgba(255, 111, 97, 0.9);
          stroke-width: 3;
        }
        
        .graph-node.highlighted circle {
          fill: rgba(212, 175, 55, 0.7);
          filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
        }
        
        .node-info {
          margin-top: 24px;
          padding: 20px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        
        .node-info h3 {
          margin-bottom: 8px;
          color: var(--color-gold);
        }
        
        .node-info p {
          color: var(--color-text-muted);
          margin-bottom: 12px;
        }
        
        .node-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 14px;
          color: var(--color-text-muted);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        
        .empty-state p {
          margin-bottom: 8px;
        }
        
        .error-container {
          text-align: center;
          padding: 60px 20px;
        }
        
        .error-container h2 {
          margin-bottom: 16px;
        }
        
        .error-container p {
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
        
        .btn-primary:hover {
          background: var(--color-gold);
        }
        
        .btn-secondary {
          background: transparent;
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
        }
        
        .btn-secondary:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        .text-muted {
          color: var(--color-text-muted);
        }
        
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 1.75rem;
          }
          
          .graph-filters {
            flex-direction: column;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .filter-actions {
            width: 100%;
          }
          
          .filter-actions .btn {
            flex: 1;
            justify-content: center;
          }
          
          .graph-stats {
            flex-direction: column;
            gap: 12px;
          }
          
          .stat {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          
          .graph-container {
            min-height: 400px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
