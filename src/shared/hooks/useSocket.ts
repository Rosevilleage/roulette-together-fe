import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Global socket instance - shared across all components
let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // 쿠키 전송을 위해 필수 (방장 인증용)
      autoConnect: false // 자동 연결 비활성화
    });

    console.log('[Socket] Created new socket instance (not connected yet)');
  }

  // Always ensure socket is connected
  if (!globalSocket.connected) {
    console.log('[Socket] Connecting to server...');
    globalSocket.connect();
  }

  return globalSocket;
}

/**
 * Hook to manage Socket.IO connection
 * @returns Socket instance or null if not connected
 */
export const useSocket = (): Socket | null => {
  const [socket] = useState<Socket>(() => getOrCreateSocket());
  const [, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // Connection event handlers
    const handleConnect = (): void => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    };

    const handleDisconnect = (reason: string): void => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    };

    const handleConnectError = (error: Error): void => {
      console.error('[Socket] Connection error:', error);
      console.error('[Socket] WS_URL:', WS_URL);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // If socket is already connected, trigger via setTimeout to avoid direct setState in effect
    if (socket.connected) {
      // Use setTimeout to defer the state update
      const timer = setTimeout(() => {
        setConnected(true);
      }, 0);

      // Cleanup - only remove listeners
      return () => {
        clearTimeout(timer);
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
      };
    }

    // Cleanup - only remove listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  return socket;
};
