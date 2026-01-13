'use client';

import { ReactElement } from 'react';
import { useAlertStore } from '@/shared/store/alert.store';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/shared/ui/alert-dialog';

export function GlobalAlertDialog(): ReactElement {
  const { isOpen, type, title, description, confirmText, cancelText, closeAlert, handleConfirm, handleCancel } =
    useAlertStore();

  const isConfirm = type === 'confirm';

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && (isConfirm ? handleCancel() : closeAlert())}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isConfirm ? (
            <>
              <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>{confirmText}</AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={closeAlert}>{confirmText}</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
