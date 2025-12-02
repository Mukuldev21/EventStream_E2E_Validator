🌐 EventStream E2E Validator — Playwright + Kafka Event Automation Framework

A end-to-end testing framework that validates event-driven microservices by ensuring that UI actions (simulated or real) correctly trigger Kafka events.
This framework combines Playwright for UI workflows, KafkaJS for message stream validation, and AJV schema validation for contract enforcement.

Fintech | Banking | E-commerce | Microservices | Real-time systems | Event-driven platforms

🚀 Key Features

✔ UI → Kafka End-to-End Validation

Simulated or real UI actions trigger events that are validated through Kafka consumers.

✔ Event Schema Validation

Using AJV, Kafka payloads are validated against strict JSON schemas.

✔ Microservices Ready

Designed for event-driven architectures used in modern product companies.

✔ Supports Local Kafka via Docker

Easily run Kafka + Zookeeper using docker-compose.

✔ Realistic Enterprise-Style Project

Includes full blueprint, folder structure, documentation, mock UI, producer, consumer, and Playwright test flows.

🏗 Architecture

        ┌────────────────────────────┐
        │      Playwright UI Layer   │
        │ (Simulated UI actions)     │
        └───────────────┬────────────┘
                        │ triggers
                        ▼
        ┌────────────────────────────┐
        │   Event Producer Layer     │
        │ (Kafka Producer Script)    │
        └───────────────┬────────────┘
                        │ sends
                        ▼
        ┌────────────────────────────┐
        │         Kafka Topic        │
        │     (order.events etc.)    │
        └───────────────┬────────────┘
                        │ consumed by
                        ▼
        ┌────────────────────────────┐
        │  Event Validation Engine   │
        │ (Kafka Consumer + Schema)  │
        └───────────────┬────────────┘
                        │ asserts
                        ▼
        ┌────────────────────────────┐
        │       Test Assertions      │
        └────────────────────────────┘



📁 Project Folder Structure
        


    

    eventstream-e2e-validator/
    ├── README.md
    ├── docker-compose.yml
    ├── package.json
    ├── tsconfig.json
    ├── playwright.config.ts
    ├── src/
    │    ├── kafka/
    │    │     ├── kafkaClient.ts
    │    │     ├── producer.ts
    │    │     └── consumer.ts
    │    │
    │    ├── utils/
    │    │     ├── schemaValidator.ts
    │    │     ├── logger.ts
    │    │     └── eventParser.ts
    │    │
    │    ├── config/
    │    │     ├── kafka.config.json
    │    │     └── topics.json
    │    │
    │    └── mocks/
    │          └── mock-ui.html

    ├── tests/
    │    ├── event-validation.spec.ts
    │    ├── schema-validation.spec.ts
    │    └── e2e-flow.spec.ts
    ├── schema/
    │    └── order.schema.json
    └── docs/
        ├── architecture.md
        ├── sequence-diagram.md
        └── how-it-works.md


🐳 Running Kafka Using Docker

Start Kafka + Zookeeper:

        docker-compose up -d


📝 Prerequisites


    Node.js (v16 or higher)
    Playwright
    KafkaJS
    AJV
    Docker (for running Kafka)
