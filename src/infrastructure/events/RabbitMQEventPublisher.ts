import * as amqp from 'amqplib';
import type { EventPublisher } from '../../domain/events/EventPublisher';

type Connection = amqp.Connection;
type Channel = amqp.Channel;

export class RabbitMQEventPublisher implements EventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  constructor(private readonly rabbitmqUrl: string = 'amqp://localhost') {}

  async connect(): Promise<void> {
    try {
      // Try to connect with timeout
      const conn = await Promise.race([
        amqp.connect(this.rabbitmqUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        ),
      ]);

      this.connection = conn as unknown as Connection;
      if (!this.connection) {
        throw new Error('Failed to establish connection');
      }
      this.channel = (await (this.connection as any).createChannel()) as Channel;

      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Declare dead letter exchange for failed messages
      await this.channel.assertExchange('dlx', 'direct', { durable: true });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.warn('RabbitMQ not available, using in-memory fallback:', (error as Error).message);
      // Clean up any partial connection
      if (this.connection) {
        try {
          await (this.connection as any).close();
        } catch {
          // Ignore close errors
        }
        this.connection = null;
      }
      this.channel = null;
    }
  }

  async publish(eventName: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      console.log(`[FALLBACK] Event published: ${eventName}`, payload);
      return;
    }

    try {
      const exchange = 'events';
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const message = JSON.stringify({
        event: eventName,
        payload,
        timestamp: new Date().toISOString(),
      });

      this.channel.publish(exchange, eventName, Buffer.from(message), {
        persistent: true,
        // Add retry headers
        headers: {
          'x-retry-count': 0,
          'x-max-retries': this.maxRetries,
        },
      });

      console.log(`Event published: ${eventName}`);
    } catch (error) {
      console.error(`Error publishing event ${eventName}:`, error);
      throw error;
    }
  }

  async publishWithRetry(
    eventName: string,
    payload: Record<string, unknown>,
    maxRetries: number = this.maxRetries
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.publish(eventName, payload);
        return; // Success
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = this.retryDelay * 2 ** attempt; // Exponential backoff
          console.log(
            `Retry attempt ${attempt + 1}/${maxRetries} for event ${eventName} after ${delay}ms`
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries failed - send to dead letter queue
    console.error(`Failed to publish event ${eventName} after ${maxRetries} retries`);
    await this.sendToDeadLetterQueue(eventName, payload, lastError);
    throw (
      lastError || new Error(`Failed to publish event ${eventName} after ${maxRetries} retries`)
    );
  }

  private async sendToDeadLetterQueue(
    eventName: string,
    payload: Record<string, unknown>,
    error: Error | null
  ): Promise<void> {
    if (!this.channel) return;

    try {
      const dlqMessage = JSON.stringify({
        event: eventName,
        payload,
        error: error?.message,
        timestamp: new Date().toISOString(),
      });

      await this.channel.assertQueue('dlq', { durable: true });
      this.channel.sendToQueue('dlq', Buffer.from(dlqMessage), { persistent: true });
      console.log(`Event sent to dead letter queue: ${eventName}`);
    } catch (error) {
      console.error('Error sending to DLQ:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}
