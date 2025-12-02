import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../config/kafka.config';

export const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
});
