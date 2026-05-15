# PayVault

A minimal fintech payment system built with **Spring Boot** + **Next.js**.

![PayVault](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## Overview

PayVault lets users send money between accounts, view balances, and browse transaction history. Built as a portfolio project demonstrating clean backend architecture and minimal frontend design.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Java 17, Spring Boot 3.2, JdbcTemplate |
| Database  | H2 (in-memory)                          |
| Frontend  | Next.js 14, TypeScript                  |

## Architecture

### Backend — MVC + Repository pattern

```
src/
├── controller/      # REST endpoints (MVC layer)
│   ├── UserController.java
│   └── PaymentController.java
├── service/         # Business logic
│   ├── UserService.java
│   └── PaymentService.java
├── repository/      # Data access via JdbcTemplate (raw SQL)
│   ├── UserRepository.java
│   └── TransactionRepository.java
├── model/           # Domain objects
├── dto/             # Request/response shapes
├── exception/       # Custom exceptions + global handler
└── config/          # CORS config
```

No JPA/ORM — all SQL is written explicitly with `JdbcTemplate`.

### Frontend — Next.js App Router

```
src/
├── app/
│   ├── page.tsx         # Main dashboard (accounts, send, history)
│   ├── layout.tsx
│   └── globals.css
└── lib/
    └── api.ts           # Typed API client
```

## API Endpoints

```
GET    /api/users                     — List all users
GET    /api/users/:id                 — Get user by ID
POST   /api/users                     — Create user
GET    /api/users/:id/transactions    — User's transaction history

POST   /api/payments/send             — Send a payment
GET    /api/payments/transactions     — All transactions
GET    /api/payments/transactions/:id — Single transaction
```

## Running Locally

### Backend

```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
# H2 console: http://localhost:8080/h2-console
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Seed Data

On startup, 5 accounts are created automatically:

| Name         | Balance     |
|--------------|-------------|
| Alice Morgan | $5,000.00   |
| Ben Carter   | $3,200.50   |
| Clara Nwosu  | $8,750.00   |
| David Okafor | $1,500.00   |
| Eva Martins  | $12,000.00  |

## Key Decisions

- **JdbcTemplate over JPA** — explicit SQL makes the data access layer transparent and easy to reason about
- **H2 in-memory** — zero setup, perfect for demo; swap `application.properties` for PostgreSQL/MySQL in production
- **`@Transactional` on payments** — debit + credit are atomic; if either fails the whole operation rolls back
- **Global exception handler** — all errors return a consistent `{ success, message, data }` envelope
