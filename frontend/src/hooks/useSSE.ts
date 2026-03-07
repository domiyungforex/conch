// CONCH Platform - Server-Sent Events Hook

import { useEffect, useRef, useCallback } from 'react'
import { useConchStore } from '../lib/store'
import type { ConchEvent } from '../lib/types'

const API_BASE = '/api'

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const { addEvent, addConch, updateConch, removeConch } = useConchStore()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = localStorage.getItem('conch_token')
    const url = token 
      ? `${API_BASE}/events?token=${token}`
      : `${API_BASE}/events`

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connected')
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
      // Reconnect after 5 seconds
      setTimeout(() => connect(), 5000)
    }

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE message:', data)
      } catch (e) {
        console.error('Failed to parse SSE message:', e)
      }
    })

    eventSource.addEventListener('conch_created', (event) => {
      try {
        const data = JSON.parse(event.data)
        const conchEvent: ConchEvent = {
          type: 'Created',
          conch: data,
        }
        addEvent(conchEvent)
        addConch(data)
      } catch (e) {
        console.error('Failed to parse conch_created event:', e)
      }
    })

    eventSource.addEventListener('conch_updated', (event) => {
      try {
        const data = JSON.parse(event.data)
        const conchEvent: ConchEvent = {
          type: 'Updated',
          conch: data,
        }
        addEvent(conchEvent)
        updateConch(data)
      } catch (e) {
        console.error('Failed to parse conch_updated event:', e)
      }
    })

    eventSource.addEventListener('conch_deleted', (event) => {
      try {
        const data = JSON.parse(event.data)
        const conchEvent: ConchEvent = {
          type: 'Deleted',
          id: data.id,
        }
        addEvent(conchEvent)
        removeConch(data.id)
      } catch (e) {
        console.error('Failed to parse conch_deleted event:', e)
      }
    })

    eventSource.addEventListener('conch_linked', (event) => {
      try {
        const data = JSON.parse(event.data)
        const conchEvent: ConchEvent = {
          type: 'Linked',
          link: data,
        }
        addEvent(conchEvent)
      } catch (e) {
        console.error('Failed to parse conch_linked event:', e)
      }
    })

  }, [addEvent, addConch, updateConch, removeConch])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // We don't return connect as it's called automatically in useEffect
  return { disconnect }
}

// Hook to fetch initial data and subscribe to updates
export function useConches(initialPage = 1, pageSize = 20) {
  const { setConches, setLoading, setError, conches } = useConchStore()
  useSSE() // Auto-connect for real-time updates

  const fetchConches = useCallback(async (page = initialPage, size = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE}/conches?page=${page}&page_size=${size}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conches: ${response.status}`)
      }
      
      const text = await response.text()
      if (!text) {
        setConches([])
        return
      }
      
      const data = JSON.parse(text)
      let conchList = []
      
      if (data && typeof data === 'object' && 'success' in data) {
        conchList = data.data || []
      } else if (Array.isArray(data)) {
        conchList = data
      }
      
      setConches(conchList)
    } catch (err) {
      console.error('Failed to fetch conches:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch conches')
      setConches([])
    } finally {
      setLoading(false)
    }
  }, [setConches, setLoading, setError, initialPage, pageSize])

  return { conches, fetchConches }
}
