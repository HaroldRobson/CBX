use crate::AppState;
use crate::email_handler::{Email, SimpleEmail, create_mailer, send_email_simple};
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
                let mailer = match create_mailer().await {
                    Ok(m) => m,
                    Err(e) => continue,
                };
                let _ = send_email_simple(
                    &mailer,
                    format!(
                        "Fatal Error {:?}. \n At: {:?}",
                        monitor_error.message, monitor_error.source
                    )
                    .as_str(),
                    "FATAL ERROR",
                    "hrldrobson@gmail.com",
                )
                .await;
                save_error(monitor_error, app_state.clone()).await;
            }
            _ => {
                save_error(monitor_error, app_state.clone()).await;
            }
        }
    }
}

async fn save_error<P>(monitor_error: MonitorError, app_state: Arc<AppState<P>>)
where
    P: Provider + 'static,
{
    let query_result = sqlx::query!(
        "INSERT INTO error_logs (source, message, timestamp, severity) VALUES ($1, $2, $3, $4)",
        monitor_error.source,
        monitor_error.message,
        monitor_error.timestamp,
        format!("{:?}", monitor_error.severity) as _
    )
    .execute(&app_state.db)
    .await; // not sure if having mpsc based error handling for the mpsc based error handling
    // would be a good idea lol.
    match query_result {
        Ok(_) => {}
        Err(e) => {
            eprintln!("error {:?}", e);
        }
    }
}
