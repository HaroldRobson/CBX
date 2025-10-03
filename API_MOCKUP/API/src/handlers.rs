use axum::Router;
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, post},
};
use axum_macros::debug_handler;
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

use crate::utils::email;
use crate::utils::email::*;
use crate::utils::types::*;
use crate::utils::wallet::{delete_wallet, get_emails_wallet};
use alloy::primitives::{Address, address};
use alloy::signers::local::PrivateKeySigner;

#[axum_macros::debug_handler]
pub async fn request_private_key(
    State(app_state): State<Arc<AppState>>,
    Json(payload): Json<Email>,
) -> impl IntoResponse {
    let wallet = match get_emails_wallet(&app_state, &payload.email).await {
        Ok(wallet) => wallet,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Could not retrieve / create wallet",
            );
        }
    };
    let replacement_words = wallet.to_vec_string();
    let recipient = &payload.email;
    let filename = "private_key_email.html";
    let subject = "CBX Account Details";
    match email::send_email_html(
        &replacement_words,
        recipient,
        &filename,
        &subject,
        &app_state,
    )
    .await
    {
        Ok(_) => match delete_wallet(&app_state, &payload.email).await {
            Ok(_) => (
                StatusCode::OK,
                "Email Sent and wallet deleted from database!",
            ),
            Err(e) => {
                eprintln!("error deleting wallet, {:}?", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "SECURITY ALERT: DID NOT DELETE WALLET FROM DATABASE",
                )
            }
        },
        Err(e) => {
            eprintln!("Error_Sending email {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to send Email :(")
        }
    }
}
