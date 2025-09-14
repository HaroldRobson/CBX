use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use sqlx::postgres::PgPool;
use sqlx::postgres::PgPoolOptions;

use alloy::primitives::{Address, address};
use alloy::signers::local::PrivateKeySigner;
use std::error::Error;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, post},
};

use crate::utils::types::{AppState, User, Wallet};

fn create_new_wallet() -> Wallet {
    let signer = PrivateKeySigner::random();
    let addr = signer.address();
    Wallet {
        signer: signer,
        addr: addr,
    }
}

async fn create_new_wallet_and_insert(
    email: &str,
    State(app_state): State<Arc<AppState>>,
) -> Result<Wallet, Box<dyn Error>> {
    let wallet = create_new_wallet();
    let private_key_hex: String = format!("0x{}", hex::encode(wallet.signer.to_bytes()));
    let addr_string = wallet.addr.to_string();
    let result = sqlx::query!(
        "INSERT INTO users (email, address, private_key) values ($1, $2, $3)",
        email.to_string(),
        addr_string,
        private_key_hex
    )
    .execute(&app_state.db)
    .await;
    match result {
        Ok(_) => Ok(wallet),
        Err(e) => {
            eprintln!("error creating user: {:?}", e);
            Err(Box::new(e))
        }
    }
}

pub async fn get_emails_wallet(
    State(app_state): State<Arc<AppState>>,
    email: &str,
) -> Result<Wallet, Box<dyn Error>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(&app_state.db)
        .await?;
    match user {
        Some(user) => user.to_wallet(),
        None => create_new_wallet_and_insert(email, State(app_state)).await,
    }
}
