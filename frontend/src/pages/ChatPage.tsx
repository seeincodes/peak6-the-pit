import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, PanelLeftClose, PanelLeft } from "lucide-react";
import {
  createChatSession,
  listChatSessions,
  getChatSession,
  deleteChatSession,
} from "../api/chat";
import type { ChatMessageData, ChartSpec } from "../api/chat";
import ChatMessage from "../components/chat/ChatMessage";
import ChatSidebar from "../components/chat/ChatSidebar";
import FollowUpChips from "../components/chat/FollowUpChips";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCharts, setStreamingCharts] = useState<ChartSpec[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch sessions list
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => listChatSessions(),
  });

  // Fetch active session detail
  const { data: sessionDetail } = useQuery({
    queryKey: ["chat-session", activeSessionId],
    queryFn: () => getChatSession(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const messages = sessionDetail?.messages || [];

  // Combine persisted + optimistic messages
  const allMessages = [
    ...messages,
    ...optimisticMessages.filter(
      (om) => !messages.some((m) => m.id === om.id),
    ),
  ];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, streamingContent, streamingCharts.length]);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setActiveSessionId(session.id);
      setOptimisticMessages([]);
    },
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
        setOptimisticMessages([]);
      }
    },
  });

  const handleNewSession = useCallback(() => {
    createMutation.mutate(undefined);
  }, [createMutation]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (isStreaming) return;
      setActiveSessionId(id);
      setOptimisticMessages([]);
      setStreamingContent("");
      setStreamingCharts([]);
    },
    [isStreaming],
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (isStreaming) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation, isStreaming],
  );

  // Send message with SSE streaming
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      let sessionId = activeSessionId;

      // Create session if none active
      if (!sessionId) {
        try {
          const session = await createChatSession();
          sessionId = session.id;
          setActiveSessionId(sessionId);
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        } catch {
          return;
        }
      }

      // Optimistically add user message
      const userMsg: ChatMessageData = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content,
        message_type: "text",
        metadata: null,
        created_at: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCharts([]);

      try {
        const token = localStorage.getItem("token");
        const apiBase = import.meta.env.VITE_API_URL || "/api";
        const response = await fetch(
          `${apiBase}/chat/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ content }),
          },
        );

        if (!response.ok) {
          setIsStreaming(false);
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                setStreamingContent((prev) => prev + data.content);
              } else if (data.type === "chart") {
                setStreamingCharts((prev) => [...prev, data.chart]);
              } else if (data.type === "done") {
                setIsStreaming(false);
                // Refresh from DB
                queryClient.invalidateQueries({
                  queryKey: ["chat-session", sessionId],
                });
                queryClient.invalidateQueries({
                  queryKey: ["chat-sessions"],
                });
                setOptimisticMessages([]);
                setStreamingContent("");
                setStreamingCharts([]);
              } else if (data.type === "error") {
                setIsStreaming(false);
              }
            } catch {
              // Skip malformed SSE
            }
          }
        }
      } catch {
        setIsStreaming(false);
      }
    },
    [activeSessionId, isStreaming, queryClient],
  );

  const handleSubmit = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleFollowUpClick = useCallback(
    (topic: string) => {
      sendMessage(topic);
    },
    [sendMessage],
  );

  // Get follow-ups from the last assistant message
  const lastAssistantMsg = [...allMessages]
    .reverse()
    .find((m) => m.role === "assistant");
  const followUps =
    !isStreaming && lastAssistantMsg?.metadata?.follow_ups
      ? lastAssistantMsg.metadata.follow_ups
      : [];

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Chat sessions sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-cm-border overflow-hidden flex-shrink-0"
          >
            <div className="w-[280px] h-full p-4">
              <ChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
                isLoading={sessionsLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cm-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="cm-btn-ghost p-2"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </button>
          <h2 className="cm-subtitle truncate">
            {sessionDetail?.title || "AI Tutor"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {allMessages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="cm-surface-raised p-8 rounded-2xl max-w-md">
                <h3 className="cm-heading-sm mb-2">Welcome to AI Tutor</h3>
                <p className="cm-body text-cm-muted text-sm mb-4">
                  Ask me anything about finance, options, or volatility trading.
                  I can generate charts and diagrams to help explain concepts.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "What is implied volatility?",
                    "Show me a call option payoff",
                    "Explain the Greeks with charts",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="cm-chip text-xs text-cm-primary border-cm-primary/30 bg-cm-primary/5 hover:bg-cm-primary/15 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {allMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              messageType={msg.message_type}
              charts={msg.metadata?.charts}
              onFollowUpClick={handleFollowUpClick}
            />
          ))}

          {/* Streaming assistant message */}
          {isStreaming && streamingContent && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              messageType="text"
              charts={streamingCharts}
              isStreaming
            />
          )}

          {/* Follow-up chips */}
          {followUps.length > 0 && !isStreaming && (
            <div className="pl-11">
              <FollowUpChips
                suggestions={followUps}
                onSelect={handleFollowUpClick}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-cm-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about finance, options, volatility..."
              rows={1}
              className="cm-textarea flex-1 resize-none min-h-[44px] max-h-[120px]"
              style={{
                height: "auto",
                overflow: "hidden",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
              disabled={isStreaming}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isStreaming}
              className="cm-btn-primary p-3 rounded-xl disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
