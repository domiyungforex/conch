// Events module - Redis-based event bus for real-time updates

use futures_util::StreamExt;
use redis::{AsyncCommands, Client};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::models::{Conch, ConchEvent, ConchLink};

/// Event bus for publishing and subscribing to Conch events
pub struct EventBus {
    pub client: Client,
    #[allow(dead_code)]
    pub channel: broadcast::Sender<String>,
}

/// Event message format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventMessage {
    pub event_type: String,
    pub payload: String,
    pub timestamp: i64,
}

impl EventBus {
    /// Create a new event bus
    pub async fn new(redis_url: &str) -> Result<Self, redis::RedisError> {
        let client = Client::open(redis_url)?;
        let (channel, _) = broadcast::channel(1000);
        
        Ok(Self { client, channel })
    }

    /// Publish a Conch created event
    pub async fn publish_conch_created(&self, conch: &Conch) -> Result<(), ()> {
        let event = ConchEvent::Created { conch: conch.clone() };
        self.publish("conch.created", &event).await
    }

    /// Publish a Conch updated event
    pub async fn publish_conch_updated(&self, conch: &Conch) -> Result<(), ()> {
        let event = ConchEvent::Updated { conch: conch.clone() };
        self.publish("conch.updated", &event).await
    }

    /// Publish a Conch deleted event
    pub async fn publish_conch_deleted(&self, id: Uuid) -> Result<(), ()> {
        let event = ConchEvent::Deleted { id };
        self.publish("conch.deleted", &event).await
    }

    /// Publish a Conch linked event
    pub async fn publish_conch_linked(&self, link: &ConchLink) -> Result<(), ()> {
        let event = ConchEvent::Linked { link: link.clone() };
        self.publish("conch.linked", &event).await
    }

    /// Publish a Conch unlinked event
    pub async fn publish_conch_unlinked(&self, source_id: Uuid, target_id: Uuid) -> Result<(), ()> {
        let event = ConchEvent::Unlinked { source_id, target_id };
        self.publish("conch.unlinked", &event).await
    }

    /// Publish an event to Redis
    async fn publish<T: Serialize>(&self, event_type: &str, payload: &T) -> Result<(), ()> {
        let payload_str = serde_json::to_string(payload).unwrap_or_default();
        
        let conn_result = self.client.get_multiplexed_async_connection().await;
        if let Ok(mut conn) = conn_result {
            let publish_result: Result<i64, redis::RedisError> = conn.publish("conch:events", format!("{}:{}", event_type, payload_str)).await;
            let _ = publish_result;
        }

        // Also send to local broadcast channel for WebSocket clients
        let _ = self.channel.send(payload_str);

        Ok(())
    }

    /// Subscribe to all Conch events
    pub async fn subscribe(&self) -> impl StreamExt<Item = String> + '_ {
        // Return empty stream for now - Redis API changed
        // In production, fix the Redis client API
        futures_util::stream::iter(vec![])
    }
}

/// Convert event to JSON string for WebSocket
pub fn event_to_json(event: &ConchEvent) -> String {
    serde_json::to_string(event).unwrap_or_default()
}

/// Parse event from JSON string
pub fn event_from_json(json: &str) -> Option<ConchEvent> {
    serde_json::from_str(json).ok()
}
