import { EventEmitter } from "events";
import type { FirestorePermissionError } from "./errors";

// This is a simple event emitter that allows different parts of the application
// to communicate with each other without having to be directly coupled.
//
// In this case, we're using it to allow the data fetching logic to signal
// a permission error to the UI, which can then display an error message.

type AppEvents = {
  "permission-error": (error: FirestorePermissionError) => void;
};

class TypedEventEmitter {
  private emitter = new EventEmitter();

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): void {
    this.emitter.on(event, listener);
  }

  off<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): void {
    this.emitter.off(event, listener);
  }

  emit<T extends keyof AppEvents>(
    event: T,
    ...args: Parameters<AppEvents[T]>
  ): void {
    this.emitter.emit(event, ...args);
  }
}

export const errorEmitter = new TypedEventEmitter();
