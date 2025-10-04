use lettre::{SmtpTransport, transport::smtp::authentication::Credentials};
use std::error::Error;

pub async fn create_mailer() -> Result<SmtpTransport, Box<dyn Error>> {
    let username = std::env::var("EMAIL_USERNAME")?;
    let password = std::env::var("EMAIL_PASSWORD")?;

    let creds = Credentials::new(username, password);

    let mailer = SmtpTransport::starttls_relay("mail.privateemail.com")?
        .credentials(creds)
        .port(587)
        .build();
    Ok(mailer)
}

pub struct SimpleEmail {
    pub content: String,
    pub subject: String,
    pub recipient_email: String,
}

pub struct HtmlEmail {
    pub replacement_words: Vec<String>,
    pub subject: Vec<String>,
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
pub enum Email {}

pub async fn handle_emails() {}
