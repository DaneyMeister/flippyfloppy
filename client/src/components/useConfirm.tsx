import { useCallback, useState } from 'react';
import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog';

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
