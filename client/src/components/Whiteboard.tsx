import React, { useRef, useState, useEffect } from 'react';
import { yStrokes, awareness, provider, Stroke } from '../lib/yjs';

export const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Get user info from awareness
  const userInfo = awareness.getLocalState()?.user as { name: string; color: string };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      setContext(ctx);
    }

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-apply context settings after resize
        if (ctx) {
          ctx.lineCap = 'round';
        }
        // Redraw all strokes after resize
        redrawCanvas();
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    // Listen for connection status changes
    provider.on('status', (event: { status: string }) => {
      setConnectionStatus(event.status as any);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Listen for changes to the shared strokes array
  useEffect(() => {
    const observer = () => {
      redrawCanvas();
    };

    yStrokes.observe(observer);
    return () => yStrokes.unobserve(observer);
  }, [context]);

  // Redraw canvas from Yjs shared state
  const redrawCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes from shared state (parse JSON strings)
    const strokeStrings: string[] = yStrokes.toArray();
    strokeStrings.forEach((strokeStr) => {
      try {
        const stroke = JSON.parse(strokeStr) as Stroke;
        if (!stroke.points || stroke.points.length < 2) return;

        context.beginPath();
        context.strokeStyle = stroke.color;
        context.lineWidth = stroke.width;
        context.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          context.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        context.stroke();
        context.closePath();
      } catch (e) {
        console.error("Failed to parse stroke:", e);
      }
    });
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!context) return;
    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setCurrentStroke([point]);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !context) return;
    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setCurrentStroke((prev) => [...prev, point]);

    // Draw locally for immediate feedback
    context.strokeStyle = userInfo.color;
    context.lineWidth = 2;
    if (currentStroke.length > 0) {
      context.beginPath();
      context.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
      context.lineTo(point.x, point.y);
      context.stroke();
      context.closePath();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return;

    // Add stroke to Yjs shared state
    const stroke: Stroke = {
      id: `${Date.now()}-${Math.random()}`,
      points: currentStroke,
      color: userInfo.color,
      width: 2,
      userId: awareness.clientID.toString(),
    };

    yStrokes.push([JSON.stringify(stroke)]);

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Broadcast cursor position (throttled)
  const handleMouseMove = (e: React.MouseEvent) => {
    draw(e);
    
    // Throttle cursor updates to every 50ms
    const now = Date.now();
    if (!handleMouseMove.lastUpdate || now - handleMouseMove.lastUpdate > 50) {
      awareness.setLocalStateField('cursor', {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      });
      handleMouseMove.lastUpdate = now;
    }
  };
  handleMouseMove.lastUpdate = 0;

  return (
    <>
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10 bg-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair bg-white"
      />
    </>
  );
};
