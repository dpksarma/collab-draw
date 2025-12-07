import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Stroke type definition
export interface Stroke {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
    userId: string;
}

// Create a Yjs document (shared state)
export const ydoc = new Y.Doc();

// Create a WebSocket provider to sync with the server
// Room name: 'whiteboard' (all users in this room see the same canvas)
export const provider = new WebsocketProvider(
    'ws://localhost:3000', // WebSocket server URL
    'whiteboard',          // Room name
    ydoc
);

// Shared array of strokes (CRDT) - stored as JSON strings
export const yStrokes = ydoc.getArray<string>('strokes');

// Awareness API for ephemeral state (cursors, user info)
export const awareness = provider.awareness;

// Set local user info
awareness.setLocalStateField('user', {
    name: `User-${Math.floor(Math.random() * 1000)}`,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
});

// Connection status helpers
export const onConnected = (callback: () => void) => {
    provider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
            callback();
        }
    });
};

export const onDisconnected = (callback: () => void) => {
    provider.on('status', (event: { status: string }) => {
        if (event.status === 'disconnected') {
            callback();
        }
    });
};
