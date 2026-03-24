import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { GitBranch } from "lucide-react";
import api from "../api/client";
import SkillTreeCanvas from "../components/SkillTreeCanvas";
import SkillNodeDetail from "../components/SkillNodeDetail";

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
  avg_score?: number;
}

export default function SkillTreePage() {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  const { data: treeData, isLoading: treeLoading } = useQuery<SkillNode[]>({
    queryKey: ["skills-tree"],
    queryFn: async () => {
      const res = await api.get("/skills/tree");
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  const { data: masteryData, isLoading: masteryLoading } = useQuery<MasteryData[]>({
    queryKey: ["skills-mastery"],
    queryFn: async () => {
      const res = await api.get("/skills/mastery");
      return res.data;
    },
    staleTime: 60_000,
  });

  const nodes = treeData ?? [];
  const mastery = masteryData ?? [];

  const selectedMastery = selectedNode
    ? mastery.find((m) => m.category === selectedNode.category) ?? null
    : null;

  const isLoading = treeLoading || masteryLoading;

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-cm-bg">
      {/* Title overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="cm-surface px-4 py-3 rounded-xl shadow-lg border border-cm-border/10 pointer-events-auto">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-cm-primary shrink-0" />
            <div>
              <h1 className="cm-title text-base leading-none">Skill Tree</h1>
              <p className="text-[11px] text-cm-muted mt-0.5">Click a node to explore</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
            <span className="text-cm-muted text-sm">Loading skill tree...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-2">
            <GitBranch size={40} className="text-cm-muted mx-auto" />
            <p className="text-cm-muted">No skill tree data available.</p>
          </div>
        </div>
      )}

      {/* Canvas */}
      {!isLoading && nodes.length > 0 && (
        <SkillTreeCanvas
          nodes={nodes}
          mastery={mastery}
          onNodeClick={setSelectedNode}
        />
      )}

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <SkillNodeDetail
            key={selectedNode.id}
            node={selectedNode}
            mastery={selectedMastery}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
