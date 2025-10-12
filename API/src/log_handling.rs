use crate::AppState;
use crate::error_handling::ErrorSeverity;
use crate::error_handling::MonitorError;
use alloy::providers::Provider;
use alloy::rpc::types::Log;
use std::sync::Arc;
use tokio::sync::mpsc;

pub async fn handle_logs<P>(mut log_rx: mpsc::Receiver<Log>, app_state: Arc<AppState<P>>)
where
    P: Provider + 'static,
{
    let error_monitoring_tx = app_state.error_monitoring_tx.clone();

    while let Some(log) = log_rx.recv().await {
        let Some(block_number) = log.block_number else {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "handle_logs",
                    "Log missing block_number".to_string(),
                    ErrorSeverity::Error,
                ))
                .await;
            continue;
        };

        let Some(log_index) = log.log_index else {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "handle_logs",
                    "Log missing log_index".to_string(),
                    ErrorSeverity::Error,
                ))
                .await;
            continue;
        };

        let block_timestamp = match log.block_timestamp {
            Some(btstmp) => Some(btstmp as i64),
            None => {
                let _ = error_monitoring_tx
                    .send(MonitorError::new(
                        "handle_logs",
                        "Log missing block_timestamp".to_string(),
                        ErrorSeverity::Error,
                    ))
                    .await;
                None
            }
        };

        //these can be optional
        let transaction_hash = log.transaction_hash;
        let transaction_index = log.transaction_index;
        let removed = log.removed;
        let address = log.address();
        let bytes = log.data().data.to_vec();

        match sqlx::query!(
        "INSERT INTO evm_logs (address, block_number, transaction_hash, transaction_index, log_index, block_timestamp, removed, bytes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        address.to_string(),
        block_number as i32,
        transaction_hash.map(|h| h.to_string()),
        transaction_index.map(|i| i as i32),
        log_index as i32,
        block_timestamp,
        removed,
        bytes
    ).execute(&app_state.db).await {
        Ok(_) => {},
        Err(e) => {
            let _ = error_monitoring_tx.send(MonitorError::new(
                "handle_logs",
                format!("Failed to insert log: {:?}", e),
                ErrorSeverity::Warning,
            )).await;
        }
    }
    }
}
