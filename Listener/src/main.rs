//! Example of subscribing and listening for specific contract events by `WebSocket` subscription.

use alloy::{
    primitives::address,
    providers::{Provider, ProviderBuilder, WsConnect},
    rpc::types::{BlockNumberOrTag, Filter},
};
use futures_util::stream::StreamExt;
use std::error::Error;
use std::result::Result;
mod middlewear;
use crate::middlewear::*;
mod solidity;
use crate::solidity::Factory;
use sqlx::postgres::PgPoolOptions;

use axum::Router;
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, post},
};
use hex;
use lettre::{
    Message, SmtpTransport, Transport,
    message::{Attachment, Body, Mailbox, MultiPart, SinglePart, header::ContentType},
    transport::smtp::authentication::Credentials,
};
use std::error::Error;
use std::net::SocketAddr;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use sqlx::postgres::PgPool;
use sqlx::postgres::PgPoolOptions;

use alloy::primitives::{Address, address};
use alloy::signers::local::PrivateKeySigner;
use tokio::sync::{Mutex, mpsc};

struct FactoryMonitor {
    provider: Arc<Provider>,
    contract_spawner_tx: mpsc::Sender<Address>,
    active_monitors: DashMap<Address, JoinHandle<()>>,
}

pub enum Registry {
    GoldStandard,
    Verra,
    ACR,
    CAR,
    ICR,
}
struct ContractMonitor {
    address: Address,
    provider: Arc<Provider>,
    db_pool: PgPool,
    registry: Registry,
}
//#[tokio::main]

struct NewContract {
    address: Address,
    registry: Registry,
    seller: Address,
    ipfs: String,
}

async fn create_mailer() -> Result<SmtpTransport, Box<dyn Error>> {
    let username = std::env::var("EMAIL_USERNAME")?;
    let password = std::env::var("EMAIL_PASSWORD")?;

    let creds = Credentials::new(username, password);

    let mailer = SmtpTransport::starttls_relay("mail.privateemail.com")?
        .credentials(creds)
        .port(587)
        .build();
    Ok(mailer)
}

#[tokio::main]
async fn main() -> Result<()> {
    let db_pool = match PgPoolOptions::new()
        .max_connections(100)
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            println!("Postgres is connected");
            pool
        }
        Err(e) => {
            eprintln!("failed to connect to posgres, {:?}", e);
            std::process::exit(1);
        }
    };

    let mailer = create_mailer().await?;

    let rpc_url = "wss://eth-mainnet.g.alchemy.com/v2/your-api-key";
    let ws = WsConnect::new(rpc_url);
    let provider = ProviderBuilder::new().on_ws(ws).await?;
    let factory_addr = address!("1f9840a85d5aF5bf1D1762F925BDADdC4201F984");
    // Spawn factory monitor
    let (contract_spawner_tx, mut contract_spawner_rx) = tokio::sync::mpsc::channel(100);
    let contract_manager = tokio::spawn(async move {
        let mut active_monitors = JoinSet::new();

        while let Some(new_contract) = contract_spawner_rx.recv().await {
            active_monitors.spawn(monitor_contract_events(
                new_contract,
                provider.clone(),
                db_pool.clone(),
                Arc::new(Mutex::new(mailer)),
            ));
        }
        let factory_task = tokio::spawn(monitor_factory_deployments(
            factory_addr,
            provider.clone(),
            contract_spawner_tx,
        ));
    });
}
// Handle new contract spawning

async fn monitor_factory_deployments(
    factory_address: Address,
    provider: Arc<Provider>,
    spawner_tx: mpsc::Sender<Address>,
) -> Result<()> {
    let filter = Filter::new()
        .address(factory_address)
        .event_signature(Factory::PoolActivated::SIGNATURE_HASH)
        .from_block(BlockNumberOrTag::Latest);

    let sub = provider.subscribe_logs(&filter).await?;
    let mut stream = sub.into_stream();

    while let Some(log) = stream.next().await {
        if let Ok(event) = Factory::newPendingPool::decode_log(&log, true) {
            let new_contract = NewContract {
                address: event.address,
                registry: match event.registry {
                    0 => Registry::GoldStandard,
                    1 => Registry::Verra,
                    _ => Registry::ACR, // bad error handling.
                },
                seller: event.seller,
                ipfs: event.ipfs,
            };
            spawner_tx.send(new_contract).await?;
        }
    }

    Ok(())
}

async fn monitor_contract_events(
    new_contract: NewContract,
    provider: Arc<Provider>,
    db_pool: PgPool,
    smtp: Arc<Mutex<SmtpTransport>>,
) -> Result<()> {
    // Subscribe to multiple events at once
    let filter = Filter::new()
        .address(contract_addr)
        .event_signature(vec![
            Transfer::SIGNATURE_HASH,
            Approval::SIGNATURE_HASH,
            Mint::SIGNATURE_HASH,
            Burn::SIGNATURE_HASH,
        ])
        .from_block(BlockNumberOrTag::Latest);

    let sub = provider.subscribe_logs(&filter).await?;
    let mut stream = sub.into_stream();

    while let Some(log) = stream.next().await {
        // Pattern match on event types
        match log.topics()[0] {
            Transfer::SIGNATURE_HASH => {
                let event = Transfer::decode_log(&log, true)?;
                handle_transfer_event(event, &db_pool).await?;
            }
            Approval::SIGNATURE_HASH => {
                let event = Approval::decode_log(&log, true)?;
                handle_approval_event(event, &db_pool).await?;
            } // etc.
        }
    }

    Ok(())
}
