// @ts-nocheck
export type ModalType = 'info' | 'warning' | 'error' | 'success';

export interface UIKitModalOptions {
  id: number;
  title: string;
  content: string;
  type: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface UIKitModalResult {
  action: 'confirm' | 'cancel';
  raw?: UniApp.ShowModalRes;
}
