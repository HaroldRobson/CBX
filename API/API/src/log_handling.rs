use crate::AppState;
use alloy::providers::Provider;
use alloy::rpc::types::Log;
use std::sync::Arc;
use tokio::sync::mpsc;
async fn handle_logs<P>(log_rx: mpsc::Receiver<Log>, app_state: Arc<AppState<P>>)
where
    P: Provider + 'static,
{
}
