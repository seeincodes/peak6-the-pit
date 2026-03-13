import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Check,
  Play,
  Clock,
  Star,
  Map,
  TrendingUp,
  BarChart3,
  Shield,
  Globe,
  Layers,
  Activity,
  BookOpen,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { categoryDisplay, categoryColors } from "../theme/colors";
import StudyGroupWidget from "../components/StudyGroupWidget";
import api from "../api/client";

interface PathSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  difficulty_level: string;
  estimated_minutes: number;
  total_steps: number;
  current_step: number | null;
  completed_at: string | null;
  progress_pct: number;
}

interface PathStep {
  step_number: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  step_type?: "scenario" | "mcq";
  required_score: number;
  status: "completed" | "current" | "locked";
}

interface PathDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  difficulty_level: string;
  estimated_minutes: number;
  steps: PathStep[];
  current_step: number | null;
  completed_at: string | null;
  is_enrolled: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  BarChart3,
  Shield,
  Globe,
  Layers,
  Activity,
  BookOpen,
  Map,
};

function getIcon(name: string) {
  return ICON_MAP[name] || BookOpen;
}

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    beginner: "bg-cm-card-raised text-cm-emerald border-cm-emerald",
    intermediate: "bg-cm-card-raised text-cm-amber border-cm-amber",
    advanced: "bg-cm-card-raised text-cm-red border-cm-red",
    mixed: "bg-cm-card-raised text-cm-primary border-cm-primary",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${colors[level] || colors.mixed}`}>
      {level}
    </span>
  );
}

function PathCard({
  path,
  onClick,
  index,
}: {
  path: PathSummary;
  onClick: () => void;
  index: number;
}) {
  const Icon = getIcon(path.icon);
  const isEnrolled = path.current_step !== null;
  const isCompleted = !!path.completed_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cm-surface p-5 cursor-pointer hover:border-cm-primary hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-cm-card-raised flex items-center justify-center shrink-0">
          <Icon size={20} className="text-cm-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-cm-text truncate">{path.name}</h3>
            <DifficultyBadge level={path.difficulty_level} />
          </div>
          <p className="text-xs text-cm-muted line-clamp-2 mb-3">{path.description}</p>

          <div className="flex items-center gap-4 text-xs text-cm-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              ~{path.estimated_minutes} min
            </span>
            <span>{path.total_steps} steps</span>
          </div>

          {isEnrolled && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-cm-muted">
                  {isCompleted ? "Completed" : `Step ${path.current_step} of ${path.total_steps}`}
                </span>
                <span className="text-xs font-medium text-cm-primary">{path.progress_pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-cm-border rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isCompleted ? "bg-cm-emerald" : "bg-cm-primary"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${path.progress_pct}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 self-center">
          {isCompleted ? (
            <CheckCircle2 size={20} className="text-cm-emerald" />
          ) : isEnrolled ? (
            <span className="text-xs font-medium text-cm-primary">Continue</span>
          ) : (
            <span className="text-xs font-medium text-cm-muted">Start</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PathDetailView({
  pathId,
  onBack,
}: {
  pathId: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: path, isLoading } = useQuery({
    queryKey: ["path-detail", pathId],
    queryFn: async () => {
      const res = await api.get(`/paths/${pathId}`);
      return res.data as PathDetail;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/paths/${pathId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["path-detail", pathId] });
      queryClient.invalidateQueries({ queryKey: ["paths"] });
    },
  });

  const startStepMutation = useMutation({
    mutationFn: () => api.post(`/paths/${pathId}/start-step`),
    onSuccess: (res) => {
      const { category, difficulty, path_id, path_name, step_title, step_description, step_type } = res.data;
      navigate("/", {
        state: {
          category,
          difficulty,
          fromPath: path_id,
          pathName: path_name,
          stepTitle: step_title,
          learningObjective: step_description,
          stepType: step_type || "scenario",
        },
      });
    },
  });

  if (isLoading || !path) {
    return (
      <div className="text-cm-primary animate-pulse text-center py-12 text-sm">Loading path...</div>
    );
  }

  const Icon = getIcon(path.icon);
  const isCompleted = !!path.completed_at;
  const totalSteps = path.steps.length;
  const completedSteps = path.current_step ?? 0;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-cm-muted hover:text-cm-text text-sm transition-colors"
      >
        <ArrowLeft size={16} /> All Paths
      </button>

      {/* Header */}
      <div className="cm-surface p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-cm-card-raised flex items-center justify-center shrink-0">
            <Icon size={24} className="text-cm-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-cm-text">{path.name}</h3>
              <DifficultyBadge level={path.difficulty_level} />
            </div>
            <p className="text-sm text-cm-muted mb-3">{path.description}</p>
            <div className="flex items-center gap-4 text-xs text-cm-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                ~{path.estimated_minutes} min
              </span>
              <span>{totalSteps} steps</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {path.is_enrolled && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cm-muted">
                {isCompleted ? "Path completed!" : `${completedSteps} of ${totalSteps} steps complete`}
              </span>
              <span className="text-xs font-medium text-cm-primary">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-cm-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-cm-emerald" : "bg-cm-primary"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Enroll button */}
        {!path.is_enrolled && (
          <button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="cm-btn-primary mt-4 w-full flex items-center justify-center gap-2"
          >
            <Play size={16} />
            {enrollMutation.isPending ? "Enrolling..." : "Start This Path"}
          </button>
        )}
      </div>

      {/* Steps timeline */}
      <div className="space-y-0">
        {path.steps.map((step, i) => {
          const color = categoryColors[step.category] || "#4D34EF";
          const isLast = i === path.steps.length - 1;

          return (
            <motion.div
              key={step.step_number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4"
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center w-8 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === "completed"
                      ? "bg-cm-card-raised border-2 border-cm-emerald"
                      : step.status === "current"
                        ? "bg-cm-card-raised border-2 border-cm-primary"
                        : "bg-cm-card-raised border-2 border-cm-border"
                  }`}
                >
                  {step.status === "completed" ? (
                    <Check size={14} className="text-cm-emerald" />
                  ) : step.status === "current" ? (
                    <Play size={12} className="text-cm-primary" />
                  ) : (
                    <Lock size={12} className="text-cm-muted" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      step.status === "completed" ? "bg-cm-emerald" : "bg-cm-border"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div
                className={`cm-surface flex-1 p-4 mb-3 ${
                  step.status === "current" ? "border-cm-primary" : ""
                } ${step.status === "locked" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-cm-muted">Step {step.step_number}</span>
                      {step.step_type === "mcq" && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-cm-card-raised text-cm-amber border border-cm-amber">
                          Quiz
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: `${color}15`,
                          color,
                        }}
                      >
                        {categoryDisplay[step.category] || step.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-cm-muted capitalize">{step.difficulty}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-cm-text">{step.title}</h4>
                    <p className="text-xs text-cm-muted mt-1">{step.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star size={10} className="text-cm-amber" />
                      <span className="text-xs text-cm-muted">
                        Score {step.required_score}+ to pass
                      </span>
                    </div>
                  </div>
                </div>

                {step.status === "current" && (
                  <button
                    onClick={() => startStepMutation.mutate()}
                    disabled={startStepMutation.isPending}
                    className="cm-btn-primary mt-3 w-full flex items-center justify-center gap-2 text-sm"
                  >
                    {step.step_type === "mcq" ? <Zap size={14} /> : <Play size={14} />}
                    {startStepMutation.isPending ? "Loading..." : step.step_type === "mcq" ? "Start Quiz" : "Start Scenario"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Study Group Widget — only when enrolled */}
      {path.is_enrolled && (
        <StudyGroupWidget pathId={pathId} pathName={path.name} />
      )}
    </motion.div>
  );
}

export default function LearningPathPage() {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  const { data: paths, isLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await api.get("/paths");
      return res.data as PathSummary[];
    },
  });

  return (
    <div className="cm-page max-w-2xl">
      <AnimatePresence mode="wait">
        {selectedPathId ? (
          <PathDetailView
            key="detail"
            pathId={selectedPathId}
            onBack={() => setSelectedPathId(null)}
          />
        ) : (
          <motion.div key="browser" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-4">
              <Map size={22} className="text-cm-primary" />
              <h2 className="cm-title">Learning Paths</h2>
            </div>

            {isLoading && (
              <div className="text-cm-primary animate-pulse text-center py-12 text-sm">
                Loading paths...
              </div>
            )}

            {paths && (
              <div className="space-y-3">
                {paths.map((p, i) => (
                  <PathCard
                    key={p.id}
                    path={p}
                    onClick={() => setSelectedPathId(p.id)}
                    index={i}
                  />
                ))}
                {paths.length === 0 && (
                  <div className="cm-surface p-8 text-center">
                    <Map size={32} className="text-cm-muted mx-auto mb-3" />
                    <div className="text-cm-muted text-sm">No learning paths available yet.</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
