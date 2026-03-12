import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import XPToast from "../components/XPToast";

interface XPToastContextType {
  showXPToast: (amount: number) => void;
  sessionXP: number;
}

const XPToastContext = createContext<XPToastContextType>({
  showXPToast: () => {},
  sessionXP: 0,
});

export function useXPToast() {
  return useContext(XPToastContext);
}

interface ToastItem {
  id: number;
  amount: number;
  sessionTotal: number;
}

let nextId = 0;

export function XPToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sessionXP, setSessionXP] = useState(0);

  const showXPToast = useCallback((amount: number) => {
    setSessionXP((prev) => {
      const newTotal = prev + amount;
      const id = nextId++;
      setToasts((t) => [...t.slice(-2), { id, amount, sessionTotal: newTotal }]);
      return newTotal;
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  return (
    <XPToastContext.Provider value={{ showXPToast, sessionXP }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <XPToast
              key={toast.id}
              amount={toast.amount}
              sessionTotal={toast.sessionTotal}
              onDone={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </XPToastContext.Provider>
  );
}
