export interface EventPublisher {
  publish(eventName: string, payload: Record<string, unknown>): Promise<void>;
  publishWithRetry(
    eventName: string,
    payload: Record<string, unknown>,
    maxRetries?: number
  ): Promise<void>;
}
