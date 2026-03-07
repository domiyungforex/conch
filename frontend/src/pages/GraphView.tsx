// CONCH Platform - Graph View Page

import { useEffect, useState, useRef } from 'react'
import { fetchGraph } from '../lib/api'
import { useSSE } from '../hooks/useSSE'
import Loader from '../components/Loader'
import type { ConchGraph } from '../lib/types'

export default function GraphView() {
  const [graph, setGraph] = useState<ConchGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Connect to SSE for real-time updates
  useSSE()

  useEffect(() => {
    const loadGraph = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchGraph()
        setGraph(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph')
      } finally {
        setLoading(false)
      }
    }
    loadGraph()
  }, [])

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
              onClick={() => fetchGraph().then(setGraph).catch(console.error)}
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

        <div className="graph-stats">
          <div className="stat">
            <span className="stat-value">{graph?.nodes.length || 0}</span>
            <span className="stat-label">Nodes</span>
          </div>
          <div className="stat">
            <span className="stat-value">{graph?.edges.length || 0}</span>
            <span className="stat-label">Edges</span>
          </div>
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
                
                return (
                  <line 
                    key={`edge-${i}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(212, 175, 55, 0.3)"
                    strokeWidth="1"
                  />
                )
              })}
              
              {/* Nodes */}
              {graph.nodes.map((node) => {
                const x = (parseInt(node.id.slice(0, 8), 16) % 700) + 50
                const y = (parseInt(node.id.slice(8, 16), 16) % 500) + 50
                const radius = Math.max(20, Math.min(40, 20 + (node.era || 1) * 5))
                const isSelected = selectedNode === node.id
                
                return (
                  <g 
                    key={node.id} 
                    className={`graph-node ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={isSelected ? "rgba(212, 175, 55, 0.9)" : "rgba(30, 27, 75, 0.8)"}
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
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
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
          fill: rgba(212, 175, 55, 0.9);
          stroke-width: 3;
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
          gap: 24px;
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
        
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 1.75rem;
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
