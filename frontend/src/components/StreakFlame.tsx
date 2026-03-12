import { motion } from "framer-motion";

interface StreakFlameProps {
  days: number;
  size?: "sm" | "md" | "lg";
}

function getFlameConfig(days: number) {
  if (days >= 30) return { emoji: "🔥", intensity: 4, color: "text-yellow-400" };
  if (days >= 14) return { emoji: "🔥", intensity: 3, color: "text-cm-amber" };
  if (days >= 7) return { emoji: "🔥", intensity: 2, color: "text-cm-amber" };
  if (days >= 3) return { emoji: "🔥", intensity: 1, color: "text-cm-amber" };
  return { emoji: "🔥", intensity: 0, color: "text-cm-amber/70" };
}

const sizeMap = { sm: 14, md: 18, lg: 24 };
const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export default function StreakFlame({ days, size = "md" }: StreakFlameProps) {
  if (days <= 0) return null;

  const { intensity, color } = getFlameConfig(days);
  const px = sizeMap[size];

  return (
    <motion.span
      className={`inline-flex items-center gap-1 ${color} ${textSize[size]} font-medium`}
      animate={
        intensity >= 2
          ? { scale: [1, 1.1, 1] }
          : {}
      }
      transition={
        intensity >= 2
          ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
    >
      <motion.span
        style={{ fontSize: px, lineHeight: 1 }}
        animate={
          intensity >= 3
            ? { rotate: [-3, 3, -3], y: [-1, 1, -1] }
            : {}
        }
        transition={
          intensity >= 3
            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
      >
        🔥
      </motion.span>
      <span>{days}d</span>
      {intensity >= 4 && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-[8px]"
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -12 - i * 4],
                x: [(i - 1) * 6, (i - 1) * 8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
              style={{ pointerEvents: "none" }}
            >
              ✨
            </motion.span>
          ))}
        </>
      )}
    </motion.span>
  );
}
