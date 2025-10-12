use crate::AppState;
use crate::NewPool;
use alloy::primitives::{Address, address};
use alloy::providers::{Provider, ProviderBuilder, WsConnect};
use alloy::sol;
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
    event RetirementBundle(uint256 indexed bundleId, uint256 bundleSize, bytes RetirementData, address originalPool);
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
    let contract = CBX::new(pool_address, provider);

    let filter = match contract.TokensQueued_filter().watch().await {
        Ok(event) => {
            let query =  sqlx::query!("INSERT INTO queued_tokens (wallet_address, tx_hash, pool_address, amount) VALUES ($1, $2, $3, $4)", 
                new_pool.seller.to_string(),
                new_pool.tx_hash,
                new_pool.address.to_string(),
                new_pool.amount
            ).execute(&app_state.db).await;
            match query {
                Ok(_) => {/*email user*/}
                Err(e) => {/*send over mpsc*/}
            }

        }
        Err(e) => {/*send to mpsc*/}
    }
}
