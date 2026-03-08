import { motion, AnimatePresence } from "framer-motion";

interface LevelUpModalProps {
  show: boolean;
  level: number;
  title: string;
  newUnlocks: string[];
  onClose: () => void;
}

export default function LevelUpModal({ show, level, title, newUnlocks, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-cm-card border border-cm-cyan rounded-2xl p-8 text-center max-w-md shadow-neon-cyan"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-6xl mb-4"
            >
              ⬆
            </motion.div>
            <h2 className="text-3xl font-bold text-cm-cyan mb-2">LEVEL UP!</h2>
            <p className="text-cm-text text-xl mb-1">Level {level}</p>
            <p className="text-cm-amber font-semibold mb-6">{title}</p>

            {newUnlocks.length > 0 && (
              <div className="mb-6">
                <p className="text-cm-muted text-sm mb-2">New categories unlocked:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {newUnlocks.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-cm-cyan/15 border border-cm-cyan/40 text-cm-cyan"
                    >
                      {cat.replace(/_/g, " ").toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-8 py-2 rounded-lg bg-cm-cyan text-cm-bg font-bold hover:bg-cm-cyan/80 transition-all"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
