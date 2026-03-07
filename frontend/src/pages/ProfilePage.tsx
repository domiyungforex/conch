// CONCH Platform - User Profile & Settings Page

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useConchStore } from '../lib/store'

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

type TabType = 'profile' | 'appearance' | 'notifications' | 'activity'

export default function ProfilePage() {
  const { theme, toggleTheme } = useConchStore()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  
  // Profile state
  const [username, setUsername] = useState('ConchUser')
  const [email, setEmail] = useState('user@example.com')
  const [bio, setBio] = useState('Building the future of memory systems')
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mentions: true,
    follows: true,
    likes: true,
    comments: true,
    digest: 'daily'
  })
  
  const handleNotificationChange = (key: string, value: boolean | string) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: <UserIcon /> },
    { id: 'appearance' as TabType, label: 'Appearance', icon: <SettingsIcon /> },
    { id: 'notifications' as TabType, label: 'Notifications', icon: <BellIcon /> },
    { id: 'activity' as TabType, label: 'Activity', icon: <ActivityIcon /> },
  ]

  return (
    <div className="profile-page">
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="section-title">Settings</h1>
          
          {/* Tabs */}
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="settings-content">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card">
                  <h3 style={{ marginBottom: '24px', color: 'var(--color-gold)' }}>Personal Information</h3>
                  
                  {/* Avatar */}
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      <span>CU</span>
                    </div>
                    <div className="profile-avatar-actions">
                      <button className="btn btn-secondary">Change Avatar</button>
                      <button className="btn btn-ghost">Remove</button>
                    </div>
                  </div>
                  
                  {/* Form */}
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="input textarea"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                    <span className="form-hint">Brief description for your profile</span>
                  </div>
                  
                  <button className="btn btn-primary" style={{ marginTop: '16px' }}>
                    <SaveIcon />
                    Save Changes
                  </button>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card">
                  <h3 style={{ marginBottom: '24px', color: 'var(--color-gold)' }}>Theme Preferences</h3>
                  
                  <div className="theme-preview">
                    <div className="theme-option" onClick={() => theme !== 'dark' && toggleTheme()}>
                      <div className="theme-preview-card dark">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-content">
                          <div className="theme-preview-line"></div>
                          <div className="theme-preview-line short"></div>
                        </div>
                      </div>
                      <span>Dark Mode</span>
                      {theme === 'dark' && <span className="badge badge-primary">Active</span>}
                    </div>
                    
                    <div className="theme-option" onClick={() => theme !== 'light' && toggleTheme()}>
                      <div className="theme-preview-card light">
                        <div className="theme-preview-header"></div>
                        <div className="theme-preview-content">
                          <div className="theme-preview-line"></div>
                          <div className="theme-preview-line short"></div>
                        </div>
                      </div>
                      <span>Light Mode</span>
                      {theme === 'light' && <span className="badge badge-primary">Active</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card">
                  <h3 style={{ marginBottom: '24px', color: 'var(--color-gold)' }}>Notification Settings</h3>
                  
                  <div className="notification-settings">
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Email Notifications</span>
                        <span className="notification-desc">Receive notifications via email</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Push Notifications</span>
                        <span className="notification-desc">Receive push notifications in browser</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-divider"></div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Mentions</span>
                        <span className="notification-desc">When someone mentions you</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.mentions}
                          onChange={(e) => handleNotificationChange('mentions', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Follows</span>
                        <span className="notification-desc">When someone follows you</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.follows}
                          onChange={(e) => handleNotificationChange('follows', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Likes</span>
                        <span className="notification-desc">When someone likes your Conch</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.likes}
                          onChange={(e) => handleNotificationChange('likes', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Comments</span>
                        <span className="notification-desc">When someone comments on your Conch</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.comments}
                          onChange={(e) => handleNotificationChange('comments', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="notification-divider"></div>
                    
                    <div className="notification-item">
                      <div className="notification-info">
                        <span className="notification-label">Email Digest</span>
                        <span className="notification-desc">Summary of activity</span>
                      </div>
                      <select
                        className="select"
                        value={notifications.digest}
                        onChange={(e) => handleNotificationChange('digest', e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="realtime">Real-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card">
                  <h3 style={{ marginBottom: '24px', color: 'var(--color-gold)' }}>Activity History</h3>
                  
                  <div className="activity-filters">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">Created</button>
                    <button className="filter-btn">Updated</button>
                    <button className="filter-btn">Linked</button>
                  </div>
                  
                  <div className="activity-timeline">
                    <div className="activity-item">
                      <div className="activity-icon created">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      </div>
                      <div className="activity-content">
                        <span className="activity-text">Created new Conch</span>
                        <span className="activity-conch">"Memory Alpha"</span>
                        <span className="activity-time">2 hours ago</span>
                      </div>
                    </div>
                    
                    <div className="activity-item">
                      <div className="activity-icon updated">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </div>
                      <div className="activity-content">
                        <span className="activity-text">Updated Conch</span>
                        <span className="activity-conch">"Neural Network"</span>
                        <span className="activity-time">Yesterday</span>
                      </div>
                    </div>
                    
                    <div className="activity-item">
                      <div className="activity-icon linked">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      </div>
                      <div className="activity-content">
                        <span className="activity-text">Linked Conch</span>
                        <span className="activity-conch">"Memory Alpha" → "Neural Network"</span>
                        <span className="activity-time">3 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      
      <style>{`
        .profile-page {
          min-height: 100vh;
        }
        
        .settings-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          padding: 4px;
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          width: fit-content;
        }
        
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: transparent;
          color: var(--color-text-muted);
          border-radius: var(--radius-lg);
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          background: var(--color-white-10);
          color: var(--color-text);
        }
        
        .tab-btn.active {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        .settings-content {
          margin-top: 24px;
        }
        
        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary), var(--color-gold));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }
        
        .profile-avatar-actions {
          display: flex;
          gap: 8px;
        }
        
        .theme-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .theme-option {
          cursor: pointer;
          padding: 16px;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .theme-option:hover {
          border-color: var(--color-primary-muted);
        }
        
        .theme-preview-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        
        .theme-preview-card.dark {
          background: #0F0F0F;
        }
        
        .theme-preview-card.light {
          background: #FAF9F6;
        }
        
        .theme-preview-header {
          height: 24px;
          background: rgba(128, 128, 128, 0.2);
        }
        
        .theme-preview-content {
          padding: 12px;
        }
        
        .theme-preview-line {
          height: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        
        .theme-preview-card.dark .theme-preview-line {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .theme-preview-card.light .theme-preview-line {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .theme-preview-line.short {
          width: 60%;
        }
        
        .notification-settings {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }
        
        .notification-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .notification-label {
          font-weight: 500;
          color: var(--color-text);
        }
        
        .notification-desc {
          font-size: 14px;
          color: var(--color-text-muted);
        }
        
        .notification-divider {
          height: 1px;
          background: var(--color-border);
          margin: 8px 0;
        }
        
        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }
        
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          transition: 0.3s;
          border-radius: 26px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--color-text-muted);
          transition: 0.3s;
          border-radius: 50%;
        }
        
        .toggle input:checked + .toggle-slider {
          background-color: var(--color-primary-muted);
          border-color: var(--color-primary);
        }
        
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
          background-color: var(--color-primary);
        }
        
        .activity-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .activity-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .activity-item {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: var(--color-bg-elevated);
          border-radius: var(--radius-lg);
        }
        
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .activity-icon.created {
          background: var(--color-success-muted);
          color: var(--color-success);
        }
        
        .activity-icon.updated {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }
        
        .activity-icon.linked {
          background: var(--color-info-muted);
          color: var(--color-info);
        }
        
        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-text {
          font-weight: 500;
          color: var(--color-text);
        }
        
        .activity-conch {
          color: var(--color-gold);
          font-size: 14px;
        }
        
        .activity-time {
          color: var(--color-text-muted);
          font-size: 12px;
        }
        
        @media (max-width: 640px) {
          .theme-preview {
            grid-template-columns: 1fr;
          }
          
          .profile-avatar-section {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .settings-tabs {
            width: 100%;
            overflow-x: auto;
          }
          
          .tab-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
