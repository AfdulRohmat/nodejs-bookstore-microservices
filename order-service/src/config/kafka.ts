import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
});

export const producer = kafka.producer();
