import React from 'react';
import { Whiteboard } from './components/Whiteboard';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold mb-2">Collaborative Whiteboard</h1>
        <p className="text-sm text-gray-500">Start drawing!</p>
      </div>
      <Whiteboard />
    </div>
  );
}

export default App;
