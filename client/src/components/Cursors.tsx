import React, { useEffect, useState } from 'react';
import { awareness } from '../lib/yjs';

interface Cursor {
  x: number;
  y: number;
  name: string;
  color: string;
}

export const Cursors: React.FC = () => {
  const [cursors, setCursors] = useState<Map<number, Cursor>>(new Map());

  useEffect(() => {
    const updateCursors = () => {
      const states = awareness.getStates();
      const newCursors = new Map<number, Cursor>();

      states.forEach((state, clientId) => {
        // Don't show our own cursor
        if (clientId === awareness.clientID) return;

        if (state.cursor && state.user) {
          newCursors.set(clientId, {
            x: state.cursor.x,
            y: state.cursor.y,
            name: state.user.name,
            color: state.user.color,
          });
        }
      });

      setCursors(newCursors);
    };

    awareness.on('change', updateCursors);
    return () => awareness.off('change', updateCursors);
  }, []);

  return (
    <>
      {Array.from(cursors.entries()).map(([clientId, cursor]) => (
        <div
          key={clientId}
          className="absolute pointer-events-none z-50 transition-transform duration-100"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Cursor dot */}
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: cursor.color }}
          />
          {/* User name label */}
          <div
            className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
};
