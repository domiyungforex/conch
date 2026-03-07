// State module - Application state shared across the API

use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

use crate::db::DbPool;
use crate::events::EventBus;

/// WebSocket connection manager
#[derive(Clone)]
pub struct WebSocketManager {
    clients: Vec<tokio::sync::mpsc::Sender<String>>,
}

impl WebSocketManager {
    pub fn new() -> Self {
        Self {
            clients: Vec::new(),
        }
    }

    pub async fn add_client(&mut self, sender: tokio::sync::mpsc::Sender<String>) {
        self.clients.push(sender);
    }

    pub async fn remove_client(&mut self, sender: &tokio::sync::mpsc::Sender<String>) {
        self.clients.retain(|s| !std::ptr::eq(s, sender));
    }

    pub async fn broadcast(&self, message: &str) {
        for sender in &self.clients {
            let _ = sender.send(message.to_string()).await;
        }
    }
}

/// Application state
pub struct AppState {
    pub db: DbPool,
    pub event_bus: Arc<RwLock<Option<EventBus>>>,
    pub ws_manager: Arc<RwLock<WebSocketManager>>,
    pub event_sender: broadcast::Sender<String>,
}

impl AppState {
    pub async fn new(pool: DbPool, redis_url: Option<&str>) -> Self {
        let event_bus = if let Some(url) = redis_url {
            let bus = EventBus::new(url).await.ok();
            Arc::new(RwLock::new(bus))
        } else {
            Arc::new(RwLock::new(None))
        };
        
        let ws_manager = Arc::new(RwLock::new(WebSocketManager::new()));
        let (event_sender, _) = broadcast::channel(100);
        
        Self {
            db: pool,
            event_bus,
            ws_manager,
            event_sender,
        }
    }
}
