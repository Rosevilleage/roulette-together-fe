import { useEffect, useSyncExternalStore, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Hook to manage Socket.IO connection
 * @returns Socket instance or null if not connected
 */
export const useSocket = (): Socket | null => {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      return;
    }

    const socketInstance = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true // 쿠키 전송을 위해 필수 (방장 인증용)
    });

    socketRef.current = socketInstance;

    // Notify all listeners when socket changes
    const notifyListeners = (): void => {
      listenersRef.current.forEach(listener => listener());
    };

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      notifyListeners();
    });

    socketInstance.on('disconnect', reason => {
      console.log('[Socket] Disconnected:', reason);
      notifyListeners();
    });

    socketInstance.on('connect_error', error => {
      console.error('[Socket] Connection error:', error);
    });

    // Initial notification
    notifyListeners();

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up connection');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  return useSyncExternalStore(
    callback => {
      listenersRef.current.add(callback);
      return () => {
        listenersRef.current.delete(callback);
      };
    },
    () => socketRef.current,
    () => null
  );
};
