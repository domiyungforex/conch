// WebSocket module - Real-time connections

use axum::{
    extract::State,
    response::sse::{Event, Sse},
    routing::get,
    Router,
};
use futures::stream::{Stream, StreamExt};
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_stream::wrappers::BroadcastStream;

use crate::state::AppState;

/// WebSocket endpoint - uses Server-Sent Events for simplicity
pub async fn ws_handler(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let (tx, mut rx) = mpsc::channel::<String>(100);
    
    // Register the client
    {
        let mut manager = state.ws_manager.write().await;
        manager.add_client(tx).await;
    }
    
    // Create broadcast stream from the event sender
    let stream = BroadcastStream::new(state.event_sender.subscribe());
    
    // Create a stream that combines the receiver and broadcast
    let combined = futures::stream::select(
        // Stream from channel receiver
        async_stream::stream! {
            while let Some(msg) = rx.recv().await {
                yield Ok::<_, Infallible>(Event::default().data(msg));
            }
        },
        // Stream from broadcast
        stream.map(|msg| {
            match msg {
                Ok(data) => Ok(Event::default().data(data)),
                Err(_) => Ok(Event::default().data("error")),
            }
        }),
    );
    
    Sse::new(combined)
}

/// Events endpoint (Server-Sent Events for simpler clients)
pub async fn events_handler(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = BroadcastStream::new(state.event_sender.subscribe());
    
    let mapped = stream.map(|msg| {
        match msg {
            Ok(data) => Ok(Event::default().data(data)),
            Err(e) => Ok(Event::default().data(format!("Error: {}", e))),
        }
    });
    
    Sse::new(mapped)
}

/// Create WebSocket router
pub fn create_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/ws", get(ws_handler))
        .route("/events", get(events_handler))
}
