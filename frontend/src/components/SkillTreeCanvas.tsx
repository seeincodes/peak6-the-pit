import { useRef, useState, useCallback, useEffect } from "react";

interface SkillNode {
  id: string;
  category: string;
  display_name: string;
  description: string;
  tier: number;
  prerequisites: string[];
  position_x: number;
  position_y: number;
}

interface MasteryData {
  category: string;
  mastery_level: number;
  peak_mastery: number;
  scenarios_completed: number;
}

interface SkillTreeCanvasProps {
  nodes: SkillNode[];
  mastery: MasteryData[];
  onNodeClick: (node: SkillNode) => void;
}

const TIER_COLORS = ["#94a3b8", "#38bdf8", "#a78bfa", "#fbbf24"];
const NODE_RADIUS = 32;

function getArcPath(cx: number, cy: number, r: number, pct: number): string {
  if (pct <= 0) return "";
  if (pct >= 1) {
    // Full circle — use two arcs
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  }
  const angle = pct * 2 * Math.PI - Math.PI / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
}

export default function SkillTreeCanvas({ nodes, mastery, onNodeClick }: SkillTreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDrag = useRef(false);

  const masteryMap = new Map<string, MasteryData>();
  for (const m of mastery) {
    masteryMap.set(m.category, m);
  }

  const nodeMap = new Map<string, SkillNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const getNodeStatus = useCallback(
    (node: SkillNode): "locked" | "available" | "in_progress" | "mastered" => {
      const m = masteryMap.get(node.category);
      const masteryLevel = m?.mastery_level ?? 0;
      const scenariosCompleted = m?.scenarios_completed ?? 0;

      // Check prerequisites
      const prereqsMet = node.prerequisites.every((prereqId) => {
        const prereqNode = nodeMap.get(prereqId);
        if (!prereqNode) return true;
        const prereqMastery = masteryMap.get(prereqNode.category);
        return (prereqMastery?.mastery_level ?? 0) >= 70;
      });

      if (!prereqsMet) return "locked";
      if (masteryLevel >= 70) return "mastered";
      if (scenariosCompleted > 0) return "in_progress";
      return "available";
    },
    [masteryMap, nodeMap]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    didDrag.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDrag.current = true;
    }
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((prev) => Math.min(2, Math.max(0.3, prev + delta)));
  }, []);

  const handleNodeClick = useCallback(
    (node: SkillNode) => {
      if (didDrag.current) return;
      onNodeClick(node);
    },
    [onNodeClick]
  );

  // Prevent default wheel scroll
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Edges */}
        {nodes.map((node) =>
          node.prerequisites.map((prereqId) => {
            const prereq = nodeMap.get(prereqId);
            if (!prereq) return null;
            return (
              <line
                key={`${prereqId}->${node.id}`}
                x1={prereq.position_x}
                y1={prereq.position_y}
                x2={node.position_x}
                y2={node.position_y}
                stroke="#334155"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            );
          })
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const status = getNodeStatus(node);
          const m = masteryMap.get(node.category);
          const masteryPct = m ? m.mastery_level / 100 : 0;
          const tierColor = TIER_COLORS[Math.min(node.tier, TIER_COLORS.length - 1)];
          const cx = node.position_x;
          const cy = node.position_y;

          const isLocked = status === "locked";
          const isMastered = status === "mastered";
          const isInProgress = status === "in_progress";

          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: "pointer", opacity: isLocked ? 0.35 : 1 }}
              filter={isMastered ? "url(#gold-glow)" : undefined}
            >
              {/* Background circle */}
              <circle
                cx={cx}
                cy={cy}
                r={NODE_RADIUS}
                fill="#1e293b"
                stroke={isLocked ? "#475569" : isMastered ? "#fbbf24" : tierColor}
                strokeWidth={isMastered ? 3 : 2}
              />

              {/* Progress arc */}
              {(isInProgress || isMastered) && masteryPct > 0 && (
                <path
                  d={getArcPath(cx, cy, NODE_RADIUS - 3, masteryPct)}
                  fill="none"
                  stroke={isMastered ? "#fbbf24" : tierColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              )}

              {/* Status text / emoji */}
              {isLocked ? (
                <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fill="#94a3b8">
                  🔒
                </text>
              ) : status === "available" ? (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fill="#94a3b8" fontWeight="bold">
                  —
                </text>
              ) : (
                <text
                  x={cx}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={isMastered ? "#fbbf24" : "#e2e8f0"}
                >
                  {Math.round((m?.mastery_level ?? 0))}%
                </text>
              )}

              {/* Display name label */}
              <text
                x={cx}
                y={cy + NODE_RADIUS + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#94a3b8"
                fontWeight="500"
              >
                {node.display_name}
              </text>
            </g>
          );
        })}
      </g>

      {/* Defs for glow */}
      <defs>
        <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#fbbf24" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
