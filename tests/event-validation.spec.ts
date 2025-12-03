import { test, expect } from '@playwright/test';
import { kafkaConsumer } from '../src/kafka/consumer';
import { kafkaProducer } from '../src/kafka/producer';
import { validateSchema } from '../src/utils/schemaValidator';
import path from 'path';

const TOPIC = 'order.events';
const SCHEMA_PATH = path.join(__dirname, '../schema/order.schema.json');

test.describe('EventStream E2E Validation', () => {
    test.beforeAll(async () => {
        // Connect to Kafka
        await kafkaConsumer.connect();
        await kafkaProducer.connect();
        await kafkaConsumer.subscribe(TOPIC);
        await kafkaConsumer.run();
        // Give some time for the consumer to join the group and assign partitions
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test.afterAll(async () => {
        // Disconnect from Kafka
        await kafkaConsumer.disconnect();
        await kafkaProducer.disconnect();
    });

    test('should validate that an order event is published and matches the schema', async () => {
        const orderId = `ORDER-${Date.now()}`;
        const eventPayload = {
            orderId: orderId,
            status: 'CREATED',
            amount: 150.00,
            timestamp: new Date().toISOString()
        };

        // 1. Start listening for the event
        // We expect an event where the orderId matches our generated ID
        const eventPromise = kafkaConsumer.waitForEvent(
            (event) => event.orderId === orderId
        );

        // 2. Trigger the action (Simulating backend event)
        await kafkaProducer.sendEvent(TOPIC, eventPayload);

        // 3. Await the event
        const receivedEvent = await eventPromise;

        // 4. Assertions
        expect(receivedEvent).toBeDefined();
        expect(receivedEvent.orderId).toBe(orderId);
        expect(receivedEvent.status).toBe('CREATED');
        expect(receivedEvent.amount).toBe(150.00);

        // 5. Schema Validation
        const validationResult = validateSchema(SCHEMA_PATH, receivedEvent);
        expect(validationResult.isValid, `Schema validation failed: ${JSON.stringify(validationResult.errors)}`).toBe(true);
    });
});
