// CONCH Platform - Landing Page

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchConches } from '../lib/api'
import { useSSE } from '../hooks/useSSE'
import type { Conch } from '../lib/types'

export default function LandingPage() {
  const [conches, setConches] = useState<Conch[]>([])
  const [loading, setLoading] = useState(true)

  // Connect to SSE for real-time updates
  useSSE()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchConches(1, 100)
        setConches(data)
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  // Calculate live stats
  const totalConches = conches.length
  const totalEras = conches.length > 0 ? Math.max(...conches.map(c => c.era)) : 0
  const totalLinks = conches.reduce((acc, c) => acc + (c.lineage?.length || 0), 0)

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="spiral"></div>
        </div>
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              <span className="gradient-text">Conch</span>
            </h1>
            <p className="hero-subtitle">
              A living memory system where knowledge grows in spirals.
              Each conch carries a story, each link builds wisdom.
            </p>
            <div className="hero-actions">
              <Link to="/create" className="btn btn-primary btn-large">
                Create a Conch
              </Link>
              <Link to="/explore" className="btn btn-secondary btn-large">
                Explore
              </Link>
            </div>
          </motion.div>
          
          {/* Live Stats */}
          <motion.div 
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="stat-item">
              <span className="stat-number">{loading ? '...' : totalConches}</span>
              <span className="stat-label">Conches</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{loading ? '...' : totalEras}</span>
              <span className="stat-label">Eras</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{loading ? '...' : totalLinks}</span>
              <span className="stat-label">Links</span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* What is Conch */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">What is Conch?</h2>
            <div className="content-grid">
              <div className="content-card">
                <div className="card-icon">🐚</div>
                <h3>A Living Memory</h3>
                <p>
                  Each Conch is a node in a distributed memory network. 
                  Born from intent, carrying story, connected through lineage.
                </p>
              </div>
              <div className="content-card">
                <div className="card-icon">⛓️</div>
                <h3>Linked & Living</h3>
                <p>
                  Conches link to form a growing graph of knowledge. 
                  Each link creates meaning, each connection builds wisdom.
                </p>
              </div>
              <div className="content-card">
                <div className="card-icon">📈</div>
                <h3>Era by Era</h3>
                <p>
                  Every update advances the era. The history is preserved,
                  the lineage grows, the memory evolves.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section section-dark">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Philosophy</h2>
            <div className="philosophy-grid">
              <div className="philosophy-card">
                <span className="philosophy-number">01</span>
                <h3>The Spiral</h3>
                <p>
                  Like the nautilus shell, knowledge grows in spirals. 
                  Each era builds upon the last, expanding outward while 
                  maintaining the core.
                </p>
              </div>
              <div className="philosophy-card">
                <span className="philosophy-number">02</span>
                <h3>Living Data</h3>
                <p>
                  Information is not static. It's alive, breathing, evolving.
                  Conches update in real-time, pushing changes instantly.
                </p>
              </div>
              <div className="philosophy-card">
                <span className="philosophy-number">03</span>
                <h3>Permissioned Memory</h3>
                <p>
                  Not all knowledge is for everyone. Fine-grained permissions
                  ensure the right people see the right things.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Create</h3>
                  <p>Forge a new Conch with your story, intent, and initial state.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Link</h3>
                  <p>Connect your Conch to others, building the memory graph.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Evolve</h3>
                  <p>Update your Conch across eras, preserving history.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Explore</h3>
                  <p>Navigate the graph, discover connections, find wisdom.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>CONCH Platform v0.1.0 — A Living Memory System</p>
        </div>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
        }
        
        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: 80px;
          overflow: hidden;
        }
        
        .hero-background {
          position: absolute;
          inset: 0;
          z-index: -1;
        }
        
        .spiral {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 800px;
          height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            rgba(212, 175, 55, 0.15) 0%,
            transparent 70%
          );
          animation: pulse 8s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }
        
        .hero-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .hero-title {
          font-size: 5rem;
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: -2px;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, var(--color-primary), var(--color-gold));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--color-text-muted);
          margin-bottom: 40px;
          line-height: 1.6;
        }
        
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 32px;
          margin-top: 60px;
          padding: 24px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-gold);
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--color-text-muted);
        }
        
        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--color-border);
        }
        
        /* Sections */
        .section {
          padding: 100px 0;
        }
        
        .section-dark {
          background: var(--color-bg-card);
        }
        
        .section-title {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 48px;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        
        .content-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .content-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-4px);
        }
        
        .card-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .content-card h3 {
          margin-bottom: 12px;
          color: var(--color-gold);
        }
        
        .content-card p {
          color: var(--color-text-muted);
          line-height: 1.6;
        }
        
        /* Philosophy */
        .philosophy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        
        .philosophy-card {
          padding: 32px;
          border-left: 2px solid var(--color-primary);
        }
        
        .philosophy-number {
          display: block;
          font-size: 3rem;
          font-weight: 700;
          color: var(--color-primary-muted);
          margin-bottom: 16px;
        }
        
        .philosophy-card h3 {
          margin-bottom: 12px;
          color: var(--color-text);
        }
        
        .philosophy-card p {
          color: var(--color-text-muted);
          line-height: 1.6;
        }
        
        /* Steps */
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        
        .step {
          display: flex;
          gap: 20px;
          padding: 24px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        
        .step-number {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 1.25rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .step-content h3 {
          margin-bottom: 8px;
        }
        
        .step-content p {
          color: var(--color-text-muted);
          font-size: 14px;
          line-height: 1.5;
        }
        
        /* Footer */
        .footer {
          padding: 40px 0;
          text-align: center;
          border-top: 1px solid var(--color-border);
          color: var(--color-text-muted);
        }
        
        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: var(--radius-lg);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }
        
        .btn-large {
          padding: 16px 32px;
          font-size: 18px;
        }
        
        .btn-primary {
          background: var(--color-primary);
          color: white;
        }
        
        .btn-primary:hover {
          background: var(--color-gold);
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          color: var(--color-text);
        }
        
        .btn-secondary:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
          
          .hero-stats {
            flex-direction: column;
            gap: 16px;
          }
          
          .stat-divider {
            width: 60px;
            height: 1px;
          }
          
          .section-title {
            font-size: 1.75rem;
          }
          
          .section {
            padding: 60px 0;
          }
        }
      `}</style>
    </div>
  )
}
