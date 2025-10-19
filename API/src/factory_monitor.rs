use crate::AppState;
use crate::NewPool;
use crate::error_handling::{ErrorSeverity, MonitorError};
use alloy::primitives::Address;
use alloy::providers::Provider;
use alloy::rpc::types::Log;
use alloy::sol;
use alloy::sol_types::SolEvent;
use futures_util::StreamExt;
use lettre::Transport;
use std::error::Error;
use std::sync::Arc;
use tokio::sync::mpsc;

sol! {
    #[sol(rpc)]
    contract Factory {
        event poolsChanged(bytes currentPools);
        event newPendingPool(address Address, address Seller, string IPFS, uint256 initialSupply, uint256 registry);
        event poolActivated(address Address, address Seller, string IPFS, uint256 initialSupply);
        event poolDeactivated(address Address, address Seller, string IPFS, bool refundRequired, uint256 registry); // a pool can be deactivated either because the seller withdraws credits (true),
            //or because all credits are sold (false).
        event PoolDeclined(address indexed poolAddress, address indexed seller, uint256 depositRefunded);
        event refundSeller(address Address, address Seller, string IPFS, uint256 refundAmount, uint256 registry);
        function activatePool(address poolAddress) external;

        }
}

#[derive(sqlx::Type, Debug, Clone)]
#[sqlx(type_name = "status", rename_all = "lowercase")]
pub enum Status {
    Pending,
    Active,
    Retired,
}

pub async fn monitor_factory<P>(
    factory_address: Address,
    app_state: Arc<AppState<P>>,
    spawner_tx: mpsc::Sender<NewPool>,
) -> Result<(), Box<dyn Error + Send + Sync>>
where
    P: Provider + 'static,
{
    let error_monitoring_tx = app_state.error_monitoring_tx.clone();
    let log_handling_tx = app_state.log_handling_tx.clone();
    let handle1 = tokio::spawn(monitor_new_pending_pools(
        factory_address.clone(),
        app_state.clone(),
        spawner_tx.clone(), // use spawner_tx for creating a new thread when there is a new factory
        error_monitoring_tx.clone(),
        log_handling_tx.clone(),
    ));

    let handle2 = tokio::spawn(monitor_pools_activated(
        factory_address.clone(),
        app_state.clone(),
        error_monitoring_tx.clone(),
        log_handling_tx.clone(),
    ));

    let handle3 = tokio::spawn(monitor_pools_deactivated(
        factory_address.clone(),
        app_state.clone(),
        error_monitoring_tx.clone(),
        log_handling_tx.clone(),
    ));

    let handle4 = tokio::spawn(monitor_seller_refund_requests(
        factory_address.clone(),
        app_state.clone(),
        error_monitoring_tx.clone(),
        log_handling_tx.clone(),
    ));

    let _ = tokio::try_join!(handle1, handle2, handle3, handle4);
    Ok(())
}

