import { Producer } from 'kafkajs';
import { kafka } from './kafkaClient';
import { Logger } from '../utils/logger';

class KafkaProducer {
    private producer: Producer;

    constructor() {
        this.producer = kafka.producer();
    }

    public async connect(): Promise<void> {
        try {
            await this.producer.connect();
            Logger.info('Producer connected');
        } catch (error) {
            Logger.error('Error connecting producer', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.producer.disconnect();
            Logger.info('Producer disconnected');
        } catch (error) {
            Logger.error('Error disconnecting producer', error);
            throw error;
        }
    }

    public async sendEvent(topic: string, message: object): Promise<void> {
        try {
            const payload = JSON.stringify(message);
            await this.producer.send({
                topic,
                messages: [{ value: payload }],
            });
            Logger.info(`Event sent to topic ${topic}: ${payload}`);
        } catch (error) {
            Logger.error(`Error sending event to topic ${topic}`, error);
            throw error;
        }
    }
}

export const kafkaProducer = new KafkaProducer();
