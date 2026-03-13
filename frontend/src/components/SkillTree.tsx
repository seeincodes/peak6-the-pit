import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { categoryColors, categoryDisplay } from "../theme/colors";

interface SkillTreeProps {
  allCategories: string[];
  unlockedCategories: { category: string; difficulty: string }[];
  level: number;
}

// Tree structure: root -> branches -> leaves. Order matches unlock progression (levels 1-7+).
const TREE_LAYERS: string[][] = [
  // Level 1
  ["iv_analysis", "realized_vol"],
  // Level 2-3
  ["greeks", "order_flow", "fundamentals", "technical_analysis", "sentiment"],
  // Level 4-5
  ["macro", "term_structure", "fixed_income", "seasonality", "skew", "correlation", "event_vol", "tail_risk", "commodities", "geopolitical"],
  // Level 6
  ["position_sizing", "trade_structuring", "crypto", "alt_data"],
  // Level 7
  ["vol_surface", "microstructure", "risk_management", "capman_tooling", "exotic_structures", "portfolio_mgmt"],
];

// Parent indices for each layer (parent row, parent col in that row)
const PARENT_LINKS: { layer: number; parentCol: number }[][] = [
  [],
  // Layer 1 → Layer 0
  [
    { layer: 0, parentCol: 0 }, { layer: 0, parentCol: 0 },
    { layer: 0, parentCol: 1 }, { layer: 0, parentCol: 1 }, { layer: 0, parentCol: 1 },
  ],
  // Layer 2 → Layer 1
  [
    { layer: 1, parentCol: 0 }, { layer: 1, parentCol: 0 }, { layer: 1, parentCol: 2 }, { layer: 1, parentCol: 4 },
    { layer: 1, parentCol: 0 }, { layer: 1, parentCol: 1 }, { layer: 1, parentCol: 1 }, { layer: 1, parentCol: 1 },
    { layer: 1, parentCol: 3 }, { layer: 1, parentCol: 4 },
  ],
  // Layer 3 → Layer 2
  [
    { layer: 2, parentCol: 0 }, { layer: 2, parentCol: 4 },
    { layer: 2, parentCol: 9 }, { layer: 2, parentCol: 3 },
  ],
  // Layer 4 → Layer 3
  [
    { layer: 3, parentCol: 0 }, { layer: 3, parentCol: 0 },
    { layer: 3, parentCol: 1 }, { layer: 3, parentCol: 1 },
    { layer: 3, parentCol: 1 }, { layer: 3, parentCol: 0 },
  ],
];

const NODE_SIZE = 80;
const LAYER_GAP = 48;
const NODE_GAP = 12;

// Short display labels for skill tree nodes
const DISPLAY_LABELS: Record<string, string> = {
  iv_analysis: "IV\nANALYSIS",
  realized_vol: "REALIZED\nVOL",
  greeks: "GREEKS",
  order_flow: "ORDER\nFLOW",
  macro: "MACRO",
  term_structure: "TERM\nSTRUCT",
  skew: "SKEW",
  correlation: "CORREL",
  event_vol: "EVENT\nVOL",
  tail_risk: "TAIL\nRISK",
  position_sizing: "POS\nSIZING",
  trade_structuring: "TRADE\nSTRUCT",
  vol_surface: "VOL\nSURFACE",
  microstructure: "MICRO\nSTRUCT",
  risk_management: "RISK\nMGMT",
  capman_tooling: "CM\nTOOLING",
  sentiment: "SENTI\nMENT",
  technical_analysis: "TECH\nANALYSIS",
  fixed_income: "FIXED\nINCOME",
  seasonality: "SEASON\nALITY",
  exotic_structures: "EXOTIC\nSTRUCT",
  fundamentals: "FUNDA\nMENTALS",
  commodities: "COMMO\nDITIES",
  crypto: "CRYPTO",
  geopolitical: "GEO\nPOLITICAL",
  alt_data: "ALT\nDATA",
  portfolio_mgmt: "PORT\nFOLIO",
};

