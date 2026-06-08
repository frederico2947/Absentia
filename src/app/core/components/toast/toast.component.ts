import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium max-w-sm animate-in slide-in-from-right-4"
          [class]="toastClass(toast.type)"
        >
          <svg class="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @if (toast.type === 'success') {
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            } @else if (toast.type === 'error') {
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/>
            } @else {
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
            }
          </svg>
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  toastClass(type: 'success' | 'error' | 'info'): string {
    const map = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      info: 'bg-slate-800 text-white',
    };
    return map[type];
  }
}
