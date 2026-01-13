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
  AlertDialogAction
} from '@/shared/ui/alert-dialog';

export function GlobalAlertDialog(): ReactElement {
  const { isOpen, title, description, closeAlert } = useAlertStore();

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && closeAlert()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={closeAlert}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
