import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle } from "lucide-react";

interface LevelUpModalProps {
  show: boolean;
  level: number;
  title: string;
  newUnlocks: string[];
  onClose: () => void;
}

export default function LevelUpModal({ show, level, title, newUnlocks, onClose }: LevelUpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="cm-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-title"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            ref={modalRef}
            className="bg-cm-card border border-cm-primary rounded-md p-8 text-center max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-4 flex justify-center"
            >
              <ArrowUpCircle size={48} className="text-cm-lime" aria-hidden="true" />
            </motion.div>
            <h2 id="levelup-title" className="text-3xl font-bold text-cm-lime mb-2">LEVEL UP!</h2>
            <p className="text-cm-text text-xl mb-1">Level {level}</p>
            <p className="text-cm-amber font-semibold mb-6">{title}</p>

            {newUnlocks.length > 0 && (
              <div className="mb-6">
                <p className="text-cm-muted text-sm mb-2">New categories unlocked:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {newUnlocks.map((cat) => (
                    <span
                      key={cat}
                      className="cm-chip-primary"
                    >
                      {cat.replace(/_/g, " ").toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              autoFocus
              onClick={onClose}
              className="cm-btn-primary-lg px-8 py-2"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
