import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { colors } from "../../theme/colors";

interface ScoreGaugeProps {
  isCorrect: boolean;
  justificationQuality: string;
  size?: number;
}

export default function ScoreGauge({
  isCorrect,
  justificationQuality,
  size = 120,
}: ScoreGaugeProps) {
  const answerColor = isCorrect ? colors.emerald : colors.red;
  const reasoningColor = justificationQuality === "good" ? colors.emerald : colors.amber;

  const data = [
    {
      name: "Reasoning",
      value: justificationQuality === "good" ? 100 : 40,
      fill: reasoningColor,
    },
    {
      name: "Answer",
      value: isCorrect ? 100 : 30,
      fill: answerColor,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center"
    >
      <ResponsiveContainer width={size} height={size}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="90%"
          data={data}
          startAngle={210}
          endAngle={-30}
          barSize={8}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
            background={{ fill: `${colors.border}60` }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-[10px] -mt-2">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: answerColor }} />
          <span className="text-cm-muted">Answer</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: reasoningColor }} />
          <span className="text-cm-muted">Reasoning</span>
        </span>
      </div>
    </motion.div>
  );
}
