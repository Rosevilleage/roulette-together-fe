'use client';

import { create } from 'zustand';

interface AlertState {
  isOpen: boolean;
  title: string;
  description: string;
}

interface AlertStore extends AlertState {
  showAlert: (title: string, description?: string) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertStore>(set => ({
  isOpen: false,
  title: '',
  description: '',
  showAlert: (title: string, description?: string) =>
    set({
      isOpen: true,
      title,
      description: description || ''
    }),
  closeAlert: () =>
    set({
      isOpen: false,
      title: '',
      description: ''
    })
}));

/**
 * 전역 alert 함수
 * React 컴포넌트 외부에서도 사용 가능
 */
export const showAlert = (title: string, description?: string): void => {
  useAlertStore.getState().showAlert(title, description);
};
