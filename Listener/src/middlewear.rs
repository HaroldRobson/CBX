use alloy::{
    primitives::address,
    providers::{Provider, ProviderBuilder, WsConnect},
    rpc::types::{BlockNumberOrTag, Filter},
};
use futures_util::stream::StreamExt;
use std::error::Error;
use std::result::Result;

pub struct EventHandler {}
