type EventCallback<T = unknown> = (data: T) => void;

interface Subscription {
  unsubscribe: () => void;
}

export class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

  on<T>(event: string, callback: EventCallback<T>): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const callbacks = this.listeners.get(event)!;
    callbacks.add(callback as EventCallback);

    return {
      unsubscribe: () => callbacks.delete(callback as EventCallback),
    };
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<T>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
