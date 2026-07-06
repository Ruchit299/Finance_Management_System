import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogOptions {
  title?: string;
  message: string;
  isConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private dialogState = new Subject<DialogOptions | null>();
  public dialogState$ = this.dialogState.asObservable();
  
  private currentResolver: ((value: boolean) => void) | null = null;

  constructor() { }

  public confirm(message: string, title: string = 'Confirmation', confirmText: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentResolver = resolve;
      this.dialogState.next({
        message,
        title,
        isConfirm: true,
        confirmText,
        cancelText: 'Cancel'
      });
    });
  }

  public alert(message: string, title: string = 'Alert', confirmText: string = 'OK'): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentResolver = resolve;
      this.dialogState.next({
        message,
        title,
        isConfirm: false,
        confirmText
      });
    });
  }

  public close(result: boolean): void {
    if (this.currentResolver) {
      this.currentResolver(result);
      this.currentResolver = null;
    }
    this.dialogState.next(null);
  }
}
