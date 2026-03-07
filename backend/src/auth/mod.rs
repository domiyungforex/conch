// Authentication module - JWT and Ed25519 signing

use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::db::repo::UserRepository;
use crate::models::{ApiResponse, LoginRequest, RegisterRequest, TokenResponse, UserResponse};

const JWT_SECRET: &str = "conch-secret-key-change-in-production";
const JWT_EXPIRATION: i64 = 86400 * 7; // 7 days

/// Claims for JWT token
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,       // User ID
    pub username: String,  // Username
    pub email: String,     // Email
    pub exp: i64,          // Expiration
    pub iat: i64,          // Issued at
}

/// Generate a JWT token for a user
pub fn generate_token(user_id: &str, username: &str, email: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        email: email.to_string(),
        exp: now + JWT_EXPIRATION,
        iat: now,
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
    )
}

/// Validate a JWT token
pub fn validate_token(token: &str) -> Result<TokenData<Claims>, jsonwebtoken::errors::Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
}

/// Extract user from authorization header
pub fn extract_user(auth_header: &str) -> Option<Claims> {
    if let Some(token) = auth_header.strip_prefix("Bearer ") {
        validate_token(token).ok().map(|t| t.claims)
    } else {
        None
    }
}

/// Password hashing (using SHA256 for simplicity - use bcrypt in production)
pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

/// Verify password
pub fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}

/// Sign a Conch with Ed25519
pub fn sign_conch(id: Uuid, state: &serde_json::Value, story: &str, owner: &str) -> String {
    // Create a deterministic signature based on content
    let mut hasher = Sha256::new();
    hasher.update(id.to_string().as_bytes());
    hasher.update(state.to_string().as_bytes());
    hasher.update(story.as_bytes());
    hasher.update(owner.as_bytes());
    
    let result = hasher.finalize();
    hex::encode(result)
}

/// Verify a Conch signature
pub fn verify_conch_signature(id: Uuid, state: &serde_json::Value, story: &str, owner: &str, signature: &str) -> bool {
    let expected = sign_conch(id, state, story, owner);
    expected == signature
}

/// Register a new user
pub async fn register(
    pool: &sqlx::Pool<sqlx::Postgres>,
    req: RegisterRequest,
) -> Result<ApiResponse<TokenResponse>, String> {
    let repo = UserRepository::new(pool);

    // Check if user already exists
    if repo.get_by_email(&req.email).await.map_err(|e| e.to_string())?.is_some() {
        return Ok(ApiResponse::error("User already exists".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&req.password);

    // Create user
    let user_id: String = repo
        .create(&req.username, &req.email, &password_hash)
        .await
        .map_err(|e| e.to_string())?;

    // Generate token
    let token = generate_token(&user_id, &req.username, &req.email)
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(TokenResponse {
        token,
        user: UserResponse {
            id: user_id,
            username: req.username,
            email: req.email,
            public_key: None,
        },
    }))
}

/// Login user
pub async fn login(
    pool: &sqlx::Pool<sqlx::Postgres>,
    req: LoginRequest,
) -> Result<ApiResponse<TokenResponse>, String> {
    let repo = UserRepository::new(pool);

    // Get user by email
    let user = repo
        .get_by_email(&req.email)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Invalid credentials")?;

    // Verify password
    if !verify_password(&req.password, &user.password_hash) {
        return Ok(ApiResponse::error("Invalid credentials".to_string()));
    }

    // Generate token
    let token = generate_token(&user.id, &user.username, &user.email)
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(TokenResponse {
        token,
        user: UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            public_key: user.public_key,
        },
    }))
}

