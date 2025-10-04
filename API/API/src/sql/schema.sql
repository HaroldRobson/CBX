CREATE TABLE IF NOT EXISTS users (
  wallet_address VARCHAR(50) PRIMARY KEY,
  email VARCHAR(40) DEFAULT NULL
  );


CREATE TABLE IF NOT EXISTS pending_registry_retirements_gs (
  bundle_id VARCHAR(255) PRIMARY KEY,
  bundle_size INTEGER NOT NULL,
  bytes_data VARCHAR(100000) NOT NULL,
  pool_address VARCHAR(50) NOT NULL,
  registry_transaction_id VARCHAR(50)
  );

CREATE TABLE IF NOT EXISTS queued_tokens (
  wallet_address VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(70) PRIMARY KEY,
  pool_address VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL
  );

CREATE TYPE STATUS AS ENUM ('pending', 'active', 'retired');

CREATE TABLE IF NOT EXISTS pool_details ( 
  pool_status status NOT NULL,
  pool_address VARCHAR(50) PRIMARY KEY,
  ipfs_uri VARCHAR(50) NOT NULL,
  credit_id VARCHAR(70),
  seller_address VARCHAR(50) NOT NULL,
  initial_supply INTEGER NOT NULL,
  seller_registry_details VARCHAR(70) NOT NULL,
  registry INTEGER
  );

CREATE TABLE IF NOT EXISTS pending_registry_transfers_gs (
  pool_address VARCHAR(50) NOT NULL,
  seller_address VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(70) PRIMARY KEY,
  amount INTEGER NOT NULL,
  registry_transaction_id VARCHAR(70)
  );


CREATE TABLE IF NOT EXISTS handled_evm_events (
  tx_hash VARCHAR(70) NOT NULL,
  log_index INT NOT NULL,
  block_number INT NOT NULL
);

CREATE TYPE severity AS ENUM ('warning', 'error', 'fatal');

CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50),
  message VARCHAR(1000),
  timestamp TIMESTAMPTZ,
  severity severity 
);
