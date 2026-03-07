// CONCH Platform - Hero Component

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useConchStore } from '../lib/store'
import './Hero.css'

export default function Hero() {
  const { theme } = useConchStore()
  
  const spiralColor1 = theme === 'dark' ? '#ffffff' : '#FF6F61'
  const spiralColor2 = theme === 'dark' ? '#e0e0e0' : '#FF8A7D'
  
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="spiral-glow"></div>
        <div className="grid-overlay"></div>
      </div>
      
      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="hero-title">
            <span className="title-line">The Spiral</span>
            <span className="title-line accent">Remembers</span>
          </h1>
        </motion.div>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          A living memory system where Conches are born, linked, and evolve through eras.
          Each spiral holds a story, a lineage, a purpose.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link to="/feed" className="btn btn-primary">
            Enter the Archive
          </Link>
          <Link to="/create" className="btn btn-secondary">
            Create a Conch
          </Link>
        </motion.div>

        <motion.div
          className="hero-conch"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <svg className="hero-spiral" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={spiralColor1} />
                <stop offset="50%" stopColor={spiralColor2} />
                <stop offset="100%" stopColor={spiralColor1} />
              </linearGradient>
            </defs>
            <path
              d="M100 100 m0 0"
              fill="none"
              stroke="url(#spiralGradient)"
              strokeWidth="1"
            >
              <animate
                attributeName="d"
                dur="10s"
                repeatCount="indefinite"
                values={spiralPath(0) + ';' + spiralPath(360) + ';' + spiralPath(0)}
              />
            </path>
            {[...Array(5)].map((_, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={30 + i * 25}
                fill="none"
                stroke="url(#spiralGradient)"
                strokeWidth={2 - i * 0.3}
                opacity={0.8 - i * 0.15}
              />
            ))}
          </svg>
        </motion.div>
      </div>

      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span>Scroll to explore</span>
        <div className="scroll-arrow"></div>
      </motion.div>
    </section>
  )
}

function spiralPath(angle: number): string {
  const cx = 100, cy = 100
  let path = `M${cx} ${cy}`
  
  for (let t = 0; t < angle; t += 5) {
    const rad = (t * Math.PI) / 180
    const r = 2 + t * 0.5
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)
    path += ` L${x} ${y}`
  }
  
  return path
}
