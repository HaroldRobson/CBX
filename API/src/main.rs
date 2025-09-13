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
#[derive(Serialize)]
struct MyMessage {
    message: String,
}

#[derive(Deserialize, Debug)]
struct PurchaseRequest {
    email: String,
    value_usd: u32,
    amount_of_cbx: u32,
    pool_address: String,
}

pub struct AppState {
    db: PgPool,
}

fn create_new_wallet(email: String) -> (PrivateKeySigner, Address) {
    let signer = PrivateKeySigner::random();
    let addr = signer.address();
    (signer, addr)
}

async fn MakePurchase(Json(payload): Json<PurchaseRequest>) -> impl IntoResponse {
    println!("email {:?}, value {:?}", payload.email, payload.value_usd);
    let (signer, addr) = create_new_wallet("example_email@meow.com".to_string());

    let (key, addr) = create_new_wallet("example@email.com".to_string());
    let private_key_hex = format!("0x{}", hex::encode(key.to_bytes()));
    let addr_string = addr.to_string();
    if let Err(error) = sendEmail(&private_key_hex, &addr_string, &payload.email).await {
        println!("Failed {:?}", error);
    };
    (StatusCode::OK, "purchase_received".to_string())
}
async fn test() -> &'static str {
    "hello!"
}

async fn test2() -> Json<MyMessage> {
    let msg = MyMessage {
        message: "meowie".to_string(),
    };
    Json(msg)
}

async fn create_Mailer() -> Result<SmtpTransport, Box<dyn Error>> {
    let username = std::env::var("EMAIL_USERNAME")?;
    let password = std::env::var("EMAIL_PASSWORD")?;

    let creds = Credentials::new(username, password);

    let mailer = SmtpTransport::starttls_relay("mail.privateemail.com")
        .unwrap()
        .credentials(creds)
        .port(587)
        .build();
    Ok(mailer)
}

async fn create_user(
    State(app_state): State<Arc<AppState>>,
    Json(payload): Json<PurchaseRequest>,
) -> impl IntoResponse {
    let (key, addr) = create_new_wallet("example@email.com".to_string());
    let private_key_hex = format!("0x{}", hex::encode(key.to_bytes()));
    let addr_string = addr.to_string();
    let result = sqlx::query!(
        "INSERT INTO users (email, address, private_key) values ($1, $2, $3)",
        payload.email,
        addr_string,
        private_key_hex
    )
    .execute(&app_state.db)
    .await;
    match result {
        Ok(_) => (StatusCode::OK, "user created"),
        Err(e) => {
            eprintln!("error creating user: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "error creating user")
        }
    }
}

async fn sendEmail(key: &str, addr: &str, email: &str) -> Result<(), Box<dyn Error>> {
    let email = Message::builder()
        .from("info@cbx.earth".parse::<Mailbox>().unwrap())
        .to(email.parse::<Mailbox>().unwrap())
        .subject("Test Email")
        .body(format!(
            "Hello, this is a test email! \n privateKey: {:?},\n address: {:?}",
            key, addr
        ))
        .unwrap();
    println!("email composed");

    let mailer = match create_Mailer().await {
        Ok(mailer) => mailer,
        Err(error) => {
            println!("failed to create mailer {:?}", error);
            return Err(error);
        }
    };

    match mailer.send(&email) {
        Ok(_) => println!("Basic email sent!"),
        Err(error) => {
            println!("Basic email failed to send. {:?}", error);
        }
    }
    Ok(())
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
    let app = Router::new()
        .route("/api/test", get(test))
        .route("/api/test2", get(test2))
        .route("/api/makepurchase", post(MakePurchase))
        .route("/api/createuser", post(create_user))
        .with_state(Arc::new(AppState { db: pool.clone() }));
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("listening on {:?}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
