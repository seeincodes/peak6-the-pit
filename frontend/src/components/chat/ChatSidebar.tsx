import { motion } from "framer-motion";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { ChatSession } from "../../api/chat";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isLoading: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isLoading,
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNewSession}
        className="cm-btn-primary flex items-center justify-center gap-2 w-full mb-4"
      >
        <Plus size={16} />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-1 -mx-1">
        {isLoading && (
          <div className="text-cm-muted text-sm text-center py-4">
            Loading...
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-cm-muted text-sm text-center py-8">
            No conversations yet
          </div>
        )}

        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? "bg-cm-primary/15 border border-cm-primary/20"
                  : "hover:bg-white/5"
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare
                size={14}
                className={isActive ? "text-cm-primary" : "text-cm-muted"}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    isActive ? "text-cm-text" : "text-cm-muted"
                  }`}
                >
                  {session.title}
                </p>
                <p className="text-xs text-cm-muted/60">
                  {timeAgo(session.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-cm-muted hover:text-cm-red transition-all p-1"
                aria-label="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
