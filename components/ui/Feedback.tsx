import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';

type ToastTone = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'blue';
}

interface FeedbackApi {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

/** In-app replacements for window.alert / window.confirm. */
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastState, setToastState] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    window.clearTimeout(timer.current);
    setToastState({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToastState(null), 3200);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>(resolve => setConfirmState({ ...options, resolve })),
    []
  );

  const settle = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {toastState && (
        <div key={toastState.id} className={`toast ${toastState.tone}`} role="status" aria-live="polite">
          <span className="toast-dot" />
          {toastState.message}
        </div>
      )}

      {confirmState && (
        <Modal
          onClose={() => settle(false)}
          title={confirmState.title}
          description={confirmState.message}
          icon={confirmState.tone === 'blue' ? 'check' : 'alert'}
          tone={confirmState.tone ?? 'danger'}
        >
          <div className="modal-actions">
            <button onClick={() => settle(false)} className="btn btn-ghost">Cancel</button>
            <button
              onClick={() => settle(true)}
              className={`btn ${confirmState.tone === 'blue' ? 'btn-primary' : 'btn-danger'}`}
              autoFocus
            >
              {confirmState.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
};
