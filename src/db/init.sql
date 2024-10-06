CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_token VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  limit_amount NUMERIC NOT NULL,
  limit_currency VARCHAR(255) NOT NULL,
  fractional_digits INTEGER NOT NULL
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(255) NOT NULL,
  currency VARCHAR(255) NOT NULL,
  fractional_digits INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  status VARCHAR(255) NOT NULL, -- Assuming 'TransactionStatus' is an enum, adapt accordingly
  fees_currency VARCHAR(255),  -- Nullable, no NOT NULL constraint
  fees_fractional_digits INTEGER, -- Nullable
  fees_amount BIGINT,  -- Nullable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  provider_event_time TIMESTAMP,  -- Nullable
  psp VARCHAR(255) NOT NULL, -- Assuming 'PSP' is an enum, adapt accordingly
  card_id UUID REFERENCES cards(id), -- Foreign key to the cards table
  idempotency_key VARCHAR(255) UNIQUE NOT NULL
);

-- Create the index for the reference field
CREATE INDEX idx_reference ON transactions(reference);

CREATE TABLE balance_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount BIGINT NOT NULL,
  fractional_digits INTEGER NOT NULL,
  currency VARCHAR(255) NOT NULL
);

-- Create an index for the card_id field
CREATE INDEX idx_card_id ON balance_checkpoints(card_id);