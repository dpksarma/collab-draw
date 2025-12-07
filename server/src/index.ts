import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;

// Store Yjs documents by room name
const docs = new Map<string, Y.Doc>();
const awarenessStates = new Map<string, awarenessProtocol.Awareness>();
// Track which room each WebSocket belongs to
const wsRooms = new Map<WebSocket, string>();

app.get('/', (req, res) => {
    res.send('Real-Time Collaboration Server is running');
});

wss.on('connection', (ws: WebSocket, req) => {
    console.log('Client connected');

    // Extract room name from URL (default to 'whiteboard')
    const roomName = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('room') || 'whiteboard';

    // Get or create Yjs document for this room
    if (!docs.has(roomName)) {
        docs.set(roomName, new Y.Doc());
        awarenessStates.set(roomName, new awarenessProtocol.Awareness(docs.get(roomName)!));
    }

    const doc = docs.get(roomName)!;
    const awareness = awarenessStates.get(roomName)!;

    // Track this WebSocket's room
    wsRooms.set(ws, roomName);
    console.log(`Client joined room: ${roomName}`);

    // Send initial sync
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // Message type: sync step 1
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));


    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
        const uint8Array = new Uint8Array(message);
        const decoder = decoding.createDecoder(uint8Array);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
            case 0: // Sync step 1
                const encoder1 = encoding.createEncoder();
                encoding.writeVarUint(encoder1, 1); // Sync step 2
                syncProtocol.writeSyncStep2(encoder1, doc);
                ws.send(encoding.toUint8Array(encoder1));
                break;
            case 1: // Sync step 2
                syncProtocol.readSyncStep2(decoder, doc, null);
                break;
            case 2: // Update
                syncProtocol.readUpdate(decoder, doc, null);
                // Broadcast to other clients
                broadcastUpdate(roomName, uint8Array, ws);
                break;
            case 3: // Awareness
                awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), null);
                // Broadcast awareness to other clients
                broadcastAwareness(roomName, uint8Array, ws);
                break;
        }
    });

    // Send awareness state
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, 3); // Awareness message
    encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
    ws.send(encoding.toUint8Array(awarenessEncoder));

    ws.on('close', () => {
        console.log('Client disconnected');
        wsRooms.delete(ws); // Clean up room tracking
    });
});

// Broadcast update to all clients in a room except sender
function broadcastUpdate(roomName: string, update: Uint8Array, sender: WebSocket) {
    wss.clients.forEach((client) => {
        // Only send to clients in the same room
        if (client !== sender && client.readyState === WebSocket.OPEN && wsRooms.get(client) === roomName) {
            client.send(update);
        }
    });
}

// Broadcast awareness to all clients in a room except sender
function broadcastAwareness(roomName: string, update: Uint8Array, sender: WebSocket) {
    wss.clients.forEach((client) => {
        // Only send to clients in the same room
        if (client !== sender && client.readyState === WebSocket.OPEN && wsRooms.get(client) === roomName) {
            client.send(update);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket ready for Yjs connections`);
});
