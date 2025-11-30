# Real-Time Collaborative Whiteboard

A high-performance, real-time collaborative whiteboard application built with React, TypeScript, Node.js, and Yjs (CRDTs).

## Features (Planned)
- ✅ Freehand drawing
- 🔄 Real-time collaboration with WebSockets
- 🔄 Multi-user cursors
- 🔄 Conflict-free state synchronization (CRDTs)
- 🔄 Offline support
- 🔄 Undo/Redo functionality

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket
- **State Sync**: Yjs (CRDT library)
- **Database**: PostgreSQL/MongoDB (planned)

## Project Structure
```
project-for-switch/
├── client/          # React frontend
├── server/          # Node.js backend
└── package.json     # Monorepo workspace config
```

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 8+

### Installation
```bash
# Install dependencies for both client and server
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Development
```bash
# Run client (from root)
npm run dev:client

# Run server (from root)
npm run dev:server
```

The client will be available at `http://localhost:5173/`
The server will run on `http://localhost:3000/`

## Development Roadmap
See [roadmap.md](.gemini/antigravity/brain/870e8559-0360-451a-b93e-32dbac2dfca8/roadmap.md) for detailed development phases.

## License
MIT
