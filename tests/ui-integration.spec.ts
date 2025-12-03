import { test, expect } from '@playwright/test';
import { kafkaConsumer } from '../src/kafka/consumer';
import { kafkaProducer } from '../src/kafka/producer';
import path from 'path';

const TOPIC = 'order.events';

test.describe('UI Integration Test', () => {
    test.beforeAll(async () => {
        await kafkaConsumer.connect();
        await kafkaProducer.connect();
        await kafkaConsumer.subscribe(TOPIC);
        await kafkaConsumer.run();
        // Give some time for the consumer to join the group
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test.afterAll(async () => {
        await kafkaConsumer.disconnect();
        await kafkaProducer.disconnect();
    });

    test('should trigger kafka event when "Place Order" is clicked', async ({ page }) => {
        // 1. Intercept the network request
        // We simulate the backend here: when the UI calls the API, we intercept it
        // and publish the event to Kafka ourselves.
        await page.route('http://localhost:5000/api/orders', async (route) => {
            const request = route.request();
            const postData = request.postDataJSON();

            // Simulate Backend: Publish to Kafka
            await kafkaProducer.sendEvent(TOPIC, postData);

            // Respond to UI
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, orderId: postData.orderId })
            });
        });

        // 2. Load the mock UI
        // We use file:// protocol to load the local HTML file
        const mockHtmlPath = path.join(__dirname, '../src/mock/mock.html');
        await page.goto(`file://${mockHtmlPath}`);

        // 3. Setup Consumer Waiter
        // We don't know the orderId yet, but we know it starts with ORDER-
        // In a real app, we might generate the ID in the UI or get it from the response.
        // Here, the UI generates it. We can capture it from the request or just wait for *any* event 
        // that matches our structure in this short window.
        // Better: let's capture the orderId from the UI status or the intercepted request.
        // Actually, we can just wait for an event that looks like what we expect.

        let capturedOrderId: string;
        const eventPromise = kafkaConsumer.waitForEvent((event) => {
            if (event.orderId && event.orderId.startsWith('ORDER-')) {
                capturedOrderId = event.orderId;
                return true;
            }
            return false;
        });

        // 4. Perform UI Action
        await page.click('#place-order-btn');

        // 5. Verify UI Feedback
        await expect(page.locator('#status')).toContainText('Order placed: ORDER-');

        // 6. Verify Kafka Event
        const receivedEvent = await eventPromise;
        expect(receivedEvent).toBeDefined();
        expect(receivedEvent.status).toBe('CREATED');
        expect(receivedEvent.amount).toBe(150.00);

        // Verify the ID matches what was displayed in the UI
        const statusText = await page.locator('#status').innerText();
        expect(statusText).toContain(receivedEvent.orderId);
    });
});
