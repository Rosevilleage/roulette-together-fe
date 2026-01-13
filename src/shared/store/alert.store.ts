'use client';

import { create } from 'zustand';

type AlertType = 'alert' | 'confirm';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface AlertStore extends AlertState {
  showAlert: (title: string, description?: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
  closeAlert: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const useAlertStore = create<AlertStore>(set => ({
  isOpen: false,
  type: 'alert',
  title: '',
  description: '',
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: null,
  onCancel: null,
  showAlert: (title: string, description?: string) =>
    set({
      isOpen: true,
      type: 'alert',
      title,
      description: description || '',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: null,
      onCancel: null
    }),
  showConfirm: (options: ConfirmOptions) =>
    set({
      isOpen: true,
      type: 'confirm',
      title: options.title,
      description: options.description || '',
      confirmText: options.confirmText || '확인',
      cancelText: options.cancelText || '취소',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null
    }),
  closeAlert: () =>
    set({
      isOpen: false,
      type: 'alert',
      title: '',
      description: '',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: null,
      onCancel: null
    }),
  handleConfirm: () => {
    const { onConfirm } = useAlertStore.getState();
    if (onConfirm) {
      onConfirm();
    }
    useAlertStore.getState().closeAlert();
  },
  handleCancel: () => {
    const { onCancel } = useAlertStore.getState();
    if (onCancel) {
      onCancel();
    }
    useAlertStore.getState().closeAlert();
  }
}));

/**
 * 전역 alert 함수
 * React 컴포넌트 외부에서도 사용 가능
 */
export const showAlert = (title: string, description?: string): void => {
  useAlertStore.getState().showAlert(title, description);
};

/**
 * 전역 confirm 함수
 * React 컴포넌트 외부에서도 사용 가능
 */
export const showConfirm = (options: ConfirmOptions): void => {
  useAlertStore.getState().showConfirm(options);
};
