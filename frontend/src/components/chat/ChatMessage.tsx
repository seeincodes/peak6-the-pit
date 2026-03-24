import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LessonPlanCard from "./LessonPlanCard";
import InlineChart from "./InlineChart";
import type { ChartData } from "./InlineChart";
import type { LessonPlan } from "../../api/chat";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageType: "text" | "lesson_plan";
  isStreaming?: boolean;
  charts?: ChartData[];
  onFollowUpClick?: (topic: string) => void;
}

export default function ChatMessage({
  role,
  content,
  messageType,
  isStreaming,
  charts,
  onFollowUpClick,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Try to parse lesson plan JSON
  let lessonPlan: LessonPlan | null = null;
  if (messageType === "lesson_plan" && !isStreaming) {
    try {
      lessonPlan = JSON.parse(content);
    } catch {
      // Fall back to text rendering
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-cm-primary/20 text-cm-primary"
            : "bg-cm-emerald/20 text-cm-emerald"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-cm-primary/10 border border-cm-primary/20 rounded-2xl rounded-tr-sm px-4 py-3"
            : "cm-surface rounded-2xl rounded-tl-sm px-4 py-3"
        }`}
      >
        {lessonPlan ? (
          <LessonPlanCard plan={lessonPlan} onFollowUpClick={onFollowUpClick} />
        ) : isUser ? (
          <div className="cm-body whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        ) : (
          <div className="cm-body leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-cm-text prose-p:text-cm-text prose-strong:text-cm-text prose-li:text-cm-text prose-a:text-cm-primary prose-code:text-cm-primary prose-code:bg-cm-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[rgb(var(--cm-bg))] prose-pre:border prose-pre:border-cm-border/10 prose-td:text-cm-text prose-th:text-cm-text prose-th:border-cm-border/10 prose-td:border-cm-border/10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-cm-primary/60 rounded-sm animate-pulse" />
            )}
          </div>
        )}

        {/* Inline charts */}
        {charts && charts.length > 0 && (
          <div className="mt-2">
            {charts.map((chart, i) => (
              <InlineChart key={i} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
