# 🏗️ EventStream E2E Validator — Implementation Blueprint

This guide details the step-by-step process to build the **EventStream E2E Validator** from scratch. Follow these phases to construct the framework.

## 🟢 Phase 1: Environment & Setup

1.  **Initialize Project**
    *   Run `npm init -y` to create `package.json`.
    *   Install dependencies:
        ```bash
        npm install kafkajs ajv
        npm install -D @playwright/test typescript ts-node @types/node
        ```

2.  **TypeScript Configuration**
    *   Create `tsconfig.json`.
    *   Enable `esModuleInterop`, `resolveJsonModule`, and ensure `lib` includes "es6" and "dom".

3.  **Docker Environment (Kafka)**
    *   Create `docker-compose.yml`.
    *   Add **Zookeeper** (port 2181) and **Kafka** (port 9092) services.
    *   *Goal*: Ensure you can run `docker-compose up -d` and have a running Kafka broker.

## 🟡 Phase 2: Core Infrastructure

4.  **Folder Structure**
    *   Create the following directory tree:
        ```text
        src/
        ├── config/
        ├── kafka/
        ├── utils/
        ├── mocks/
        tests/
        schema/
        ```

5.  **Configuration**
    *   Create `src/config/kafka.config.ts`: Export an object with `brokers: ['localhost:9092']`, `clientId`, and `groupId`.
    *   Create `src/config/topics.json`: Define your topic names (e.g., `{"ORDER_EVENTS": "order.events"}`).

6.  **Utilities**
    *   **Logger**: Create `src/utils/logger.ts` for consistent console logging.
    *   **Schema Validator**: Create `src/utils/schemaValidator.ts`.
        *   Initialize `AJV`.
        *   Create a function `validateSchema(schemaPath, data)` that returns true/false or error details.

## 🟠 Phase 3: Kafka Layer Implementation

7.  **Kafka Client**
    *   Create `src/kafka/kafkaClient.ts`.
    *   Instantiate the `Kafka` class from `kafkajs` using the config from Phase 2.

8.  **Producer (The Simulator)**
    *   Create `src/kafka/producer.ts`.
    *   Implement `connect()`, `disconnect()`, and `sendEvent(topic, message)`.
    *   *Purpose*: This will simulate the backend event that usually triggers after a UI action.

9.  **Consumer (The Validator)**
    *   Create `src/kafka/consumer.ts`.
    *   Implement `connect()` and `subscribe(topic)`.
    *   **Crucial Feature**: Implement a `waitForEvent(predicate, timeout)` method.
        *   This method should return a Promise that resolves when a message matching the `predicate` (e.g., `msg.id === expectedId`) arrives.

## 🔴 Phase 4: Test & Validation Logic

10. **Define Contracts**
    *   Create `schema/order.schema.json`.
    *   Define the JSON schema for your event (e.g., required fields: `orderId`, `status`, `amount`).

11. **Playwright Setup**
    *   Create `playwright.config.ts`.
    *   Configure the test directory to `./tests`.

12. **E2E Test Implementation**
    *   Create `tests/event-validation.spec.ts`.
    *   **Setup**: In `test.beforeAll`, connect the Kafka Consumer.
    *   **Test**:
        1.  Start listening for the event (`consumer.waitForEvent(...)`).
        2.  Trigger the action (using `producer.sendEvent(...)` for now, or a UI action later).
        3.  Await the event promise.
        4.  Assert the event payload matches `schema/order.schema.json` using your `schemaValidator`.
    *   **Teardown**: In `test.afterAll`, disconnect the consumer.

## 🔵 Phase 5: Execution & Verification

13. **Run the Stack**
    *   Start Kafka: `docker-compose up -d`
    *   Run Tests: `npx playwright test`

14. **Verify Results**
    *   Check Playwright reports.
    *   Ensure the consumer correctly intercepted and validated the message.