async fn monitor_new_pending_pools<P>(
    factory_address: Address,
    app_state: Arc<AppState<P>>,
    spawner_tx: mpsc::Sender<NewPool>,
    error_monitoring_tx: mpsc::Sender<MonitorError>,
    log_handling_tx: mpsc::Sender<Log>,
) where
    P: Provider + 'static,
{
    let provider = app_state.provider.clone();
    let contract = Factory::new(factory_address, provider);

    let filter = match contract.newPendingPool_filter().watch().await {
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
                println!("got log {:?}", event.IPFS.clone());
                let credit_id = get_credit_id(&event.IPFS.clone());
                let seller_registry_details = get_seller_registry_details(&event.IPFS.clone());
                match sqlx::query!(
                            "INSERT INTO pool_details (pool_status, pool_address, ipfs_uri, credit_id, seller_address, initial_supply, seller_registry_details, registry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                            "pending" as _,
                            event.Address.to_string(),
                            event.IPFS.clone(),
                            credit_id,
                            event.Seller.to_string(),
                            event.initialSupply.to::<i32>(),
                            seller_registry_details,
                            event.registry.to::<i32>())
                            .execute(&app_state.db)
                            .await {
                                Ok(_q) => {
                                     let _ = log_handling_tx.send(log.clone()).await;
                                     let amount = event.initialSupply.to::<i32>();
                                     let tx_hash = match log.transaction_hash {
                                        Some(hash) => hash.to_string(),
                                        None => {
                                            let _ = error_monitoring_tx
                                                .send(MonitorError::new(
                                                    "monitor_new_pending_pools",
                                                    format!("EVM Log had no transaction hash - strange"),
                                                    ErrorSeverity::Warning,
                                                ))
                                                .await;

                                            continue;
                                        }
                                    };
                                    let new_pool = NewPool::new(event.Address, event.registry.to::<i32>(), event.Seller, event.IPFS, tx_hash, amount);
                                     let _ = spawner_tx.send(new_pool).await;
                                    }
                                Err(e) => {
                                    let _ = error_monitoring_tx.send(MonitorError::new(
                                        "monitor_new_pending_pools",
                                        format!("pool_details db write \n error: {:?},\n EVM event log: {:?}", e, log.clone()),
                                        ErrorSeverity::Error,
                                        )).await;
                                        }

                                    };
            }
            Err(e) => {
                let _ = error_monitoring_tx
                    .send(MonitorError::new(
                        "monitor_new_pending_pools",
                        format!("error in stream.next().await: {:?}", e),
                        ErrorSeverity::Fatal,
                    ))
                    .await;
            }
        };
    }
}

async fn monitor_pools_activated<P>(
    factory_address: Address,
    app_state: Arc<AppState<P>>,
    error_monitoring_tx: mpsc::Sender<MonitorError>,
    log_handling_tx: mpsc::Sender<Log>,
) where
    P: Provider + 'static,
{
    let provider = app_state.provider.clone();
    let contract = Factory::new(factory_address, provider);
    let filter = match contract.newPendingPool_filter().watch().await {
        Ok(fil) => fil,
        Err(e) => {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "monitor_pools_activated",
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
                match sqlx::query!(
                    "UPDATE pool_details SET pool_status = $1 where pool_address = $2",
                    "active" as _,
                    event.Address.to_string()
                )
                .execute(&app_state.db)
                .await
                {
                    Ok(_q) => {
                        let _ = log_handling_tx.send(log).await;
                    }
                    Err(e) => {
                        let _ = error_monitoring_tx.send(MonitorError::new(
                            "monitor_pools_activated",
                            format!(
                                "pool_details update to active error: {:?}, \n EVM event log: {:?}",
                                e, log
                            ),
                            ErrorSeverity::Warning,
                        )).await;
                    }
                };
            }
            Err(e) => {
                let _ = error_monitoring_tx
                    .send(MonitorError::new(
                        "monitor_pools_activated",
                        format!("error in stream.next().await: {:?}", e),
                        ErrorSeverity::Fatal,
                    ))
                    .await;
                return;

                // then log them or something?
            }
        }
    }
}

