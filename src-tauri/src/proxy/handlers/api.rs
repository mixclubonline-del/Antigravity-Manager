//! API Handlers for External Clients
//! Exposes account data, statistics, and logs via HTTP endpoints
//! for integration with external applications like MixxOS Creative Engine

use axum::{
    extract::State,
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde::{Deserialize, Serialize};
use crate::proxy::server::AppState;

/// Account information returned by /api/accounts
#[derive(Debug, Clone, Serialize)]
pub struct AccountInfo {
    pub id: String,
    pub email: String,
    pub provider: String,
    pub status: String,
    #[serde(rename = "lastUsed")]
    pub last_used: Option<i64>,
    #[serde(rename = "isRateLimited")]
    pub is_rate_limited: bool,
    #[serde(rename = "rateLimitResetSeconds")]
    pub rate_limit_reset_seconds: Option<u64>,
}

/// Response for /api/accounts
#[derive(Debug, Serialize)]
pub struct AccountsResponse {
    pub accounts: Vec<AccountInfo>,
    pub total: usize,
}

/// Response for /api/stats
#[derive(Debug, Serialize)]
pub struct StatsResponse {
    pub total_requests: u64,
    pub success_count: u64,
    pub error_count: u64,
    pub active_accounts: usize,
}

/// Response for /api/status
#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub running: bool,
    pub port: u16,
    pub base_url: String,
    pub active_accounts: usize,
    pub version: String,
}

/// Query params for /api/logs
#[derive(Debug, Deserialize)]
pub struct LogsQuery {
    pub limit: Option<usize>,
}

/// GET /api/accounts
/// Returns list of all accounts managed by the proxy
pub async fn handle_get_accounts(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Get accounts from token manager
    let accounts: Vec<AccountInfo> = state.token_manager
        .list_accounts()
        .into_iter()
        .map(|(id, email, is_rate_limited, reset_seconds)| {
            // Determine provider from email/id pattern
            let provider = if id.contains("claude") || email.contains("anthropic") {
                "Claude"
            } else if id.contains("gemini") || email.contains("google") {
                "Gemini"
            } else {
                "Unknown"
            }.to_string();
            
            // Determine status
            let status = if is_rate_limited {
                "limited"
            } else {
                "active"
            }.to_string();
            
            AccountInfo {
                id,
                email,
                provider,
                status,
                last_used: None, // Token manager doesn't track this currently
                is_rate_limited,
                rate_limit_reset_seconds: reset_seconds,
            }
        })
        .collect();
    
    let total = accounts.len();
    
    Json(AccountsResponse { accounts, total })
}

/// GET /api/stats
/// Returns proxy statistics
pub async fn handle_get_stats(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let stats = state.monitor.get_stats().await;
    let active_accounts = state.token_manager.len();
    
    Json(StatsResponse {
        total_requests: stats.total_requests,
        success_count: stats.success_count,
        error_count: stats.error_count,
        active_accounts,
    })
}

/// GET /api/status
/// Returns proxy server status
pub async fn handle_get_status(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let active_accounts = state.token_manager.len();
    
    Json(StatusResponse {
        running: true,
        port: 3456, // Default port, could be made configurable
        base_url: "http://localhost:3456".to_string(),
        active_accounts,
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// GET /api/logs
/// Returns recent request logs
pub async fn handle_get_logs(
    State(state): State<AppState>,
    Query(params): Query<LogsQuery>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(50).min(200);
    let logs = state.monitor.get_logs(limit).await;
    
    Json(serde_json::json!({
        "logs": logs,
        "count": logs.len()
    }))
}
