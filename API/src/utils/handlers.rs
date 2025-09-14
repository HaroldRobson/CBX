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

use crate::utils::email::*;
use crate::utils::types::*;
use crate::utils::wallet;
use alloy::primitives::{Address, address};
use alloy::signers::local::PrivateKeySigner;

async fn request_private_key(
    State(app_state): State<Arc<AppState>>,
    Json(payload): Json<Email>,
) -> impl IntoResponse {
    get_emails_wallet(State(app_state));
}
