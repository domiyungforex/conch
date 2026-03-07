// Database module - PostgreSQL operations

use sqlx::postgres::{PgPoolOptions, PgRow};
use sqlx::Row;
use sqlx::Postgres;
use std::time::Duration;
use std::sync::Arc;

/// Database pool type
pub type DbPool = sqlx::Pool<Postgres>;

/// Create a new database pool
pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .connect(database_url)
        .await
}

/// Run migrations - split into individual statements for Neon compatibility
pub async fn run_migrations(pool: &DbPool) -> Result<(), sqlx::Error> {
    // Create conches table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS conches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            state JSONB NOT NULL DEFAULT '{}',
            story TEXT NOT NULL DEFAULT '',
            lineage UUID[] NOT NULL DEFAULT '{}',
            intent TEXT NOT NULL DEFAULT '',
            era INTEGER NOT NULL DEFAULT 1,
            owner TEXT NOT NULL DEFAULT 'anonymous',
            permissions JSONB NOT NULL DEFAULT '{}',
            signature TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )"
    )
    .execute(pool)
    .await?;
    
    // Create conch_links table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS conch_links (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_id UUID NOT NULL REFERENCES conches(id) ON DELETE CASCADE,
            target_id UUID NOT NULL REFERENCES conches(id) ON DELETE CASCADE,
            link_type TEXT NOT NULL DEFAULT 'references',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(source_id, target_id)
        )"
    )
    .execute(pool)
    .await?;
    
    // Create users table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            public_key TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )"
    )
    .execute(pool)
    .await?;
    
    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_conches_owner ON conches(owner)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_conches_era ON conches(era)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_conches_state ON conches USING GIN(state)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_conch_links_source ON conch_links(source_id)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_conch_links_target ON conch_links(target_id)")
        .execute(pool)
        .await?;
    
    Ok(())
}

