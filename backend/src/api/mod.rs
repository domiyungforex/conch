// API handlers module

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db;
use crate::state::AppState;

/// List query parameters
#[derive(Deserialize)]
pub struct ListQuery {
    page: Option<i32>,
    page_size: Option<i32>,
}

/// Standard API response wrapper
pub fn success_response<T: Serialize>(data: T) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "success": true,
        "data": data
    }))
}

/// Error response
pub fn error_response(message: &str, status: StatusCode) -> (StatusCode, Json<serde_json::Value>) {
    (status, Json(serde_json::json!({
        "success": false,
        "error": message
    })))
}

/// Health check endpoint
pub async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "conch-api",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

/// List all conches
pub async fn list_conches(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    
    match db::list_conches(&state.db, page, page_size).await {
        Ok(conches) => Ok(success_response(conches)),
        Err(e) => Err(error_response(&format!("Failed to list conches: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Get a single conch by ID
pub async fn get_conch(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match db::get_conch(&state.db, id).await {
        Ok(Some(conch)) => Ok(success_response(conch)),
        Ok(None) => Err(error_response("Conch not found", StatusCode::NOT_FOUND)),
        Err(e) => Err(error_response(&format!("Failed to get conch: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Create conch request
#[derive(Deserialize)]
pub struct CreateConchRequest {
    pub state: Option<serde_json::Value>,
    pub story: Option<String>,
    pub intent: Option<String>,
    pub owner: Option<String>,
}

/// Create a new conch
pub async fn create_conch(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateConchRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let state_ref = state.as_ref();
    
    let state_json = payload.state.unwrap_or(serde_json::json!({}));
    let story = payload.story.unwrap_or_default();
    let intent = payload.intent.unwrap_or_default();
    let owner = payload.owner.unwrap_or_else(|| "anonymous".to_string());
    
    match db::create_conch(&state_ref.db, state_json, story, intent, &owner).await {
        Ok(conch) => {
            // Broadcast the event
            let event = serde_json::json!({
                "type": "conch_created",
                "data": &conch
            });
            let _ = state_ref.event_sender.send(event.to_string());
            
            // Broadcast via WebSocket
            let ws_manager = state_ref.ws_manager.read().await;
            ws_manager.broadcast(&event.to_string()).await;
            
            Ok(success_response(conch))
        }
        Err(e) => Err(error_response(&format!("Failed to create conch: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Update conch request
#[derive(Deserialize)]
pub struct UpdateConchRequest {
    pub state: Option<serde_json::Value>,
    pub story: Option<String>,
    pub intent: Option<String>,
}

/// Update a conch
pub async fn update_conch(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateConchRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let state_ref = state.as_ref();
    
    let conch = match db::get_conch(&state_ref.db, id).await {
        Ok(Some(c)) => c,
        Ok(None) => return Err(error_response("Conch not found", StatusCode::NOT_FOUND)),
        Err(e) => return Err(error_response(&format!("Failed to get conch: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    };
    
    let state_json = payload.state.unwrap_or(serde_json::json!({}));
    let story = payload.story.or_else(|| conch.get("story").and_then(|s| s.as_str()).map(String::from)).unwrap_or_default();
    let intent = payload.intent.or_else(|| conch.get("intent").and_then(|s| s.as_str()).map(String::from)).unwrap_or_default();
    
    match db::update_conch(&state_ref.db, id, state_json, story, intent).await {
        Ok(Some(updated)) => {
            // Broadcast the event
            let event = serde_json::json!({
                "type": "conch_updated",
                "data": &updated
            });
            let _ = state_ref.event_sender.send(event.to_string());
            
            // Broadcast via WebSocket
            let ws_manager = state_ref.ws_manager.read().await;
            ws_manager.broadcast(&event.to_string()).await;
            
            Ok(success_response(updated))
        }
        Ok(None) => Err(error_response("Conch not found", StatusCode::NOT_FOUND)),
        Err(e) => Err(error_response(&format!("Failed to update conch: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Delete a conch
pub async fn delete_conch(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let state_ref = state.as_ref();
    
    match db::delete_conch(&state_ref.db, id).await {
        Ok(true) => {
            // Broadcast the event
            let event = serde_json::json!({
                "type": "conch_deleted",
                "data": { "id": id.to_string() }
            });
            let _ = state_ref.event_sender.send(event.to_string());
            
            // Broadcast via WebSocket
            let ws_manager = state_ref.ws_manager.read().await;
            ws_manager.broadcast(&event.to_string()).await;
            
            Ok(success_response(serde_json::json!({ "deleted": true })))
        }
        Ok(false) => Err(error_response("Conch not found", StatusCode::NOT_FOUND)),
        Err(e) => Err(error_response(&format!("Failed to delete conch: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Create link request
#[derive(Deserialize)]
pub struct CreateLinkRequest {
    pub target_id: uuid::Uuid,
    pub link_type: Option<String>,
}

/// Create a link between two conches
pub async fn create_link(
    State(state): State<Arc<AppState>>,
    Path(source_id): Path<uuid::Uuid>,
    Json(payload): Json<CreateLinkRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let state_ref = state.as_ref();
    
    // Verify source exists
    match db::get_conch(&state_ref.db, source_id).await {
        Ok(None) => return Err(error_response("Source conch not found", StatusCode::NOT_FOUND)),
        Err(e) => return Err(error_response(&format!("Failed to verify source: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
        _ => {}
    }
    
    // Verify target exists
    match db::get_conch(&state_ref.db, payload.target_id).await {
        Ok(None) => return Err(error_response("Target conch not found", StatusCode::NOT_FOUND)),
        Err(e) => return Err(error_response(&format!("Failed to verify target: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
        _ => {}
    }
    
    let link_type = payload.link_type.unwrap_or_else(|| "references".to_string());
    
    match db::create_link(&state_ref.db, source_id, payload.target_id, link_type).await {
        Ok(link) => {
            // Broadcast the event
            let event = serde_json::json!({
                "type": "link_created",
                "data": &link
            });
            let _ = state_ref.event_sender.send(event.to_string());
            
            // Broadcast via WebSocket
            let ws_manager = state_ref.ws_manager.read().await;
            ws_manager.broadcast(&event.to_string()).await;
            
            Ok(success_response(link))
        }
        Err(e) => Err(error_response(&format!("Failed to create link: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Get links for a conch
pub async fn get_links(
    State(state): State<Arc<AppState>>,
    Path(conch_id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match db::get_links(&state.db, conch_id).await {
        Ok(links) => Ok(success_response(links)),
        Err(e) => Err(error_response(&format!("Failed to get links: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Get all links (for graph view)
pub async fn get_all_links(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match db::get_all_links(&state.db).await {
        Ok(links) => Ok(success_response(links)),
        Err(e) => Err(error_response(&format!("Failed to get links: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    }
}

/// Get conches with their links (for graph view)
pub async fn get_graph_data(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let conches = match db::list_conches(&state.db, 1, 1000).await {
        Ok(c) => c,
        Err(e) => return Err(error_response(&format!("Failed to get conches: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    };
    
    let links = match db::get_all_links(&state.db).await {
        Ok(l) => l,
        Err(e) => return Err(error_response(&format!("Failed to get links: {}", e), StatusCode::INTERNAL_SERVER_ERROR)),
    };
    
    Ok(success_response(serde_json::json!({
        "conches": conches,
        "links": links
    })))
}

/// Create router with all routes
pub fn create_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/health", get(health))
        .route("/conches", get(list_conches))
        .route("/conches", post(create_conch))
        .route("/conches/:id", get(get_conch))
        .route("/conches/:id", put(update_conch))
        .route("/conches/:id", delete(delete_conch))
        .route("/conches/:id/links", get(get_links))
        .route("/conches/:id/links", post(create_link))
        .route("/links", get(get_all_links))
        .route("/graph", get(get_graph_data))
}
