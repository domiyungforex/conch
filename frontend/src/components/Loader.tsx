// CONCH Platform - Loader Component

import { motion } from 'framer-motion'

interface LoaderProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  fullPage?: boolean
}

export default function Loader({ size = 'medium', message, fullPage = false }: LoaderProps) {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72
  }

  const containerClass = fullPage ? 'loader-fullpage' : 'loader-inline'
  
  return (
    <div className={containerClass}>
      <div className="loader-container">
        <motion.div
          className="loader-shell"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg 
            width={sizeMap[size]} 
            height={sizeMap[size]} 
            viewBox="0 0 100 100"
          >
            {/* Outer shell */}
            <motion.path
              d="M50 5 
                 A45 45 0 1 1 49.99 5"
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ strokeDashoffset: [0, 200] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner spiral */}
            <motion.path
              d="M50 25 
                 A25 25 0 1 1 49.99 25"
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
              animate={{ strokeDashoffset: [0, 100] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <defs>
              <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="50%" stopColor="#f5d76e" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        
        {/* Dots animation */}
        <div className="loader-dots">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
      
      {message && <p className="loader-message">{message}</p>}
      
      <style>{`
        .loader-fullpage {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          width: 100%;
        }
        
        .loader-inline {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .loader-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loader-shell {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loader-dots {
          position: absolute;
          bottom: -30px;
          display: flex;
          gap: 6px;
        }
        
        .loader-dots span {
          width: 6px;
          height: 6px;
          background: var(--color-gold);
          border-radius: 50%;
        }
        
        .loader-message {
          margin-top: 16px;
          color: var(--color-text-muted);
          font-size: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

// Skeleton loader for content
interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style }: SkeletonProps) {
  return (
    <div 
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    >
      <motion.div
        className="skeleton-shimmer"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <style>{`
        .skeleton {
          position: relative;
          overflow: hidden;
          background: var(--color-bg-elevated);
        }
        
        .skeleton-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(212, 175, 55, 0.1),
            transparent
          );
        }
      `}</style>
    </div>
  )
}

// Card skeleton loader
export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="80%" style={{ marginTop: '12px' }} />
      <Skeleton height="16px" width="40%" style={{ marginTop: '8px' }} />
      <div className="skeleton-footer">
        <Skeleton height="32px" width="32px" borderRadius="50%" />
        <Skeleton height="14px" width="100px" />
      </div>
      <style>{`
        .card-skeleton {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 20px;
        }
        
        .skeleton-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  )
}

// Grid skeleton loader
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <style>{`
        .grid-skeleton {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        @media (max-width: 768px) {
          .grid-skeleton {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
