import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BADGE_ICONS, TIER_COLORS } from "../constants/badgeIcons";

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned: boolean;
  awardedAt: string | null;
}

const TOOLTIP_WIDTH = 192;
const TOOLTIP_PADDING = 12;

export default function BadgeCard({ name, description, icon, tier, earned, awardedAt }: BadgeCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateTooltipPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const centerX = rect.left + rect.width / 2;
    const halfW = TOOLTIP_WIDTH / 2;

    let left = Math.max(TOOLTIP_PADDING, centerX - halfW);
    left = Math.min(vw - TOOLTIP_WIDTH - TOOLTIP_PADDING, left);

    // Show tooltip below if badge is near top of screen, above if near bottom
    const showBelow = rect.top < vh / 2;
    const gap = 8;

    let top: number | undefined;
    let bottom: number | undefined;

    if (showBelow) {
      top = Math.min(rect.bottom + gap, vh - 80);
    } else {
      bottom = Math.max(vh - rect.top + gap, 8);
    }

    setTooltipStyle({
      position: "fixed",
      left,
      ...(top !== undefined ? { top } : { bottom }),
      width: TOOLTIP_WIDTH,
      zIndex: 9999,
    });
  }, []);

  const handleEnter = () => {
    setShowTooltip(true);
    requestAnimationFrame(updateTooltipPosition);
  };

  const emoji = BADGE_ICONS[icon] || "🏷️";
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={handleEnter}
        onBlur={() => setShowTooltip(false)}
        className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all focus-ring ${
          earned
            ? "bg-cm-card-raised border-2"
            : "bg-cm-card border border-cm-border opacity-40 grayscale"
        }`}
        style={earned ? { borderColor: tierColor, boxShadow: `0 0 12px ${tierColor}30` } : {}}
        whileHover={{ scale: earned ? 1.1 : 1.02 }}
        aria-label={`${name}: ${description}${earned ? " (Earned)" : " (Locked)"}`}
      >
        {earned ? emoji : <Lock size={18} className="text-cm-muted" />}
      </motion.button>

      {showTooltip &&
        createPortal(
          <div
            className="cm-tooltip"
            style={tooltipStyle}
          >
            <div className="text-xs font-semibold text-cm-text">{name}</div>
            <div className="text-[11px] text-cm-muted mt-0.5">{description}</div>
            {earned && awardedAt && (
              <div className="text-[10px] text-cm-primary mt-1">
                Earned {new Date(awardedAt).toLocaleDateString()}
              </div>
            )}
            {!earned && (
              <div className="text-[10px] text-cm-amber mt-1">Not yet earned</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
