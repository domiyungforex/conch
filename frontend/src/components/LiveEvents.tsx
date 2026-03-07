// CONCH Platform - Live Events Panel

import { useState } from 'react'
import { useConchStore } from '../lib/store'
import type { ConchEvent } from '../lib/types'

export default function LiveEvents() {
  const { events } = useConchStore()
  const [isOpen, setIsOpen] = useState(false)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'conch_created': return '✨'
      case 'conch_updated': return '🔄'
      case 'conch_deleted': return '🗑️'
      case 'link_created': return '⛓️'
      case 'link_deleted': return '🔗'
      default: return '•'
    }
  }

  const getEventDescription = (event: ConchEvent) => {
    switch (event.type) {
      case 'conch_created':
        return `New Conch created: ${event.conch?.intent || 'Unknown'}`
      case 'conch_updated':
        return `Conch updated: ${event.conch?.intent || 'Unknown'}`
      case 'conch_deleted':
        return `Conch deleted`
      case 'link_created':
        return `Conches linked`
      case 'link_deleted':
        return `Conches unlinked`
      default:
        return 'Unknown event'
    }
  }

  const formatEventType = (type: string) => {
    return type.replace('conch_', '').replace('link_', '').replace('_', ' ').toUpperCase()
  }

  return (
    <>
      <button 
        className={`events-toggle ${events.length > 0 ? 'has-events' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle live events"
      >
        <span className="events-icon">{isOpen ? '✕' : '📡'}</span>
        {events.length > 0 && !isOpen && (
          <span className="events-badge">{events.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="events-panel">
          <div className="events-header">
            <h3>Live Events</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close events panel">×</button>
          </div>
          <div className="events-list">
            {events.length === 0 ? (
              <p className="no-events">No recent events</p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="event-item">
                  <span className={`event-icon ${event.type?.replace('conch_', '').replace('link_', '')}`}>
                    {getEventIcon(event.type)}
                  </span>
                  <div className="event-content">
                    <span className="event-type">{formatEventType(event.type)}</span>
                    <p className="event-description">{getEventDescription(event)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