async fn monitor_pools_deactivated<P>(
    factory_address: Address,
    app_state: Arc<AppState<P>>,
    error_monitoring_tx: mpsc::Sender<MonitorError>,
    log_handling_tx: mpsc::Sender<Log>,
) where
    P: Provider + 'static,
{
    let provider = app_state.provider.clone();
    let contract = Factory::new(factory_address, provider);
    let filter = match contract.newPendingPool_filter().watch().await {
        Ok(fil) => fil,
        Err(e) => {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "monitor_pools_deactivated",
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
                match sqlx::query!(
                    "UPDATE pool_details SET pool_status = $1 where pool_address = $2",
                    "retired" as _,
                    event.Address.to_string()
                )
                .execute(&app_state.db)
                .await
                {
                    Ok(_q) => {
                        let _ = log_handling_tx.send(log).await;
                    }
                    Err(e) => {
                        let _ = error_monitoring_tx.send(MonitorError::new(
                            "monitor_pools_deactivated",
                            format!(
                                "pool_details update to retired error: {:?}, \n EVM event log: {:?}",
                                e, log
                            ),
                            ErrorSeverity::Warning,
                        )).await;
                    }
                };
            }
            Err(e) => {
                let _ = error_monitoring_tx
                    .send(MonitorError::new(
                        "monitor_pools_deactivated",
                        format!("error in stream.next().await: {:?}", e),
                        ErrorSeverity::Fatal,
                    ))
                    .await;

                return;
                // then log them or something?
            }
        }
    }
}

async fn monitor_seller_refund_requests<P>(
    factory_address: Address,
    app_state: Arc<AppState<P>>,
    error_monitoring_tx: mpsc::Sender<MonitorError>,
    log_handling_tx: mpsc::Sender<Log>,
) where
    P: Provider + 'static,
{
    let provider = app_state.provider.clone();
    let contract = Factory::new(factory_address, provider);
    let filter = match contract.refundSeller_filter().watch().await {
        Ok(fil) => fil,
        Err(e) => {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "monitor_seller_refund_requests",
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
                let credit_id = get_credit_id(&event.IPFS);
                let seller_registry_details = get_seller_registry_details(&event.IPFS);
                let registry_transaction_id = match refund_seller(
                    credit_id,
                    seller_registry_details,
                    event.refundAmount.to::<u32>(),
                    event.registry.to::<u32>(),
                )
                .await
                {
                    Ok(rti) => rti,
                    Err(e) => {
                        let _ = error_monitoring_tx
                            .send(MonitorError::new(
                                "monitor_seller_refund_requests",
                                format!("BIG PROBLEM!! ERROR REFUNDING SELLER: {:?}", e),
                                ErrorSeverity::Error,
                            ))
                            .await;
                        continue;
                    }
                };
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
                match event.registry.to::<u32>() {
                    0 => {
                        // Gold Standard
                        match sqlx::query!(
                            "INSERT INTO pending_registry_transfers_gs (pool_address, seller_address, tx_hash, amount, registry_transaction_id) VALUES ($1, $2, $3, $4, $5)",
                            event.Address.to_string(),
                            event.Seller.to_string(),
                            tx_hash,
                            event.refundAmount.to::<i32>(),
                            registry_transaction_id
                        )
                        .execute(&app_state.db)
                        .await {
                    Ok(_q) => {
                        let _ = log_handling_tx.send(log).await;
                    }
                    Err(e) => {
                        let _ = error_monitoring_tx.send(MonitorError::new(
                            "monitor_seller_refund_requests",
                            format!(
                                "pending_registry_transfers insert error: {:?}, \n EVM event log: {:?}",
                                e, log
                            ),
                            ErrorSeverity::Warning,
                        )).await;
                    }
                };
                    }
                    _ => {}
                }
            }
            Err(e) => {
                let _ = error_monitoring_tx
                    .send(MonitorError::new(
                        "monitor_seller_refund_requests",
                        format!("error in stream.next().await: {:?}", e),
                        ErrorSeverity::Fatal,
                    ))
                    .await;

                return;
            }
        }
    }
}

async fn refund_seller(
    credit_id: String,
    registry_details: String,
    amount: u32,
    registry: u32,
) -> Result<String, Box<dyn Error + Send + Sync>> {
    Ok("meow".to_string()) // if no registry transaciton id from api then just give emoty string
    // (can't be arsed handling null separately). just make sure when looking up in DB to use
    // tx_hash not transaction id
}

fn get_credit_id(ipfs: &String) -> String {
    "meow".to_string()
}

fn get_seller_registry_details(ipfs: &String) -> String {
    "meow".to_string()
}
