import api from "./client";

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  message_type: "text" | "lesson_plan";
  metadata: {
    intent?: string;
    follow_ups?: string[];
    charts?: ChartSpec[];
  } | null;
  created_at: string;
}

export interface ChartSpec {
  chart_type: "line" | "multi_line" | "area";
  title: string;
  x_label?: string;
  y_label?: string;
  zero_line?: boolean;
  series: { name: string; key: string; color?: string }[];
  data: Record<string, number>[];
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageData[];
}

export interface LessonPlan {
  title: string;
  overview: string;
  difficulty: string;
  estimated_minutes: number;
  sections: {
    title: string;
    content: string;
    key_takeaways: string[];
  }[];
  practice_questions: {
    question: string;
    hint: string;
  }[];
  follow_up_topics: string[];
}

export async function createChatSession(
  title?: string,
): Promise<ChatSession> {
  const res = await api.post("/chat/sessions", { title });
  return res.data;
}

export async function listChatSessions(
  limit = 20,
  offset = 0,
): Promise<ChatSession[]> {
  const res = await api.get("/chat/sessions", {
    params: { limit, offset },
  });
  return res.data;
}

export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionDetail> {
  const res = await api.get(`/chat/sessions/${sessionId}`);
  return res.data;
}

export async function deleteChatSession(
  sessionId: string,
): Promise<void> {
  await api.delete(`/chat/sessions/${sessionId}`);
}
