CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)   NOT NULL,
    email       VARCHAR(150)   NOT NULL UNIQUE,
    balance     DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id       BIGINT         NOT NULL,
    receiver_id     BIGINT         NOT NULL,
    amount          DECIMAL(15, 2) NOT NULL,
    note            VARCHAR(255),
    status          VARCHAR(20)    NOT NULL DEFAULT 'COMPLETED',
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sender   FOREIGN KEY (sender_id)   REFERENCES users(id),
    CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
    CONSTRAINT chk_amount  CHECK (amount > 0),
    CONSTRAINT chk_different_users CHECK (sender_id <> receiver_id)
);