/// List all conches with pagination
pub async fn list_conches(pool: &DbPool, page: i32, page_size: i32) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let offset = (page - 1) * page_size;
    let rows = sqlx::query(
        "SELECT id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at 
         FROM conches ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    
    let conches: Vec<serde_json::Value> = rows.into_iter().map(|row| {
        serde_json::json!({
            "id": row.get::<uuid::Uuid, _>("id"),
            "state": row.get::<serde_json::Value, _>("state"),
            "story": row.get::<String, _>("story"),
            "lineage": row.get::<Vec<uuid::Uuid>, _>("lineage"),
            "intent": row.get::<String, _>("intent"),
            "era": row.get::<i32, _>("era"),
            "owner": row.get::<String, _>("owner"),
            "permissions": row.get::<serde_json::Value, _>("permissions"),
            "signature": row.get::<String, _>("signature"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
            "updated_at": row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at").to_rfc3339(),
        })
    }).collect();
    
    Ok(conches)
}

/// Get a single conch by ID
pub async fn get_conch(pool: &DbPool, id: uuid::Uuid) -> Result<Option<serde_json::Value>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at 
         FROM conches WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    match row {
        Some(row) => Ok(Some(serde_json::json!({
            "id": row.get::<uuid::Uuid, _>("id"),
            "state": row.get::<serde_json::Value, _>("state"),
            "story": row.get::<String, _>("story"),
            "lineage": row.get::<Vec<uuid::Uuid>, _>("lineage"),
            "intent": row.get::<String, _>("intent"),
            "era": row.get::<i32, _>("era"),
            "owner": row.get::<String, _>("owner"),
            "permissions": row.get::<serde_json::Value, _>("permissions"),
            "signature": row.get::<String, _>("signature"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
            "updated_at": row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at").to_rfc3339(),
        }))),
        None => Ok(None),
    }
}

/// Create a new conch
pub async fn create_conch(
    pool: &DbPool,
    state: serde_json::Value,
    story: String,
    intent: String,
    owner: &str,
) -> Result<serde_json::Value, sqlx::Error> {
    let id = uuid::Uuid::new_v4();
    
    // Insert with empty state first
    let row: PgRow = sqlx::query(
        "INSERT INTO conches (id, state, story, lineage, intent, era, owner, permissions, signature) 
         VALUES ($1, '{}'::jsonb, $2, $3, $4, 1, $5, '{}'::jsonb, '')
         RETURNING id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at"
    )
    .bind(id)
    .bind(&story)
    .bind(&[] as &[uuid::Uuid])
    .bind(&intent)
    .bind(owner)
    .fetch_one(pool)
    .await?;
    
    // Now update with the actual state JSON
    let state_json = serde_json::to_string(&state).unwrap_or_else(|_| "{}".to_string());
    sqlx::query("UPDATE conches SET state = $1::jsonb WHERE id = $2")
        .bind(&state_json)
        .bind(id)
        .execute(pool)
        .await?;
    
    // Get the created conch
    match get_conch(pool, id).await {
        Ok(Some(conch)) => Ok(conch),
        Ok(None) => Err(sqlx::Error::RowNotFound),
        Err(e) => Err(e),
    }
}

/// Update a conch
pub async fn update_conch(
    pool: &DbPool,
    id: uuid::Uuid,
    state: serde_json::Value,
    story: String,
    intent: String,
) -> Result<Option<serde_json::Value>, sqlx::Error> {
    let state_json = serde_json::to_string(&state).unwrap_or_else(|_| "{}".to_string());
    
    let rows_affected = sqlx::query(
        "UPDATE conches SET state = $1::jsonb, story = $2, intent = $3, era = era + 1, updated_at = NOW() WHERE id = $4"
    )
    .bind(&state_json)
    .bind(&story)
    .bind(&intent)
    .bind(id)
    .execute(pool)
    .await?
    .rows_affected();
    
    if rows_affected > 0 {
        get_conch(pool, id).await
    } else {
        Ok(None)
    }
}

/// Delete a conch
pub async fn delete_conch(pool: &DbPool, id: uuid::Uuid) -> Result<bool, sqlx::Error> {
    let rows_affected = sqlx::query("DELETE FROM conches WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?
        .rows_affected();
    
    Ok(rows_affected > 0)
}

/// Create a link between two conches
pub async fn create_link(
    pool: &DbPool,
    source_id: uuid::Uuid,
    target_id: uuid::Uuid,
    link_type: String,
) -> Result<serde_json::Value, sqlx::Error> {
    let id = uuid::Uuid::new_v4();
    
    sqlx::query(
        "INSERT INTO conch_links (id, source_id, target_id, link_type) VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_id, target_id) DO NOTHING"
    )
    .bind(id)
    .bind(source_id)
    .bind(target_id)
    .bind(&link_type)
    .execute(pool)
    .await?;
    
    Ok(serde_json::json!({
        "id": id,
        "source_id": source_id,
        "target_id": target_id,
        "link_type": link_type,
        "created_at": chrono::Utc::now().to_rfc3339(),
    }))
}

/// Get links for a conch
pub async fn get_links(pool: &DbPool, conch_id: uuid::Uuid) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, source_id, target_id, link_type, created_at FROM conch_links WHERE source_id = $1 OR target_id = $1"
    )
    .bind(conch_id)
    .fetch_all(pool)
    .await?;
    
    let links: Vec<serde_json::Value> = rows.into_iter().map(|row| {
        serde_json::json!({
            "id": row.get::<uuid::Uuid, _>("id"),
            "source_id": row.get::<uuid::Uuid, _>("source_id"),
            "target_id": row.get::<uuid::Uuid, _>("target_id"),
            "link_type": row.get::<String, _>("link_type"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
        })
    }).collect();
    
    Ok(links)
}

/// Get all links
pub async fn get_all_links(pool: &DbPool) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, source_id, target_id, link_type, created_at FROM conch_links"
    )
    .fetch_all(pool)
    .await?;
    
    let links: Vec<serde_json::Value> = rows.into_iter().map(|row| {
        serde_json::json!({
            "id": row.get::<uuid::Uuid, _>("id"),
            "source_id": row.get::<uuid::Uuid, _>("source_id"),
            "target_id": row.get::<uuid::Uuid, _>("target_id"),
            "link_type": row.get::<String, _>("link_type"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
        })
    }).collect();
    
    Ok(links)
}
