import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly messagesSignal = signal<ToastMessage[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  show(text: string, kind: ToastKind = 'info'): void {
    const id = ++this.seq;
    const safeText =
      typeof text === 'string'
        ? text
        : text == null
          ? 'Unexpected error'
          : (() => {
              try {
                return JSON.stringify(text);
              } catch {
                return 'Unexpected error';
              }
            })();
    this.messagesSignal.update((list) => [...list, { id, kind, text: safeText }]);
    setTimeout(() => this.dismiss(id), 6000);
  }

  dismiss(id: number): void {
    this.messagesSignal.update((list) => list.filter((m) => m.id !== id));
  }
}
