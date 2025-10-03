use std::error::Error;
use tokio::sync::mpsc;

#[derive(Debug, Clone)]
pub struct MonitorError {
    pub source: String,
    pub message: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub severity: ErrorSeverity,
}

#[derive(Debug, Clone)]
pub enum ErrorSeverity {
    Warning,
    Error,
    Fatal,
}

impl MonitorError {
    pub fn new(source: &str, message: String, severity: ErrorSeverity) -> Self {
        Self {
            source: source.to_string(),
            message: message,
            timestamp: chrono::Utc::now(),
            severity: severity,
        }
    }
}
