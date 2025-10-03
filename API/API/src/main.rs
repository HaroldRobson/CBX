use axum::Router;
use lettre::{
    SmtpTransport,
    transport::smtp::authentication::Credentials,
};
use std::error::Error;
use std::net::SocketAddr;
use std::sync::Arc;
mod factory_monitor;
use crate::factory_monitor::monitor_factory;
use sqlx::postgres::PgPool;
use sqlx::postgres::PgPoolOptions;
use tokio::task::JoinSet;
mod error_handling;
use crate::error_handling::MonitorError;
use alloy::primitives::address;
use alloy::providers::{Provider, ProviderBuilder, WsConnect};
use tokio::sync::Mutex;
mod log_handling;
pub enum Registry {
    GoldStandard,
    Verra,
    ACR,
    CAR,
    ICR,
}

pub struct AppState<P>
where
    P: Provider + 'static,
{
    db: PgPool,
    mailer: Mutex<SmtpTransport>,
    provider: Arc<P>,
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
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv::dotenv().expect("env variables cocked up");
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must set");
    let pool = match PgPoolOptions::new()
        .max_connections(10)
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
    let rpc_url = "wss://polygon-mainnet.infura.io/ws/v3/8b40287c8b444d51aaa642f0e9874edd";
    let ws = WsConnect::new(rpc_url);
    let provider_unarced = ProviderBuilder::new().connect_ws(ws).await?;
    let provider = Arc::new(provider_unarced);
    let factory_addr = address!("1f9840a85d5aF5bf1D1762F925BDADdC4201F984");
    // Spawn factory monitor
    let (contract_spawner_tx, contract_spawner_rx) = tokio::sync::mpsc::channel(100);
    let (error_monitoring_tx, error_monitoring_rx) =
        tokio::sync::mpsc::channel::<MonitorError>(100);
    let (log_handling_tx, log_handling_rx) =
        tokio::sync::mpsc::channel::<alloy::rpc::types::Log>(100); // use these for handle_logs()
    let app_state = Arc::new(AppState {
        db: pool.clone(),
        mailer: Mutex::new(mailer),
        provider: provider.clone(),
    });
    let app_state_alloy = app_state.clone();
    let app_state_axum = app_state.clone();
    let contract_manager = tokio::spawn(async move {
        let active_monitors: JoinSet<Result<(), Box<dyn Error + Send + Sync>>> = JoinSet::new();

        // while let Some(new_contract) = contract_spawner_rx.recv().await {
        //     active_monitors.spawn(monitor_contract_events(
        //         new_contract,
        //         app_state_axum.clone()
        //     ));
        // }
        let factory_task = tokio::spawn(monitor_factory(
            factory_addr,
            app_state_alloy,
            contract_spawner_tx,
            error_monitoring_tx.clone(),
            log_handling_tx.clone(),
        ));
    });
    let app = Router::new().with_state(app_state_axum);
    // put handlers here for db reading.
    // only write should be users associating wallet with email.
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("listening on {:?}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
