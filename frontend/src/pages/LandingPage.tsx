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
    accent: "#4ade80",
  },
  {
    title: "Leaderboard",
    description:
      "Compete with fellow traders. Climb the ranks. Earn XP and unlock new categories.",
    icon: Trophy,
    accent: "#10b981",
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
        {/* Logo */}
        <motion.div className="flex items-center gap-3 mb-6" variants={itemVariants}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cm-primary to-cm-mint flex items-center justify-center">
            <span className="text-cm-bg text-2xl font-extrabold leading-none">P</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight uppercase text-cm-text">
            THE PIT
          </span>
        </motion.div>

        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cm-primary/10 border border-cm-primary/20 mb-5"
          variants={itemVariants}
        >
          <span className="text-cm-mint text-xs font-semibold tracking-wide uppercase">
            Options Trading Training Platform
          </span>
        </motion.div>

        <motion.h1
          className="text-6xl sm:text-7xl font-extrabold tracking-tighter mb-3 text-center"
          variants={itemVariants}
        >
          <span className="text-cm-text">Sharpen Your </span>
          <span className="bg-gradient-to-r from-cm-primary to-cm-mint bg-clip-text text-transparent">
            Edge
          </span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-cm-muted font-medium mb-2 text-center max-w-xl"
          variants={itemVariants}
        >
          AI-powered options trading scenarios that push your limits
        </motion.p>

        <motion.p
          className="text-sm text-cm-muted/70 mb-8 text-center max-w-md"
          variants={itemVariants}
        >
          Rapid-fire challenges. Socratic deep dives. Real progression and rankings.
        </motion.p>

        <motion.div className="flex gap-4 mb-10" variants={itemVariants}>
          <Link
            to="/signup"
            className="px-8 py-3 rounded-lg bg-cm-primary text-cm-bg font-bold text-sm hover:bg-cm-primary/90 transition-all duration-300 focus-ring"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-lg border-2 border-cm-border/10 text-cm-text font-bold text-sm hover:border-cm-primary/50 hover:text-cm-primary transition-all duration-300 focus-ring"
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
              className="rounded-lg bg-cm-card border border-cm-border/10 p-5 hover:border-cm-primary/30 transition-all duration-300"
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
      <footer className="border-t border-cm-border/10 py-4 text-center">
        <p className="text-cm-muted text-xs tracking-wide">
          The Pit Training Platform
        </p>
      </footer>
    </main>
  );
}
