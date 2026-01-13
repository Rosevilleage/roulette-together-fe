/**
 * LocalStorage를 사용하여 사용자가 생성한 방 정보를 관리합니다.
 */

const STORAGE_KEY = 'roulette_owned_rooms';
const VISITED_ROOMS_KEY = 'roulette_visited_rooms';

interface OwnedRoomInfo {
  roomId: string;
  createdAt: number;
}

export interface VisitedRoomInfo {
  roomId: string;
  roomName?: string;
  nickname: string;
  visitedAt: number;
}

/**
 * 사용자가 방을 생성했을 때 localStorage에 저장
 */
export function saveOwnedRoom(roomId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const ownedRooms = getOwnedRooms();
    ownedRooms[roomId] = {
      roomId,
      createdAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ownedRooms));
  } catch (error) {
    console.error('Failed to save owned room:', error);
  }
}

/**
 * 특정 roomId가 사용자가 생성한 방인지 확인
 */
export function isOwnedRoom(roomId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const ownedRooms = getOwnedRooms();
    return roomId in ownedRooms;
  } catch (error) {
    console.error('Failed to check owned room:', error);
    return false;
  }
}

/**
 * 모든 소유한 방 정보 가져오기
 */
function getOwnedRooms(): Record<string, OwnedRoomInfo> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get owned rooms:', error);
    return {};
  }
}

/**
 * 특정 방 정보 삭제
 */
export function removeOwnedRoom(roomId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const ownedRooms = getOwnedRooms();
    delete ownedRooms[roomId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ownedRooms));
  } catch (error) {
    console.error('Failed to remove owned room:', error);
  }
}

/**
 * 오래된 방 정보 정리 (7일 이상 지난 항목 삭제)
 */
export function cleanupOldRooms(): void {
  if (typeof window === 'undefined') return;

  try {
    const ownedRooms = getOwnedRooms();
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    let hasChanges = false;
    Object.keys(ownedRooms).forEach(roomId => {
      if (now - ownedRooms[roomId].createdAt > sevenDaysInMs) {
        delete ownedRooms[roomId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ownedRooms));
    }
  } catch (error) {
    console.error('Failed to cleanup old rooms:', error);
  }
}

// ============================================
// 참가 기록 (Visited Rooms) 관리
// ============================================

/**
 * 모든 방문 기록 가져오기
 */
function getVisitedRoomsMap(): Record<string, VisitedRoomInfo> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(VISITED_ROOMS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get visited rooms:', error);
    return {};
  }
}

/**
 * 참가자로서 방에 입장했을 때 방문 기록 저장
 */
export function saveVisitedRoom(roomId: string, nickname: string, roomName?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const visitedRooms = getVisitedRoomsMap();
    visitedRooms[roomId] = {
      roomId,
      roomName,
      nickname,
      visitedAt: Date.now()
    };
    localStorage.setItem(VISITED_ROOMS_KEY, JSON.stringify(visitedRooms));
  } catch (error) {
    console.error('Failed to save visited room:', error);
  }
}

/**
 * 특정 방의 방문 기록 가져오기
 */
export function getVisitedRoom(roomId: string): VisitedRoomInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const visitedRooms = getVisitedRoomsMap();
    return visitedRooms[roomId] || null;
  } catch (error) {
    console.error('Failed to get visited room:', error);
    return null;
  }
}

/**
 * 모든 방문 기록 목록 가져오기 (최신순 정렬)
 */
export function getVisitedRooms(): VisitedRoomInfo[] {
  if (typeof window === 'undefined') return [];

  try {
    const visitedRooms = getVisitedRoomsMap();
    return Object.values(visitedRooms).sort((a, b) => b.visitedAt - a.visitedAt);
  } catch (error) {
    console.error('Failed to get visited rooms:', error);
    return [];
  }
}

/**
 * 특정 방의 방문 기록 삭제
 */
export function removeVisitedRoom(roomId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const visitedRooms = getVisitedRoomsMap();
    delete visitedRooms[roomId];
    localStorage.setItem(VISITED_ROOMS_KEY, JSON.stringify(visitedRooms));
  } catch (error) {
    console.error('Failed to remove visited room:', error);
  }
}

/**
 * 오래된 방문 기록 정리 (7일 이상 지난 항목 삭제)
 */
export function cleanupOldVisitedRooms(): void {
  if (typeof window === 'undefined') return;

  try {
    const visitedRooms = getVisitedRoomsMap();
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    let hasChanges = false;
    Object.keys(visitedRooms).forEach(roomId => {
      if (now - visitedRooms[roomId].visitedAt > sevenDaysInMs) {
        delete visitedRooms[roomId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(VISITED_ROOMS_KEY, JSON.stringify(visitedRooms));
    }
  } catch (error) {
    console.error('Failed to cleanup old visited rooms:', error);
  }
}
