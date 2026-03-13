import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Brain, Trophy, BookText, Sparkles } from "lucide-react";

const features = [
  {
    title: "Quick Fire",
    description:
      "Rapid-fire MCQ scenarios testing your options instincts under time pressure.",
    icon: Zap,
    accent: "#FCD34D",
  },
  {
    title: "Deep Analysis",
    description:
      "Multi-step Socratic grading that probes your reasoning and trading thesis.",
    icon: Brain,
    accent: "#34D399",
  },
  {
    title: "Leaderboard",
    description:
      "Compete with fellow traders. Climb the ranks. Earn XP and unlock new categories.",
    icon: Trophy,
    accent: "#C8FB50",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingPage() {
  return (
    <main role="main" className="min-h-screen bg-cm-bg flex flex-col">
      {/* Hero Section */}
      <motion.section
        className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:py-14"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cm-card border border-cm-border mb-5"
          variants={itemVariants}
        >
          <Sparkles size={14} className="text-cm-primary" />
          <span className="text-cm-primary text-xs font-semibold tracking-wide uppercase">
            CapMan AI Training Platform
          </span>
        </motion.div>

        <motion.h1
          className="text-6xl sm:text-7xl font-extrabold tracking-tighter mb-3 text-center"
          variants={itemVariants}
        >
          <span className="text-cm-text">The </span>
          <span className="text-cm-primary">Pit</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-cm-muted font-medium mb-2 text-center max-w-xl"
          variants={itemVariants}
        >
          Gamified options trading training
        </motion.p>

        <motion.p
          className="text-sm text-cm-muted/70 mb-8 text-center max-w-md"
          variants={itemVariants}
        >
          Learn first, test second. AI-generated scenarios, Socratic feedback, and measurable progression.
        </motion.p>

        <motion.div className="flex flex-wrap justify-center gap-3 mb-8" variants={itemVariants}>
          <Link
            to="/signup"
            className="cm-btn-primary-lg px-8 py-3"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="cm-btn-secondary px-8 py-3"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="cm-btn-ghost px-4 py-3 text-sm inline-flex items-center gap-1"
          >
            <BookText size={14} />
            Start with onboarding
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <h2 className="sr-only">Features</h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full"
          variants={containerVariants}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="cm-surface-interactive p-5"
              variants={itemVariants}
            >
              <feature.icon
                size={24}
                style={{ color: feature.accent }}
                className="mb-3"
                aria-hidden="true"
              />
              <h3 className="text-cm-text font-bold text-base mb-1">
                {feature.title}
              </h3>
              <p className="text-cm-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-cm-border py-4 text-center">
        <p className="text-cm-muted text-xs tracking-wide">
          CapMan AI Training Platform
        </p>
      </footer>
    </main>
  );
}
