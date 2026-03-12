import { motion } from "framer-motion";

interface StarBurstProps {
  count?: number;
}

export default function StarBurst({ count = 5 }: StarBurstProps) {
  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const distance = 40 + Math.random() * 40;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      delay: i * 0.05,
    };
  });

  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {stars.map((star, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 text-cm-lime"
          style={{ fontSize: 12 + Math.random() * 4 }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            x: star.x,
            y: star.y,
          }}
          transition={{
            duration: 0.8,
            delay: star.delay,
            ease: "easeOut",
          }}
        >
          ⭐
        </motion.span>
      ))}
    </span>
  );
}
