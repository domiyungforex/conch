// Database module - Simplified version for demo
use sqlx::postgres::{PgPoolOptions, PgRow};
use sqlx::{Row, Pool, Postgres};
use std::time::Duration;

pub type Pool = Pool<Postgres>;

pub async fn new_pool(database_url: &str) -> Result<Pool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connations(10)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .connect(database_url)
        .await
}

pub async fn run_migrations(_pool: &Pool) -> Result<(), sqlx::Error> {
    // Migrations will be handled separately
    Ok(())
}

// Simplified query helpers using raw sql
pub async fn create_conch(
    pool: &Pool,
    id: &str,
    state: &str,
    story: &str,
    lineage: &[String],
    intent: &str,
    owner: &str,
    permissions: &str,
    signature: &str,
) -> Result<serde_json::Value, sqlx::Error> {
    let row: PgRow = sqlx::query(
        r#"INSERT INTO conches (id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, NOW(), NOW())
           RETURNING id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at"#
    )
    .bind(id)
    .bind(state)
    .bind(story)
    .bind(lineage)
    .bind(intent)
    .bind(owner)
    .bind(permissions)
    .bind(signature)
    .fetch_one(pool)
    .await?;

    Ok(serde_json::json!({
        "id": row.get::<String, _>("id"),
        "state": row.get::<serde_json::Value, _>("state"),
        "story": row.get::<String, _>("story"),
        "lineage": row.get::<Vec<String>, _>("lineage"),
        "intent": row.get::<String, _>("intent"),
        "era": row.get::<i32, _>("era"),
        "owner": row.get::<String, _>("owner"),
        "permissions": row.get::<serde_json::Value, _>("permissions"),
        "signature": row.get::<String, _>("signature"),
        "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
        "updated_at": row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at").to_rfc3339(),
    }))
}

pub async fn get_conch(pool: &Pool, id: &str) -> Result<Option<serde_json::Value>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at FROM conches WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        Ok(Some(serde_json::json!({
            "id": row.get::<String, _>("id"),
            "state": row.get::<serde_json::Value, _>("state"),
            "story": row.get::<String, _>("story"),
            "lineage": row.get::<Vec<String>, _>("lineage"),
            "intent": row.get::<String, _>("intent"),
            "era": row.get::<i32, _>("era"),
            "owner": row.get::<String, _>("owner"),
            "permissions": row.get::<serde_json::Value, _>("permissions"),
            "signature": row.get::<String, _>("signature"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
            "updated_at": row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at").to_rfc3339(),
        })))
    } else {
        Ok(None)
    }
}

pub async fn list_conches(pool: &Pool, page: i32, page_size: i32) -> Result<serde_json::Value, sqlx::Error> {
    let offset = (page - 1) * page_size;
    
    let rows = sqlx::query(
        "SELECT id, state, story, lineage, intent, era, owner, permissions, signature, created_at, updated_at FROM conches ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let items: Vec<serde_json::Value> = rows.iter().map(|row| {
        serde_json::json!({
            "id": row.get::<String, _>("id"),
            "state": row.get::<serde_json::Value, _>("state"),
            "story": row.get::<String, _>("story"),
            "lineage": row.get::<Vec<String>, _>("lineage"),
            "intent": row.get::<String, _>("intent"),
            "era": row.get::<i32, _>("era"),
            "owner": row.get::<String, _>("owner"),
            "permissions": row.get::<serde_json::Value, _>("permissions"),
            "signature": row.get::<String, _>("signature"),
            "created_at": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339(),
            "updated_at": row.get::<chrono::DateTime<chrono::Utc>, _>("updated_at").to_rfc3339(),
        })
    }).collect();

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM conches")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    Ok(serde_json::json!({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": offset + items.len() < total as usize
    }))
}
