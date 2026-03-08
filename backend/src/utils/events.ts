import { EventEmitter } from 'events';

// Create a globally shared event emitter instance for the backend
const globalEventEmitter = new EventEmitter();

// Export the emitter and generic event names to avoid typos
export const events = {
    NEW_ORDER: 'new_order',
};

export default globalEventEmitter;
