use crate::utils::types::AppState;
use axum::extract::State;
use lettre::{
    Message, SmtpTransport, Transport,
    message::{Attachment, Body, Mailbox, MultiPart, SinglePart, header, header::ContentType},
    transport::smtp::authentication::Credentials,
};
use serde_json::to_string;
use std::error::Error;
use std::fs;
use std::sync::Arc;

pub async fn create_mailer() -> Result<SmtpTransport, Box<dyn Error>> {
    // pass into AppState in main
    let username = std::env::var("EMAIL_USERNAME")?;
    let password = std::env::var("EMAIL_PASSWORD")?;

    let creds = Credentials::new(username, password);

    let mailer = SmtpTransport::starttls_relay("mail.privateemail.com")?
        .credentials(creds)
        .port(587)
        .build();
    Ok(mailer)
}

pub async fn send_email_simple(
    State(app_state): State<Arc<AppState>>,
    content: &str,
    subject: &str,
    email: &str,
) -> Result<(), Box<dyn Error>> {
    let username = std::env::var("EMAIL_USERNAME")?;
    let email = Message::builder()
        .from(username.parse::<Mailbox>().unwrap())
        .to(email.parse::<Mailbox>().unwrap())
        .subject(subject)
        .body(content.to_string())?;
    println!("email composed");

    match app_state.mailer.send(&email) {
        Ok(_) => {
            println!("Basic email sent!");
            Ok(())
        }
        Err(error) => {
            println!("Basic email failed to send. {:?}", error);
            Err(Box::new(error))
        }
    }
}

pub async fn send_email_html(
    replacement_words: &Vec<String>,
    recipient: &str,
    filename: &str,
    subject: &str,
    State(app_state): State<Arc<AppState>>,
) -> Result<(), Box<dyn Error>> {
    let html_template = fs::read_to_string(filename)?;
    let mut html_content = html_template;

    for (i, word) in replacement_words.iter().enumerate() {
        let to_replace = format!("[REPLACE_{}]", i); // start at 0 of course!
        html_content = html_content.replace(&to_replace, word);
    }

    let username = std::env::var("EMAIL_USERNAME")?;
    let email = Message::builder()
        .from(username.parse::<Mailbox>().unwrap())
        .to(recipient.parse::<Mailbox>().unwrap())
        .subject(subject)
        .singlepart(
            SinglePart::builder()
                .header(header::ContentType::TEXT_HTML)
                .body(html_content),
        )?;
    println!("email composed");

    match app_state.mailer.send(&email) {
        Ok(_) => {
            println!("Basic email sent!");
            Ok(())
        }
        Err(error) => {
            println!("Basic email failed to send. {:?}", error);
            Err(Box::new(error))
        }
    }
}
