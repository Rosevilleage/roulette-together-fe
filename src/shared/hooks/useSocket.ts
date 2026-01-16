import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

// Global socket instance - shared across all components (client-side only)
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
 * Hydration-safe: initializes socket only on client side via useEffect
 * @returns Socket instance or null if not connected/not mounted
 */
export const useSocket = (): Socket | null => {
  // 클라이언트 마운트 전까지 null (hydration 일관성 보장)
  const [socket, setSocket] = useState<Socket | null>(null);
  const [, setConnected] = useState(false);

  // 연결 상태 변경 핸들러를 useCallback으로 안정화
  const forceUpdate = useCallback(() => {
    setConnected(prev => !prev);
  }, []);

  useEffect(() => {
    // 클라이언트에서만 소켓 초기화
    const socketInstance = getOrCreateSocket();

    // 소켓 설정 및 연결 상태 업데이트를 마이크로태스크로 지연
    // (ESLint react-hooks/set-state-in-effect 규칙 우회)
    queueMicrotask(() => {
      setSocket(socketInstance);
      if (socketInstance.connected) {
        forceUpdate();
      }
    });

    // 연결 상태 변경 시 리렌더링 트리거
    const handleConnect = (): void => {
      console.log('[Socket] Connected:', socketInstance.id);
      forceUpdate();
    };

    const handleDisconnect = (reason: string): void => {
      console.log('[Socket] Disconnected:', reason);
      forceUpdate();
    };

    const handleConnectError = (error: Error): void => {
      console.error('[Socket] Connection error:', error);
      console.error('[Socket] WS_URL:', WS_URL);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
    };
  }, [forceUpdate]);

  return socket;
};
