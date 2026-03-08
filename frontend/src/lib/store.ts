// CONCH Platform - Global State Store

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conch, ConchEvent } from './types'

interface ConchState {
  // Conches
  conches: Conch[]
  selectedConch: Conch | null
  loading: boolean
  error: string | null
  
  // Real-time events
  events: ConchEvent[]
  maxEvents: number
  
  // Auth
  token: string | null
  user: { id: string; username: string; email: string } | null
  
  // Theme
  theme: 'dark' | 'light'
  
  // Actions
  setConches: (conches: Conch[]) => void
  addConch: (conch: Conch) => void
  updateConch: (conch: Conch) => void
  removeConch: (id: string) => void
  setSelectedConch: (conch: Conch | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Events
  addEvent: (event: ConchEvent) => void
  clearEvents: () => void
  
  // Auth
  setToken: (token: string | null) => void
  setUser: (user: { id: string; username: string; email: string } | null) => void
  
  // Theme
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
}

export const useConchStore = create<ConchState>()(
  persist(
    (set, get) => ({
      // Initial state
      conches: [],
      selectedConch: null,
      loading: false,
      error: null,
      events: [],
      maxEvents: 50,
      token: localStorage.getItem('conch_token'),
      user: null,
      theme: 'dark',
      
      // Conch actions
      setConches: (conches) => set({ conches }),
      
      addConch: (conch) => set((state) => ({
        conches: [conch, ...state.conches]
      })),
      
      updateConch: (conch) => set((state) => ({
        conches: state.conches.map((c) => c.id === conch.id ? conch : c),
        selectedConch: state.selectedConch?.id === conch.id ? conch : state.selectedConch
      })),
      
      removeConch: (id) => set((state) => ({
        conches: state.conches.filter((c) => c.id !== id),
        selectedConch: state.selectedConch?.id === id ? null : state.selectedConch
      })),
      
      setSelectedConch: (conch) => set({ selectedConch: conch }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Event actions
      addEvent: (event) => set((state) => {
        const newEvents = [event, ...state.events].slice(0, state.maxEvents)
        return { events: newEvents }
      }),
      
      clearEvents: () => set({ events: [] }),
      
      // Auth actions
      setToken: (token) => {
        if (token) {
          localStorage.setItem('conch_token', token)
        } else {
          localStorage.removeItem('conch_token')
        }
        set({ token })
      },
      
      setUser: (user) => set({ user }),
      
      // Theme actions
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', newTheme)
        set({ theme: newTheme })
      },
    }),
    {
      name: 'conch-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        token: state.token 
      }),
    }
  )
)

// Apply theme on initial load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('conch-storage')
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme)
      if (parsed.state?.theme) {
        document.documentElement.setAttribute('data-theme', parsed.state.theme)
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }
}
