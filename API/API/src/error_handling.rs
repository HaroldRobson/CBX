use crate::AppState;
use alloy::providers::Provider;
use sqlx::pool;
use std::error::Error;
use std::sync::Arc;

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

pub async fn monitor_errors<P>(
    mut error_monitor_rx: tokio::sync::mpsc::Receiver<MonitorError>,
    app_state: Arc<AppState<P>>,
) where
    P: Provider + 'static,
{
    while let Some(monitor_error) = error_monitor_rx.recv().await {
        match monitor_error.severity {
            ErrorSeverity::Fatal => {
                eprintln!(
                    "FATAL ERROR: {:?}, \n SOURCE: {:?}, \n",
                    monitor_error.message, monitor_error.source
                );
                // send me an email
            }
            _ => {
                let query_result = sqlx::query!(
                    "INSERT INTO error_logs (source, message, timestamp, severity) VALUES ($1, $2, $3, $4)",
                    monitor_error.source,
                    monitor_error.message,
                    monitor_error.timestamp,
                    format!("{:?}", monitor_error.severity) as _
                ).execute(&app_state.db).await; // not sure if having mpsc based error handling for the mpsc based error handling
                // would be a good idea lol.
                match query_result {
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("error {:?}", e);
                    }
                }
            }
        }
    }
}
