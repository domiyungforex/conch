// Services module - Business logic layer

use crate::models::*;
use crate::db::Pool;

/// Conch service - business logic for Conch operations
pub struct ConchService;

impl ConchService {
    /// Validate a Conch before creation
    pub fn validate_create(req: &CreateConchRequest) -> Result<(), String> {
        if req.story.is_empty() {
            return Err("Story cannot be empty".to_string());
        }
        
        if req.story.len() > 10000 {
            return Err("Story too long (max 10000 characters)".to_string());
        }
        
        if req.intent.len() > 500 {
            return Err("Intent too long (max 500 characters)".to_string());
        }
        
        Ok(())
    }

    /// Validate a Conch before update
    pub fn validate_update(req: &UpdateConchRequest) -> Result<(), String> {
        if let Some(story) = &req.story {
            if story.is_empty() {
                return Err("Story cannot be empty".to_string());
            }
            if story.len() > 10000 {
                return Err("Story too long (max 10000 characters)".to_string());
            }
        }
        
        if let Some(intent) = &req.intent {
            if intent.len() > 500 {
                return Err("Intent too long (max 500 characters)".to_string());
            }
        }
        
        Ok(())
    }

    /// Check if a user has permission to perform an action on a conch
    pub fn check_permission(
        conch: &Conch,
        username: &str,
        required_level: PermissionLevel,
    ) -> bool {
        // Owner always has full permissions
        if conch.owner == username {
            return true;
        }

        // Check specific permissions
        match required_level {
            PermissionLevel::Admin => false, // Only owner can be admin
            PermissionLevel::Write => {
                conch.permissions.writers.iter().any(|p| {
                    p.subject == username && p.level >= PermissionLevel::Write
                }) || conch.permissions.readers.iter().any(|p| {
                    p.subject == username && p.level >= PermissionLevel::Write
                })
            }
            PermissionLevel::Read => {
                conch.permissions.readers.iter().any(|p| {
                    p.subject == username && p.level >= PermissionLevel::Read
                })
            }
            PermissionLevel::None => true,
        }
    }
}

/// Graph service - operations on the Conch graph
pub struct GraphService;

impl GraphService {
    /// Calculate the depth of a lineage
    pub fn calculate_lineage_depth(lineage: &[uuid::Uuid]) -> i32 {
        lineage.len() as i32
    }

    /// Find all connected Conches within N degrees
    pub async fn find_connected(
        pool: &Pool,
        start_id: uuid::Uuid,
        depth: i32,
    ) -> Result<Vec<uuid::Uuid>, sqlx::Error> {
        // Simple BFS to find all connected nodes
        let mut visited = std::collections::HashSet::new();
        let mut queue = vec![(start_id, 0)];
        let mut result = Vec::new();

        let repo = crate::db::repo::ConchRepository::new(pool);

        while let Some((id, current_depth)) = queue.pop() {
            if visited.contains(&id) || current_depth > depth {
                continue;
            }
            
            visited.insert(id);
            result.push(id);

            // Get neighbors
            let neighbors = repo.get_neighborhood(id, 1).await?;
            for neighbor in neighbors {
                if !visited.contains(&neighbor.id) {
                    queue.push((neighbor.id, current_depth + 1));
                }
            }
        }

        Ok(result)
    }
}
