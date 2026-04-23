import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const TOAST_TIMEOUT_MS = 3000;
const MAX_TOASTS = 3;

function getToastMeta(type) {
  if (type === "error") {
    return {
      Icon: XCircle,
      className: "toast error",
    };
  }

  return {
    Icon: CheckCircle2,
    className: "toast success",
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextToastId = useRef(1);

  function removeToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(message, type = "success") {
    const id = nextToastId.current;
    nextToastId.current += 1;

    setToasts((current) => {
      const nextToast = {
        id,
        message,
        type,
      };

      return [...current.slice(-(MAX_TOASTS - 1)), nextToast];
    });

    window.setTimeout(() => {
      removeToast(id);
    }, TOAST_TIMEOUT_MS);
  }

  const value = useMemo(
    () => ({
      showToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const { Icon, className } = getToastMeta(toast.type);

          return (
            <div key={toast.id} className={className} role="status">
              <Icon size={18} />
              <span className="toast-message">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
