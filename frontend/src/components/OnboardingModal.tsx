import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Zap, Trophy, BarChart3, ArrowRight } from "lucide-react";
import api from "../api/client";

interface OnboardingModalProps {
  show: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Crosshair,
    title: "Welcome to The Pit",
    body: "Your AI-powered options trading training platform. Practice with realistic scenarios, get graded by AI, and level up your skills.",
    color: "#4D34EF",
  },
  {
    icon: Zap,
    title: "Two Training Modes",
    body: "Deep Analysis: Tackle open-ended scenarios with Socratic follow-up questions and detailed grading.\n\nQuick Fire: Fast-paced multiple choice with justification grading. Try Lightning Round for timed challenges!",
    color: "#F59E0B",
  },
  {
    icon: BarChart3,
    title: "XP & Leveling",
    body: "Earn XP for every response — quality matters more than just being correct. Level up to unlock new categories across 27 trading topics. Maintain streaks for bonus XP.",
    color: "#22C55E",
  },
  {
    icon: Trophy,
    title: "Compete & Improve",
    body: "Track your performance across 4 rubric dimensions. Earn badges for milestones. Climb the leaderboard. Review past attempts to learn from mistakes. You're ready!",
    color: "#06B6D4",
  },
];

export default function OnboardingModal({ show, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const handleFinish = async () => {
    try {
      await api.patch("/users/me/onboard");
    } catch { /* non-critical */ }
    onComplete();
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

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
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-cm-card border border-cm-border rounded-md p-4 sm:p-8 max-w-md w-full mx-4 sm:mx-0 text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${current.color}15`, border: `2px solid ${current.color}40` }}
            >
              <Icon size={28} style={{ color: current.color }} />
            </motion.div>

            <h2 className="text-xl font-bold text-cm-text mb-3">{current.title}</h2>
            <p className="text-sm text-cm-muted leading-relaxed whitespace-pre-line mb-6">
              {current.body}
            </p>

            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-cm-primary" : "w-1.5 bg-cm-primary/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm text-cm-muted hover:text-cm-text transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? handleFinish : () => setStep(step + 1)}
                className="cm-btn-primary-lg flex items-center gap-2"
              >
                {isLast ? "Let's Go!" : "Next"}
                {!isLast && <ArrowRight size={14} />}
              </button>
            </div>

            {step === 0 && (
              <button
                onClick={handleFinish}
                className="mt-3 text-xs text-cm-muted hover:text-cm-text transition-colors"
              >
                Skip tour
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
