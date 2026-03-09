import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { categoryColors } from "../theme/colors";

interface SkillTreeProps {
  allCategories: string[];
  unlockedCategories: { category: string; difficulty: string }[];
  level: number;
}

const HEX_SIZE = 52;
const HEX_GAP = 8;

const HEX_POSITIONS: [number, number][] = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
  [0.5, 1], [1.5, 1], [2.5, 1], [3.5, 1],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
  [2, 3],
];

export default function SkillTree({ allCategories, unlockedCategories, level: _level }: SkillTreeProps) {
  const unlockedSet = new Set(
    unlockedCategories.map((c) => c.category)
  );

  return (
    <>
      <h3 className="sr-only">Skill tree: {unlockedCategories.length} of {allCategories.length} categories unlocked</h3>
      <div className="relative" style={{ width: 5 * (HEX_SIZE + HEX_GAP), height: 4 * (HEX_SIZE + HEX_GAP) + HEX_SIZE }}>
        {allCategories.map((cat, i) => {
        const pos = HEX_POSITIONS[i] || [0, 0];
        const isUnlocked = unlockedSet.has(cat);
        const color = categoryColors[cat] || "#4D34EF";
        const x = pos[0] * (HEX_SIZE + HEX_GAP);
        const y = pos[1] * (HEX_SIZE + HEX_GAP);

        return (
          <motion.div
            key={cat}
            role="img"
            aria-label={`${cat.replace(/_/g, " ")} - ${isUnlocked ? "Unlocked" : "Locked"}`}
            className="absolute flex items-center justify-center cursor-default"
            style={{
              left: x,
              top: y,
              width: HEX_SIZE,
              height: HEX_SIZE,
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              backgroundColor: isUnlocked ? `${color}30` : "#16163a",
              border: `2px solid ${isUnlocked ? color : "#2e2e5a"}`,
            }}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              boxShadow: isUnlocked ? `0 0 12px ${color}50` : "none",
            }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex flex-col items-center justify-center">
              {isUnlocked ? (
                <Check size={10} style={{ color }} aria-hidden="true" />
              ) : (
                <Lock size={10} className="text-cm-muted" aria-hidden="true" />
              )}
              <span
                className="text-[8px] font-bold text-center leading-tight px-1"
                style={{ color: isUnlocked ? color : "#A0A0C0" }}
              >
                {cat.replace(/_/g, "\n").toUpperCase()}
              </span>
            </div>
          </motion.div>
        );
      })}
      </div>
    </>
  );
}
