import { Consumer } from 'kafkajs';
import { kafka } from './kafkaClient';
import { kafkaConfig } from '../config/kafka.config';
import { Logger } from '../utils/logger';
import { randomUUID } from 'crypto';

type EventPredicate = (event: any) => boolean;

interface Waiter {
    predicate: EventPredicate;
    resolve: (event: any) => void;
    reject: (reason?: any) => void;
    timer: NodeJS.Timeout;
}

class KafkaConsumer {
    private consumer: Consumer;
    private waiters: Set<Waiter> = new Set();
    private isRunning: boolean = false;

    constructor() {
        const groupId = `${kafkaConfig.groupId}-${randomUUID()}`;
        this.consumer = kafka.consumer({ groupId });
    }

    public async connect(): Promise<void> {
        try {
            await this.consumer.connect();
            Logger.info('Consumer connected');
        } catch (error) {
            Logger.error('Error connecting consumer', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.consumer.disconnect();
            this.isRunning = false;
            Logger.info('Consumer disconnected');
        } catch (error) {
            Logger.error('Error disconnecting consumer', error);
            throw error;
        }
    }

    public async subscribe(topic: string): Promise<void> {
        try {
            await this.consumer.subscribe({ topic, fromBeginning: true });
            Logger.info(`Subscribed to topic: ${topic}`);
        } catch (error) {
            Logger.error(`Error subscribing to topic ${topic}`, error);
            throw error;
        }
    }

    public async run(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = message.value?.toString();
                if (!value) return;

                try {
                    const event = JSON.parse(value);
                    Logger.info(`Received event on ${topic}: ${JSON.stringify(event)}`);
                    this.checkWaiters(event);
                } catch (error) {
                    Logger.error('Error parsing message value', error);
                }
            },
        });
    }

    public waitForEvent(predicate: EventPredicate, timeoutMs: number = 10000): Promise<any> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.waiters.forEach((waiter) => {
                    if (waiter.timer === timer) {
                        this.waiters.delete(waiter);
                        reject(new Error(`Timeout waiting for event after ${timeoutMs}ms`));
                    }
                });
            }, timeoutMs);

            const waiter: Waiter = {
                predicate,
                resolve,
                reject,
                timer,
            };

            this.waiters.add(waiter);
        });
    }

    private checkWaiters(event: any) {
        for (const waiter of this.waiters) {
            if (waiter.predicate(event)) {
                clearTimeout(waiter.timer);
                waiter.resolve(event);
                this.waiters.delete(waiter);
            }
        }
    }
}

export const kafkaConsumer = new KafkaConsumer();
