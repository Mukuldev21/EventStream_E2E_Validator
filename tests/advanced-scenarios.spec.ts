import { test, expect } from '@playwright/test';
import { kafkaConsumer } from '../src/kafka/consumer';
import { kafkaProducer } from '../src/kafka/producer';
import { validateSchema } from '../src/utils/schemaValidator';
import path from 'path';

const TOPIC = 'order.events';
const SCHEMA_PATH = path.join(__dirname, '../schema/order.schema.json');

test.describe('EventStream E2E Advanced Scenarios', () => {
    test.beforeAll(async () => {
        await kafkaConsumer.connect();
        await kafkaProducer.connect();
        await kafkaConsumer.subscribe(TOPIC);
        await kafkaConsumer.run();
        // Give some time for the consumer to join the group and assign partitions
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test.afterAll(async () => {
        await kafkaConsumer.disconnect();
        await kafkaProducer.disconnect();
    });

    test('should fail validation for an invalid event schema', async () => {
        const orderId = `INVALID-ORDER-${Date.now()}`;
        // Missing 'amount' and 'status' has wrong type (should be string, let's pretend or just omit required fields)
        // Schema requires: orderId, status, amount, timestamp.
        // Let's send an event missing 'amount'.
        const invalidEventPayload = {
            orderId: orderId,
            status: 'CREATED',
            // amount is missing
            timestamp: new Date().toISOString()
        };

        const eventPromise = kafkaConsumer.waitForEvent(
            (event) => event.orderId === orderId
        );

        await kafkaProducer.sendEvent(TOPIC, invalidEventPayload);

        const receivedEvent = await eventPromise;

        const validationResult = validateSchema(SCHEMA_PATH, receivedEvent);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toBeDefined();
        // We expect an error about missing property 'amount'
        const missingAmountError = validationResult.errors?.find(e => e.message?.includes("must have required property 'amount'"));
        expect(missingAmountError).toBeDefined();
    });

    test('should timeout when waiting for an event that never arrives', async () => {
        const orderId = `MISSING-ORDER-${Date.now()}`;

        // We do NOT send an event.

        // Expect waitForEvent to reject with a timeout error.
        // Using a short timeout for the test (e.g., 2000ms)
        await expect(kafkaConsumer.waitForEvent(
            (event) => event.orderId === orderId,
            2000
        )).rejects.toThrow('Timeout waiting for event');
    });

    test('should correctly filter specific event from multiple events', async () => {
        const targetOrderId = `TARGET-ORDER-${Date.now()}`;
        const noiseOrderId1 = `NOISE-ORDER-1-${Date.now()}`;
        const noiseOrderId2 = `NOISE-ORDER-2-${Date.now()}`;

        const targetEvent = {
            orderId: targetOrderId,
            status: 'CREATED',
            amount: 100,
            timestamp: new Date().toISOString()
        };
        const noiseEvent1 = { ...targetEvent, orderId: noiseOrderId1 };
        const noiseEvent2 = { ...targetEvent, orderId: noiseOrderId2 };

        const eventPromise = kafkaConsumer.waitForEvent(
            (event) => event.orderId === targetOrderId
        );

        // Send noise events first, then target, then more noise
        await kafkaProducer.sendEvent(TOPIC, noiseEvent1);
        await kafkaProducer.sendEvent(TOPIC, targetEvent);
        await kafkaProducer.sendEvent(TOPIC, noiseEvent2);

        const receivedEvent = await eventPromise;

        expect(receivedEvent.orderId).toBe(targetOrderId);
    });
});
