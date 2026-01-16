import { useEffect, useSyncExternalStore } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Global socket instance - shared across all components (client-side only)
let globalSocket: Socket | null = null;
const listeners: Set<() => void> = new Set();

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

    // 연결 상태 변경 시 모든 구독자에게 알림
    globalSocket.on('connect', () => {
      console.log('[Socket] Connected:', globalSocket?.id);
      listeners.forEach(listener => listener());
    });

    globalSocket.on('disconnect', reason => {
      console.log('[Socket] Disconnected:', reason);
      listeners.forEach(listener => listener());
    });

    globalSocket.on('connect_error', error => {
      console.error('[Socket] Connection error:', error);
      console.error('[Socket] WS_URL:', WS_URL);
    });
  }

  // Always ensure socket is connected
  if (!globalSocket.connected) {
    console.log('[Socket] Connecting to server...');
    globalSocket.connect();
  }

  return globalSocket;
}

// useSyncExternalStore를 위한 함수들
function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Socket | null {
  // 클라이언트에서 소켓이 없으면 생성
  if (typeof window !== 'undefined' && !globalSocket) {
    getOrCreateSocket();
  }
  return globalSocket;
}

function getServerSnapshot(): Socket | null {
  // 서버에서는 항상 null 반환
  return null;
}

/**
 * Hook to manage Socket.IO connection
 * Hydration-safe: uses useSyncExternalStore for consistent SSR/CSR behavior
 * @returns Socket instance or null if not connected
 */
export const useSocket = (): Socket | null => {
  const socket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 컴포넌트 마운트 시 소켓 연결 보장
  useEffect(() => {
    if (typeof window !== 'undefined' && !globalSocket) {
      getOrCreateSocket();
    }
  }, []);

  return socket;
};
