use crate::AppState;
use crate::error_handling::ErrorSeverity;
use crate::error_handling::MonitorError;
use alloy::providers::Provider;
use lettre::Message;
use lettre::message::{Mailbox, SinglePart, header};
use lettre::{SmtpTransport, Transport, transport::smtp::authentication::Credentials};
use std::error::Error;
use std::sync::Arc;
//pub for error_handling
pub async fn create_mailer() -> Result<SmtpTransport, Box<dyn Error + Send + Sync + 'static>> {
    let username = std::env::var("EMAIL_USERNAME")?;
    let password = std::env::var("EMAIL_PASSWORD")?;
    let creds = Credentials::new(username, password);
    let mailer = SmtpTransport::starttls_relay("mail.privateemail.com")?
        .credentials(creds)
        .port(587)
        .build();
    Ok(mailer)
}

pub enum Email {
    Simple(SimpleEmail),
    Html(HtmlEmail),
}

pub struct SimpleEmail {
    pub content: String,
    pub subject: String,
    pub recipient_email: String,
}

impl SimpleEmail {
    pub fn new(content: &str, subject: &str, recipient_email: &str) -> Self {
        Self {
            content: content.to_string(),
            subject: subject.to_string(),
            recipient_email: recipient_email.to_string(),
        }
    }
}

pub struct HtmlEmail {
    pub replacement_words: Vec<String>,
    pub subject: String,
    pub email_template: EmailTemplate,
    pub recipient_email: String,
}

pub enum EmailTemplate {
    Welcome,          // new user
    TransferOffChain, // either refunding seller or transferring on registry to user
    QueuedTokens,     // piece of mind for pre retirement queued tokens
    PoolPending,      // seller starts a new pool but we haven't received credits on registry yet
    PoolActivated,    // we receive sellers credits on registry and activate pool
    PoolDeactivated,  // either everything sold or seller closes pool
}

impl EmailTemplate {
    fn content(&self) -> &'static str {
        match &self {
            Self::Welcome => include_str!("../templates/emails/Welcome.html"),
            Self::TransferOffChain => include_str!("../templates/emails/TransferOffChain.html"),
            Self::QueuedTokens => include_str!("../templates/emails/QueuedTokens.html"),
            Self::PoolPending => include_str!("../templates/emails/PoolPending.html"),
            Self::PoolActivated => include_str!("../templates/emails/PoolActivated.html"),
            Self::PoolDeactivated => include_str!("../templates/emails/PoolDeactivated.html"),
        }
    }
}

pub async fn handle_emails<P>(
    app_state: Arc<AppState<P>>,
    mut email_handler_rx: tokio::sync::mpsc::Receiver<Email>,
) where
    P: Provider + 'static,
{
    let error_monitoring_tx = app_state.error_monitoring_tx.clone();
    let mailer = match create_mailer().await {
        Ok(m) => m,
        Err(e) => {
            let _ = error_monitoring_tx
                .send(MonitorError::new(
                    "handle_emails",
                    format!("Smtp mailer initialise error: {:?}", e),
                    ErrorSeverity::Fatal,
                ))
                .await;
            return;
        }
    };

    while let Some(email) = email_handler_rx.recv().await {
        match email {
            Email::Simple(simple_email) => {
                let content = simple_email.content.as_str();
                let subject = simple_email.subject.as_str();
                let recipient_email = simple_email.recipient_email.as_str();
                match send_email_simple(&mailer, &content, &subject, &recipient_email).await {
                    Ok(_) => {}
                    Err(e) => {
                        let _ = error_monitoring_tx.send(MonitorError::new("handle emails", format!("error sending simple email: {:?}, \n recipient: {:?}, \n content: {:?}", e, &recipient_email, &content), ErrorSeverity::Warning)).await;
                    }
                }
            }

            Email::Html(html_email) => {
                let replacement_words = html_email.replacement_words;
                let recipient_email = html_email.recipient_email.as_str();
                let html_template = html_email.email_template.content().to_string();
                let subject = html_email.subject.as_str();
                match send_email_html(
                    &mailer,
                    &replacement_words,
                    &recipient_email,
                    html_template,
                    &subject,
                )
                .await
                {
                    Ok(_) => {}
                    Err(e) => {
                        let _ = error_monitoring_tx
                            .send(MonitorError::new(
                                "handle emails",
                                format!(
                                    "error sending htmlemail: {:?}, \n recipient: {:?} \n subject: {:?}",
                                    e, &recipient_email, &subject
                                ),
                                ErrorSeverity::Warning,
                            ))
                            .await;
                    }
                }
            }
        }
    }
}

// this is pub because error_handling gets its own mailer (in case
// the mailer fails we can handle the error differently)
pub async fn send_email_simple(
    mailer: &SmtpTransport,
    content: &str,
    subject: &str,
    email: &str,
) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
    // easier to propagate errors and send to mpsc in parent function
    let username = std::env::var("EMAIL_USERNAME")?;
    let email = Message::builder()
        .from(username.parse::<Mailbox>().unwrap())
        .to(email.parse::<Mailbox>().unwrap())
        .subject(subject)
        .body(content.to_string())?;
    match mailer.send(&email) {
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

async fn send_email_html(
    mailer: &SmtpTransport,
    replacement_words: &Vec<String>,
    recipient: &str,
    html_template: String,
    subject: &str,
) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
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

    match mailer.send(&email) {
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
