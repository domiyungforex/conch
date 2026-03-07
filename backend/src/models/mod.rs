// CONCH Models - Core Data Structures
// The Conch data model with all fields, permissions, and types

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use axum::response::IntoResponse;

/// A Conch is a living memory node in the system
/// Each Conch has state, story, lineage, and can be linked to other Conches
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conch {
    pub id: Uuid,
    pub state: serde_json::Value,
    pub story: String,
    pub lineage: Vec<Uuid>,
    pub intent: String,
    pub era: i32,
    pub owner: String,
    pub permissions: serde_json::Value,
    pub signature: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Permissions for a Conch - defines who can do what
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permissions {
    pub owner: PermissionLevel,
    pub readers: Vec<PermissionEntry>,
    pub writers: Vec<PermissionEntry>,
    pub inheritors: Vec<PermissionEntry>,
}

impl Default for Permissions {
    fn default() -> Self {
        Self {
            owner: PermissionLevel::Admin,
            readers: vec![],
            writers: vec![],
            inheritors: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, PartialOrd)]
pub enum PermissionLevel {
    Admin,
    Write,
    Read,
    None,
}

/// A permission entry for a specific user or role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionEntry {
    pub subject: String,
    pub level: PermissionLevel,
    pub expires_at: Option<DateTime<Utc>>,
}

/// Request to create a new Conch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateConchRequest {
    pub state: serde_json::Value,
    pub story: String,
    pub intent: String,
    pub lineage: Option<Vec<Uuid>>,
    pub permissions: Option<Permissions>,
}

/// Request to update an existing Conch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConchRequest {
    pub state: Option<serde_json::Value>,
    pub story: Option<String>,
    pub intent: Option<String>,
    pub permissions: Option<Permissions>,
}

/// Request to link two Conches
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkConchRequest {
    pub target_id: Uuid,
    pub link_type: String,
}

/// A link between two Conches
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConchLink {
    pub id: Uuid,
    pub source_id: Uuid,
    pub target_id: Uuid,
    pub link_type: String,
    pub created_at: DateTime<Utc>,
}

/// Event types for real-time updates
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ConchEvent {
    Created { conch: Conch },
    Updated { conch: Conch },
    Deleted { id: Uuid },
    Linked { link: ConchLink },
    Unlinked { source_id: Uuid, target_id: Uuid },
}

/// A node in the Conch graph for visualization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: Uuid,
    pub story: String,
    pub intent: String,
    pub era: i32,
    pub owner: String,
    pub state: serde_json::Value,
}

/// An edge in the Conch graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: Uuid,
    pub target: Uuid,
    pub link_type: String,
}

/// The full graph representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConchGraph {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

/// User registration request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

/// User login request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Authenticated user response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub public_key: Option<String>,
}

/// JWT token response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenResponse {
    pub token: String,
    pub user: UserResponse,
}

/// User (database model)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub public_key: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> axum::response::Response {
        let status = if self.success {
            axum::http::StatusCode::OK
        } else {
            axum::http::StatusCode::BAD_REQUEST
        };
        
        (status, axum::Json(self)).into_response()
    }
}

/// Paginated response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub has_more: bool,
}

/// Conch with computed lineage depth
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConchWithDepth {
    #[serde(flatten)]
    pub conch: Conch,
    pub lineage_depth: i32,
}
