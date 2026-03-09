import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    title: "Quick Fire",
    description:
      "Rapid-fire MCQ scenarios testing your options instincts under time pressure.",
    color: "cm-cyan",
  },
  {
    title: "Deep Analysis",
    description:
      "Multi-step Socratic grading that probes your reasoning and trading thesis.",
    color: "cm-emerald",
  },
  {
    title: "Leaderboard",
    description:
      "Compete with fellow traders. Climb the ranks. Earn XP and unlock new categories.",
    color: "cm-amber",
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LandingPage() {
  return (
    <main role="main" className="min-h-screen bg-cm-bg flex flex-col">
      {/* Hero Section */}
      <motion.section
        className="flex-1 flex flex-col items-center justify-center px-6 py-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-6xl sm:text-7xl font-bold tracking-tight mb-4"
          variants={itemVariants}
        >
          <span className="text-cm-text">The </span>
          <span className="text-cm-cyan">
            Pit
          </span>
        </motion.h1>

        <motion.p
          className="text-xl sm:text-2xl text-cm-text/80 font-medium mb-2 text-center"
          variants={itemVariants}
        >
          Gamified options trading training for PEAK6
        </motion.p>

        <motion.p
          className="text-sm sm:text-base text-cm-muted mb-10 text-center max-w-lg"
          variants={itemVariants}
        >
          AI-generated scenarios. Socratic grading. Real progression.
        </motion.p>

        <motion.div className="flex gap-4 mb-20" variants={itemVariants}>
          <Link
            to="/signup"
            className="px-8 py-3 rounded-md bg-cm-cyan text-cm-bg font-bold text-lg hover:bg-cm-cyan/80 transition-all focus-ring"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-md border border-cm-cyan/50 text-cm-cyan font-bold text-lg hover:bg-cm-cyan/10 transition-all focus-ring"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <h2 className="sr-only">Features</h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full"
          variants={containerVariants}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="rounded-md border border-cm-border bg-cm-card p-6"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            >
              <h3 className={`text-${feature.color} font-bold text-lg mb-2`}>
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
      <footer className="border-t border-cm-border py-6 text-center">
        <p className="text-cm-muted text-xs">
          PEAK6 Capital Management &mdash; CapMan AI Training Platform
        </p>
      </footer>
    </main>
  );
}
