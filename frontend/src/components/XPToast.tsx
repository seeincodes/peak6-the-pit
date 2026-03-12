import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPToastProps {
  amount: number;
  sessionTotal: number;
  onDone: () => void;
}

export default function XPToast({ amount, sessionTotal, onDone }: XPToastProps) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onAnimationComplete={(def) => {
        if (typeof def === "object" && "x" in def) return;
      }}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border border-cm-primary/30 bg-cm-card shadow-lg shadow-cm-primary/10"
    >
      <Zap size={16} className="text-cm-lime shrink-0" />
      <div>
        <div className="text-cm-lime font-bold text-sm">+{amount} XP</div>
        <div className="text-cm-muted text-[11px]">Session: {sessionTotal} XP</div>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-cm-primary/40 rounded-full"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 3, ease: "linear" }}
        onAnimationComplete={() => onDone()}
      />
    </motion.div>
  );
}