// Level at which each category first unlocks (beginner difficulty)
const UNLOCK_LEVELS: Record<string, number> = {
  iv_analysis: 1, realized_vol: 1,
  greeks: 2, fundamentals: 2,
  order_flow: 3, technical_analysis: 3, sentiment: 3,
  macro: 4, term_structure: 4, fixed_income: 4, seasonality: 4,
  skew: 5, correlation: 5, event_vol: 5, tail_risk: 5, commodities: 5, geopolitical: 5,
  position_sizing: 6, trade_structuring: 6, crypto: 6, alt_data: 6,
  vol_surface: 7, microstructure: 7, risk_management: 7, capman_tooling: 7, exotic_structures: 7, portfolio_mgmt: 7,
};

const LAYER_LABELS = ["Foundation", "Core", "Specialization", "Advanced", "Expert"];

function getUnlockLevel(cat: string): number {
  return UNLOCK_LEVELS[cat] ?? 1;
}

function getLayerLabel(cat: string): string {
  const layerIdx = TREE_LAYERS.findIndex((layer) => layer.includes(cat));
  return LAYER_LABELS[layerIdx] ?? "";
}

export default function SkillTree({ allCategories, unlockedCategories, level }: SkillTreeProps) {
  const unlockedSet = new Set(unlockedCategories.map((c) => c.category));

  const displayLayers = TREE_LAYERS.map((layer) =>
    layer.filter((c) => allCategories.includes(c))
  ).filter((l) => l.length > 0);

  const maxLayerWidth = Math.max(...displayLayers.map((l) => l.length), 1);
  const contentWidth = maxLayerWidth * NODE_SIZE + (maxLayerWidth - 1) * NODE_GAP;
  const contentHeight = displayLayers.length * (NODE_SIZE + LAYER_GAP) - LAYER_GAP;

  const nodePositions: { cat: string; x: number; y: number; layer: number; col: number }[] = [];
  displayLayers.forEach((layer, li) => {
    const layerWidth = layer.length * NODE_SIZE + (layer.length - 1) * NODE_GAP;
    const offsetX = (contentWidth - layerWidth) / 2;
    layer.forEach((cat, ci) => {
      const x = offsetX + ci * (NODE_SIZE + NODE_GAP);
      const y = li * (NODE_SIZE + LAYER_GAP);
      nodePositions.push({ cat, x, y, layer: li, col: ci });
    });
  });

  // Tap-to-expand popover state
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const difficultyMap = new Map(unlockedCategories.map((c) => [c.category, c.difficulty]));

  const handleNodeTap = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeNode === cat) {
      setActiveNode(null);
      setPopoverRect(null);
    } else {
      setActiveNode(cat);
      setPopoverRect((e.currentTarget as HTMLElement).getBoundingClientRect());
    }
  };

  const dismissPopover = () => {
    setActiveNode(null);
    setPopoverRect(null);
  };

  // Dismiss popover on outside tap or scroll — no blocking backdrop
  useEffect(() => {
    if (!activeNode) return;
    const onTouchOrClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-skill-popover]")) return;
      dismissPopover();
    };
    const onScroll = () => dismissPopover();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPopover();
    };
    document.addEventListener("pointerdown", onTouchOrClick, true);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onTouchOrClick, true);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeNode]);

  // Auto-scale to fit available width on smaller screens
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      // Account for padding (p-6=24 on mobile, p-8=32 on sm+)
      const padding = available > 640 ? 64 : 48;
      const needed = contentWidth + padding;
      setScale(Math.min(1, (available) / needed));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentWidth]);

  const scaledHeight = contentHeight * scale;
  const scaledPadY = scale < 1 ? 24 * scale : 0;

  return (
    <>
      <h3 className="sr-only">
        Skill tree: {unlockedCategories.length} of {allCategories.length} categories unlocked
      </h3>
      <div
        ref={wrapperRef}
        className="relative rounded-2xl w-full"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 0%, rgb(var(--cm-primary) / 0.12) 0%, transparent 60%)",
          height: scaledHeight + scaledPadY * 2 + 48,
        }}
      >
        {/* Scaled content — shrinks to fit on mobile */}
        <div
          className="absolute left-1/2 p-6 sm:p-8"
          style={{
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
        {/* Inner content area — SVG and nodes share this coordinate space */}
        <div className="relative" style={{ width: contentWidth, height: contentHeight }}>
          {/* SVG connecting lines — drawn first so they appear behind nodes */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={contentWidth}
            height={contentHeight}
            style={{ overflow: "visible" }}
          >
            {displayLayers.map((layer, layerIdx) =>
              layer.map((_cat, colIdx) => {
                const link = PARENT_LINKS[layerIdx]?.[colIdx];
                if (!link) return null;

                const childPos = nodePositions.find(
                  (n) => n.layer === layerIdx && n.col === colIdx
                );
                const parentPos = nodePositions.find(
                  (n) => n.layer === link.layer && n.col === link.parentCol
                );
                if (!childPos || !parentPos) return null;

                const isPathUnlocked = unlockedSet.has(parentPos.cat) || unlockedSet.has(childPos.cat);
                const parentColor = categoryColors[parentPos.cat] || "rgb(var(--cm-primary))";
                const parentCx = parentPos.x + NODE_SIZE / 2;
                const parentBottom = parentPos.y + NODE_SIZE;
                const childCx = childPos.x + NODE_SIZE / 2;
                const childTop = childPos.y;
                const midY = (parentBottom + childTop) / 2;

                return (
                  <path
                    key={`${layerIdx}-${colIdx}`}
                    d={`M ${parentCx} ${parentBottom} C ${parentCx} ${midY}, ${childCx} ${midY}, ${childCx} ${childTop}`}
                    fill="none"
                    stroke={isPathUnlocked ? `${parentColor}50` : "rgb(var(--cm-border) / 0.35)"}
                    strokeWidth={isPathUnlocked ? 2 : 1}
                    strokeDasharray={isPathUnlocked ? "none" : "4 4"}
                  />
                );
              })
            )}
          </svg>

          {/* Nodes */}
          {nodePositions.map(({ cat, x, y }, i) => {
            const isUnlocked = unlockedSet.has(cat);
            const color = categoryColors[cat] || "rgb(var(--cm-primary))";

            return (
              <motion.div
                key={cat}
                role="button"
                tabIndex={0}
                aria-label={`${cat.replace(/_/g, " ")} - ${isUnlocked ? "Unlocked" : "Locked"}`}
                onClick={(e) => handleNodeTap(cat, e)}
                className={`absolute flex items-center justify-center cursor-pointer select-none ${activeNode === cat ? "ring-2 ring-cm-primary/60 ring-offset-1 ring-offset-transparent" : ""}`}
                style={{
                  left: x,
                  top: y,
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: "14px",
                  opacity: isUnlocked ? 1 : 0.55,
                  background: isUnlocked
                    ? `linear-gradient(135deg, ${color}35 0%, ${color}15 100%)`
                    : "linear-gradient(135deg, rgb(var(--cm-card-raised)) 0%, rgb(var(--cm-card)) 100%)",
                  border: `2px solid ${isUnlocked ? `${color}99` : "rgb(var(--cm-border))"}`,
                  boxShadow: isUnlocked
                    ? `0 0 16px ${color}40, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: isUnlocked ? 1 : 0.55 }}
                whileHover={{
                  scale: isUnlocked ? 1.08 : 1.04,
                  ...(isUnlocked
                    ? {
                        boxShadow: `0 0 24px ${color}60, 0 0 8px ${color}40, inset 0 1px 0 rgba(255,255,255,0.12)`,
                      }
                    : {}),
                }}
                transition={{
                  delay: i * 0.03,
                  type: "spring",
                  stiffness: 300,
                  damping: 22,
                }}
              >
                <div className="flex flex-col items-center justify-center gap-0.5 px-1 overflow-hidden">
                  {isUnlocked ? (
                    <Check size={16} style={{ color }} aria-hidden="true" strokeWidth={2.5} />
                  ) : (
                    <Lock size={14} className="text-cm-muted/60" aria-hidden="true" strokeWidth={2} />
                  )}
                  <span
                    className="text-[10px] font-semibold text-center leading-[1.2] whitespace-pre-line max-w-full tracking-wide"
                    style={{ color: isUnlocked ? color : "rgb(var(--cm-muted))" }}
                    title={categoryDisplay[cat] || cat.replace(/_/g, " ")}
                  >
                    {DISPLAY_LABELS[cat] || cat.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Tap-to-expand popover (portaled to body for correct z-index) */}
      {createPortal(
        <AnimatePresence>
          {activeNode && popoverRect && (
              <motion.div
                data-skill-popover
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] cm-popover pointer-events-auto px-4 py-3.5"
                style={{
                  left: Math.max(12, Math.min(
                    popoverRect.left + popoverRect.width / 2 - 120,
                    window.innerWidth - 252
                  )),
                  ...(popoverRect.top > window.innerHeight / 2
                    ? { bottom: window.innerHeight - popoverRect.top + 8 }
                    : { top: popoverRect.bottom + 8 }),
                  width: 240,
                }}
              >
                {/* Arrow nub */}
                <div
                  className="absolute w-2.5 h-2.5 bg-cm-card border-cm-border rotate-45"
                  style={{
                    left: Math.max(16, Math.min(
                      popoverRect.left + popoverRect.width / 2 - Math.max(12, Math.min(popoverRect.left + popoverRect.width / 2 - 120, window.innerWidth - 252)) - 4,
                      216
                    )),
                    ...(popoverRect.top > window.innerHeight / 2
                      ? { bottom: -5, borderBottom: "1px solid", borderRight: "1px solid" }
                      : { top: -5, borderTop: "1px solid", borderLeft: "1px solid" }),
                  }}
                />

                {/* Category name */}
                <div className="text-sm font-bold text-cm-text leading-snug">
                  {categoryDisplay[activeNode] || activeNode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>

                {/* Accent bar */}
                <div
                  className="h-0.5 rounded-full mt-2 mb-2.5 opacity-60"
                  style={{ background: categoryColors[activeNode] || "rgb(var(--cm-primary))" }}
                />

                {/* Status row */}
                <div className="flex items-center gap-2">
                  {unlockedSet.has(activeNode) ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-cm-emerald/15 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-cm-emerald" />
                      </div>
                      <div className="text-xs">
                        <span className="text-cm-emerald font-semibold">Unlocked</span>
                        {difficultyMap.has(activeNode) && (
                          <span className="text-cm-muted ml-1.5 capitalize">
                            &middot; {difficultyMap.get(activeNode)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-cm-muted/10 flex items-center justify-center shrink-0">
                        <Lock size={12} className="text-cm-muted" />
                      </div>
                      <div className="text-xs">
                        <span className="text-cm-muted font-medium">Locked</span>
                        <span className="text-cm-primary ml-1.5">
                          &middot; Level {getUnlockLevel(activeNode)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Tier label */}
                <div className="text-[11px] text-cm-muted/70 mt-2">
                  {getLayerLabel(activeNode)} tier
                  {!unlockedSet.has(activeNode) && getUnlockLevel(activeNode) > level && (
                    <span className="text-cm-primary/80 ml-1">
                      &middot; {getUnlockLevel(activeNode) - level} level{getUnlockLevel(activeNode) - level > 1 ? "s" : ""} away
                    </span>
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
