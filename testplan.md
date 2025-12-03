# 🧪 EventStream E2E Validator - Test Plan

This document outlines the test scenarios covered by the EventStream E2E Validator framework.

## 🟢 Basic Validation
**File:** `tests/event-validation.spec.ts`

### 1. Valid Event Publication & Schema Validation
*   **Objective**: Verify that a valid order event is correctly published to Kafka and validates against the defined JSON schema.
*   **Steps**:
    1.  Subscribe to `order.events` topic.
    2.  Publish a valid JSON event with `orderId`, `status`, `amount`, and `timestamp`.
    3.  Wait for the consumer to receive the event with the matching `orderId`.
    4.  Validate the received event against `schema/order.schema.json`.
*   **Expected Result**:
    *   Event is received.
    *   Event data matches the published data.
    *   Schema validation passes (`isValid: true`).

## 🟠 Advanced Scenarios
**File:** `tests/advanced-scenarios.spec.ts`

### 2. Invalid Schema Validation
*   **Objective**: Ensure that events violating the schema are correctly flagged as invalid.
*   **Steps**:
    1.  Subscribe to `order.events` topic.
    2.  Publish an event missing a required field (e.g., `amount`).
    3.  Wait for the event.
    4.  Validate against schema.
*   **Expected Result**:
    *   Schema validation fails (`isValid: false`).
    *   Error details indicate the missing property.

### 3. Timeout Handling
*   **Objective**: Verify that the test fails gracefully (times out) if the expected event does not arrive within the specified duration.
*   **Steps**:
    1.  Subscribe to `order.events` topic.
    2.  Call `waitForEvent` for an `orderId` that will NOT be published.
    3.  Set a short timeout (e.g., 2000ms).
*   **Expected Result**:
    *   The `waitForEvent` promise rejects with a "Timeout waiting for event" error.

### 4. Multiple Events Filtering
*   **Objective**: Verify that the consumer can identify and capture a specific event from a stream containing multiple unrelated events.
*   **Steps**:
    1.  Subscribe to `order.events` topic.
    2.  Publish "Noise Event 1".
    3.  Publish "Target Event" (the one we are waiting for).
    4.  Publish "Noise Event 2".
    5.  Call `waitForEvent` filtering for "Target Event" ID.
*   **Expected Result**:
    *   The consumer correctly resolves with the "Target Event".
    *   Noise events do not trigger a false positive resolution.


