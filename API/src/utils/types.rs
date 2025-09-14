use alloy::primitives::{Address, B256, address};
use alloy::signers::local::PrivateKeySigner;
use alloy_primitives::FixedBytes;
use hex;
use lettre::SmtpTransport;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use sqlx::postgres::PgPool;
use std::convert::TryFrom;
use std::error::Error;
pub struct AppState {
    pub db: PgPool,
    pub mailer: SmtpTransport,
}

#[derive(FromRow)]
pub struct User {
    pub email: String,
    pub address: String,
    pub private_key: String,
}

pub struct Wallet {
    pub signer: PrivateKeySigner,
    pub addr: Address,
}

#[derive(serde::Deserialize)]
pub struct Email {
    pub email: String,
}

impl User {
    pub fn to_wallet(&self) -> Result<Wallet, Box<dyn Error>> {
        let private_key_hex = self
            .private_key
            .strip_prefix("0x")
            .unwrap_or(&self.private_key);
        let signer: PrivateKeySigner = private_key_hex.parse()?;
        let addr = self.address.parse::<Address>()?;
        Ok(Wallet { signer, addr })
    }
}

impl Wallet {
    pub fn to_vec_string(&self) -> Vec<String> {
        vec![
            format!("0x{}", hex::encode(self.signer.to_bytes())),
            self.addr.to_string(),
        ]
    }
}
