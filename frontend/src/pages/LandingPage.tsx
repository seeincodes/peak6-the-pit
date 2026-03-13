import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Brain, Trophy } from "lucide-react";

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
    <main role="main" className="h-screen bg-cm-bg flex flex-col overflow-hidden">
      {/* Hero Section */}
      <motion.section
        className="flex-1 flex flex-col items-center justify-center px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cm-primary/10 border border-cm-primary/20 mb-5"
          variants={itemVariants}
        >
          <span className="text-cm-lime text-xs font-semibold tracking-wide uppercase">
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
          AI-generated scenarios. Socratic grading. Real progression.
        </motion.p>

        <motion.div className="flex gap-4 mb-10" variants={itemVariants}>
          <Link
            to="/signup"
            className="px-8 py-3 rounded bg-cm-primary text-white font-bold text-sm hover:bg-cm-primary/90 transition-all duration-300 focus-ring"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded border-2 border-cm-border text-cm-text font-bold text-sm hover:border-cm-primary/50 hover:text-cm-primary transition-all duration-300 focus-ring"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <h2 className="sr-only">Features</h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full"
          variants={containerVariants}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="rounded bg-cm-card border border-cm-border p-5 hover:border-cm-primary/30 transition-all duration-300"
              variants={itemVariants}
            >
              <feature.icon
                size={24}
                style={{ color: feature.accent }}
                className="mb-3"
                aria-hidden="true"
              />
              <h3 className="text-cm-text font-bold text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-cm-muted text-xs leading-relaxed">
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
