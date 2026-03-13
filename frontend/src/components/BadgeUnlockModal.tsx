import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BADGE_ICONS, TIER_COLORS } from "../constants/badgeIcons";
import ConfettiEffect from "./ConfettiEffect";

interface Badge {
  name: string;
  description: string;
  icon: string;
  tier: string;
}

interface BadgeUnlockModalProps {
  show: boolean;
  badges: Badge[];
  onClose: () => void;
}

export default function BadgeUnlockModal({ show, badges, onClose }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (badges.length === 0) return null;

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
          aria-labelledby="badge-title"
          onClick={onClose}
        >
          <ConfettiEffect count={25} />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-cm-card border border-cm-amber rounded-md p-8 text-center max-w-md relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="badge-title" className="text-2xl font-bold text-cm-amber mb-4">
              Badge{badges.length > 1 ? "s" : ""} Earned!
            </h2>

            <div className="space-y-4 mb-6">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-md border border-cm-border/50 bg-cm-bg/50"
                >
                  <span
                    className="text-3xl"
                    style={{ filter: `drop-shadow(0 0 6px ${TIER_COLORS[badge.tier] || "#C0C0C0"})` }}
                  >
                    {BADGE_ICONS[badge.icon] || "🏅"}
                  </span>
                  <div className="text-left">
                    <p className="text-cm-text font-semibold text-sm">{badge.name}</p>
                    <p className="text-cm-muted text-xs">{badge.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              autoFocus
              onClick={onClose}
              className="cm-btn-primary-lg"
            >
              Nice!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
