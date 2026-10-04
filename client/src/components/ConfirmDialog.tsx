import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { secondaryButtonClass } from './FormField';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Small "are you sure?" window for destructive actions, in place of the
 * browser's confirm(). Focus starts on the safe (cancel) button; Escape or a
 * click outside cancels.
 */
function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onClose }: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    // Capture phase + stopImmediatePropagation, so Escape closes only this
    // dialog and not a modal it was opened from (e.g. Edit Group).
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose(false);
      } else if (e.key === 'Tab') {
        // Keep focus on the two buttons while the dialog is open.
        e.preventDefault();
        (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus();
      }
    }
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      previousFocus?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/60 backdrop-blur-sm" onClick={() => onClose(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-sm animate-modal-in rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id={titleId} className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div id={messageId} className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={() => onClose(false)} className={secondaryButtonClass}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-red-300"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Promise-based replacement for window.confirm(). Render `dialog` somewhere
 * in the component, then `if (!(await confirm({...}))) return;`.
 */
export function useConfirm() {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    []
  );

  const handleClose = useCallback(
    (ok: boolean) => {
      request?.resolve(ok);
      setRequest(null);
    },
    [request]
  );

  const dialog = request ? <ConfirmDialog {...request} onClose={handleClose} /> : null;
  return [confirm, dialog] as const;
}
