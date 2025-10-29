/**
 * Browser shim for pg module
 * This provides mock implementations of pg classes for the browser environment
 */

// Mock EventEmitter functionality
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this; // For chaining
  }

  off(event, listener) {
    if (!this._events[event]) return this;
    if (listener) {
      this._events[event] = this._events[event].filter(l => l !== listener);
    } else {
      delete this._events[event];
    }
    return this;
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }

  emit(event, ...args) {
    if (!this._events[event]) return false;
    for (const listener of this._events[event]) {
      listener(...args);
    }
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }
}

// Mock Pool class (extends EventEmitter)
export class Pool extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    console.warn('PostgreSQL Pool is not available in browser environment');
  }

  async connect() {
    throw new Error('Cannot connect to PostgreSQL from browser');
  }

  async query() {
    throw new Error('Cannot query PostgreSQL from browser');
  }

  async end() {
    return true;
  }

  async release() {
    return;
  }

  async acquire() {
    throw new Error('Cannot acquire client from PostgreSQL pool in browser');
  }

  totalCount() {
    return 0;
  }

  idleCount() {
    return 0;
  }

  waitingCount() {
    return 0;
  }
}

// Mock Client class (extends EventEmitter)
export class Client extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    console.warn('PostgreSQL Client is not available in browser environment');
  }

  async connect() {
    throw new Error('Cannot connect to PostgreSQL from browser');
  }

  async query() {
    throw new Error('Cannot query PostgreSQL from browser');
  }

  async end() {
    return true;
  }
}

// PoolClient interface mock
export class PoolClient extends EventEmitter {
  constructor() {
    super();
    console.warn('PostgreSQL PoolClient is not available in browser environment');
  }

  async query() {
    throw new Error('Cannot query PostgreSQL from browser');
  }

  async release() {
    return;
  }
}

// Export types
export const types = {
  setTypeParser: () => {},
  builtins: {
    INT8: 20,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    DATE: 1082,
    JSON: 114,
    JSONB: 3802,
  },
};

// Export default
export default {
  Pool,
  Client,
  types,
};
