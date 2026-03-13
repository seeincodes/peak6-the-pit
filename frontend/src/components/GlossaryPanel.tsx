import { AnimatePresence, motion } from "framer-motion";
import { BookText, X } from "lucide-react";

const TERMS = [
  { term: "Implied Volatility (IV)", meaning: "The market's priced-in expectation of future movement." },
  { term: "Realized Volatility", meaning: "How much the underlying actually moved over a past window." },
  { term: "Skew", meaning: "Difference in IV across strikes, often reflecting asymmetric hedging demand." },
  { term: "Term Structure", meaning: "How implied volatility changes across expirations." },
  { term: "Delta", meaning: "Sensitivity of option price to underlying move." },
  { term: "Gamma", meaning: "How fast Delta changes as price moves." },
  { term: "Vega", meaning: "Sensitivity of option price to IV changes." },
  { term: "Theta", meaning: "Time decay of option value, all else equal." },
];

export default function GlossaryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="cm-modal-backdrop"
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="cm-surface-raised p-6 max-w-xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-label="Trading glossary"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="cm-subtitle flex items-center gap-2">
                <BookText size={18} className="text-cm-primary" />
                Trading Glossary
              </h2>
              <button onClick={onClose} className="cm-btn-ghost p-2" aria-label="Close glossary">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {TERMS.map((item) => (
                <div key={item.term} className="cm-surface p-3">
                  <p className="text-cm-text font-semibold text-sm">{item.term}</p>
                  <p className="text-cm-muted text-sm mt-1">{item.meaning}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
