import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import api from "../api/client";
import { categoryDisplay } from "../theme/colors";

interface PrimerData {
  category: string;
  chunks: { content: string; source: string }[];
}

export default function ConceptPrimer({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<PrimerData>({
    queryKey: ["primer", category],
    queryFn: async () =>
      (await api.get(`/scenarios/categories/${category}/primer`)).data,
    staleTime: 300_000,
  });

  const name = categoryDisplay[category] || category.replace(/_/g, " ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="cm-modal-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="bg-cm-card border border-cm-border/10 rounded-md p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-cm-primary" />
              <h2 className="text-lg font-bold text-cm-text">{name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-cm-muted hover:text-cm-text transition-colors p-1"
              aria-label="Close primer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-cm-muted mb-4">
            Key concepts to review before practicing this category.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-cm-primary/30 border-t-cm-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : data && data.chunks.length > 0 ? (
            <div className="space-y-4">
              {data.chunks.map((chunk, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md bg-cm-bg border border-cm-border/50"
                >
                  <p className="text-sm text-cm-text leading-relaxed whitespace-pre-line">
                    {chunk.content}
                  </p>
                  <p className="text-[10px] text-cm-muted mt-2">
                    Source: {chunk.source}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-cm-muted text-center py-8">
              No primer content available for this category yet.
            </p>
          )}

          <div className="mt-4 text-center">
            <button onClick={onClose} className="cm-btn-primary-lg">
              Start Practicing
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
