use crate::AppState;
use crate::NewPool;
use crate::error_handling::{ErrorSeverity, MonitorError};
use alloy::primitives::{Address, address};
use alloy::providers::{Provider, ProviderBuilder, WsConnect};
use alloy::rpc::types::Log;
use alloy::sol;
use futures_util::StreamExt;
use std::sync::Arc;
use tokio::sync::mpsc;

sol! {
    #[sol(rpc)]
    contract CBX {
    event newCreditsPurchased(uint256 amountOfNewTokens, uint256 pricePayedPerNewToken);
    event tokensMinted(uint256 amountOfNewTokens);
    event priceUpdated(uint256 newPrice);
    event feesUpdated(uint256 fee);
    event withdrawnUSDC(uint256 amount);
    event TokensPurchasedWithUSDC(address indexed buyer, uint256 amount, uint256 cost);
    event reserveOfCBXChanged(uint256 newReserve);
    event poolDeactivated(uint256 reservesLeft);
    event transferoffChain(uint256 amount, string details);
    event TokensQueued(address indexed user, uint256 tokens);
    event RetirementBundle(uint256 bundleId, uint256 bundleSize, bytes RetirementData, address originalPool);
    event retiredOnBehalfOf(uint256 bundleId, uint256 bundleSize, bytes RetirementData, address originalPool, string RetirementMessage);
    }
}

pub async fn cbx_monitor<P>(app_state: Arc<AppState<P>>, new_pool: NewPool)
where
    P: Provider + 'static,
{
}

async fn monitor_tokens_queued<P>(app_state: Arc<AppState<P>>, new_pool: NewPool)
where
    P: Provider + 'static,
{
    let error_monitoring_tx = app_state.error_monitoring_tx.clone();
    let log_handling_tx = app_state.log_handling_tx.clone();
    let provider = app_state.provider.clone();
    let pool_address = new_pool.address;
    let contract = CBX::new(pool_address, provider);

    let filter = match contract.TokensQueued_filter().watch().await {
        Ok(fil) => fil,
        Err(e) => {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "monitor_new_pending_pools",
                    format!("filter initialise error: {:?}", e),
                    ErrorSeverity::Fatal,
                ))
                .await;
            return;
        }
    };

    let mut stream = filter.into_stream();
    while let Some(result) = stream.next().await {
        match result {
            Ok((event, log)) => {
                let tx_hash = match log.transaction_hash {
                    Some(hash) => hash.to_string(),
                    None => {
                        let _ = error_monitoring_tx
                            .send(MonitorError::new(
                                "monitor_seller_refund_requests",
                                format!("EVM Log had no transaction hash - strange"),
                                ErrorSeverity::Warning,
                            ))
                            .await;

                        continue;
                    }
                };
                let query = sqlx::query!(
                    "INSERT INTO queued_tokens (wallet_address, tx_hash, pool_address, amount) VALUES ($1, $2, $3, $4)",
                    event.user.to_string(),
                    tx_hash,
                    new_pool.address.to_string(),
                    event.tokens.to::<i32>(),
                ).execute(&app_state.db).await;
                match query {
                    Ok(_) => { /*email user*/ }
                    Err(e) => { /*send over mpsc*/ }
                };
            }
            Err(e) => { /*send to mpsc*/ }
        };
    }
}
