import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './ToastModal.css';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let _toastId = 0;

/**
 * Provider — wrap your app root with this so any component can call showToast().
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /** @param {string} message  @param {'success'|'error'|'info'|'warning'} type */
  const showToast = useCallback((message, type = 'info') => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 4.5 s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

/** Hook — use inside any component */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.showToast;
};

// ─── Internal Container + Item ────────────────────────────────────────────────
const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <span className="toast__icon">
        <Icon size={18} />
      </span>
      <p className="toast__message">{toast.message}</p>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
      <div className="toast__progress" />
    </div>
  );
};
