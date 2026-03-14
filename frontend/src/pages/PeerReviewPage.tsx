import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star, ArrowLeft, Send, Zap, Award, MessageSquare, Inbox } from "lucide-react";
import api from "../api/client";

interface QueueItem {
  response_id: string;
  scenario_title: string;
  scenario_question: string;
  scenario_category: string;
  scenario_difficulty: string;
  conversation: { role: string; content: string }[];
  submitted_at: string;
  author_display_name: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface ReviewResult {
  peer_review_id: string;
  quality_score: number | null;
  xp_earned: number;
  quality_bonus: boolean;
  xp_total: number;
}

interface ReceivedReview {
  review_id: string;
  reviewer_name: string;
  scenario_title: string;
  scenario_question: string;
  scenario_category: string;
  scenario_difficulty: string;
  dimension_scores: Record<string, number>;
  feedback: string;
  quality_score: number | null;
  created_at: string;
}

const DIMENSIONS = ["reasoning", "terminology", "overall"] as const;
const DIMENSION_LABELS: Record<string, string> = {
  reasoning: "Reasoning",
  terminology: "Terminology",
  overall: "Overall Quality",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-colors"
        >
          <Star
            size={20}
            className={n <= value ? "text-cm-amber fill-cm-amber" : "text-cm-muted/30"}
          />
        </button>
      ))}
    </div>
  );
}

function ConversationBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-cm-primary/15 text-cm-text border border-cm-primary/20"
            : "bg-cm-card-raised text-cm-text border border-cm-border"
        }`}
      >
        <div className="text-xs text-cm-muted mb-1 font-medium">
          {isUser ? "Trainee" : "AI Probe"}
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryCount[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          selected === null
            ? "bg-cm-primary/15 text-cm-primary border border-cm-primary/30"
            : "bg-cm-card-raised text-cm-muted border border-cm-border hover:text-cm-text"
        }`}
      >
        All ({categories.reduce((sum, c) => sum + c.count, 0)})
      </button>
      {categories.map((c) => (
        <button
          key={c.category}
          onClick={() => onSelect(c.category === selected ? null : c.category)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
            selected === c.category
              ? "bg-cm-primary/15 text-cm-primary border border-cm-primary/30"
              : "bg-cm-card-raised text-cm-muted border border-cm-border hover:text-cm-text"
          }`}
        >
          {c.category.replace(/_/g, " ")} ({c.count})
        </button>
      ))}
    </div>
  );
}

function QueueView({
  queue,
  onSelect,
  categories,
  selectedCategory,
  onCategorySelect,
}: {
  queue: QueueItem[];
  onSelect: (item: QueueItem) => void;
  categories: CategoryCount[];
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
}) {
  return (
    <div>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={onCategorySelect}
      />

      {queue.length === 0 ? (
        <div className="cm-surface p-8 text-center">
          <Users size={32} className="text-cm-muted mx-auto mb-3" />
          <div className="text-cm-muted text-sm">
            {selectedCategory
              ? "No responses to review in this category. Try another!"
              : "No responses to review right now. Check back later!"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item, i) => (
            <motion.div
              key={item.response_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="cm-surface p-4 cursor-pointer hover:border-cm-primary/30 transition-all"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-cm-text truncate">
                    {item.scenario_title || `${item.scenario_category.replace(/_/g, " ")} (${item.scenario_difficulty})`}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cm-primary/10 text-cm-primary capitalize">
                      {item.scenario_category.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-cm-muted capitalize">
                      {item.scenario_difficulty}
                    </span>
                    <span className="text-xs text-cm-muted">
                      by {item.author_display_name}
                    </span>
                  </div>
                  {item.scenario_question && (
                    <p className="text-xs text-cm-muted mt-2 line-clamp-2">
                      {item.scenario_question}
                    </p>
                  )}
                </div>
                <button className="text-cm-primary text-xs font-medium flex items-center gap-1 ml-3 shrink-0">
                  Review <MessageSquare size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  item,
  onBack,
  onSuccess,
}: {
  item: QueueItem;
  onBack: () => void;
  onSuccess: (result: ReviewResult) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({
    reasoning: 3,
    terminology: 3,
    overall: 3,
  });
  const [feedback, setFeedback] = useState("");

  const mutation = useMutation({
    mutationFn: (data: {
      response_id: string;
      dimension_scores: Record<string, number>;
      feedback: string;
    }) => api.post("/peer-review", data),
    onSuccess: (res) => onSuccess(res.data),
  });

  const canSubmit = feedback.length >= 10 && !mutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-cm-muted hover:text-cm-text text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to queue
      </button>

      {/* Scenario context */}
      <div className="cm-surface p-4">
        <h4 className="cm-heading-sm text-cm-amber mb-1">
          {item.scenario_title || `${item.scenario_category.replace(/_/g, " ")} (${item.scenario_difficulty})`}
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-cm-primary/10 text-cm-primary capitalize">
            {item.scenario_category.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-cm-muted capitalize">
            {item.scenario_difficulty}
          </span>
        </div>
        <p className="text-sm text-cm-text">{item.scenario_question}</p>
      </div>

      {/* Conversation */}
      <div className="cm-surface p-4">
        <h4 className="text-xs text-cm-muted font-medium mb-3 uppercase tracking-wider">
          Conversation
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {item.conversation.map((msg, i) => (
            <ConversationBubble key={i} role={msg.role} content={msg.content} />
          ))}
        </div>
      </div>

      {/* Scoring */}
      <div className="cm-surface p-4 space-y-4">
        <h4 className="text-xs text-cm-muted font-medium uppercase tracking-wider">
          Your Assessment
        </h4>
        {DIMENSIONS.map((dim) => (
          <div key={dim} className="flex items-center justify-between">
            <span className="text-sm text-cm-text">{DIMENSION_LABELS[dim]}</span>
            <StarRating
              value={scores[dim]}
              onChange={(v) => setScores((prev) => ({ ...prev, [dim]: v }))}
            />
          </div>
        ))}

        <div>
          <label className="block text-sm text-cm-text mb-1">
            Feedback <span className="text-cm-muted text-xs">(min 10 chars)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={mutation.isPending}
            maxLength={500}
            rows={3}
            placeholder="What did they do well? What could be improved?"
            className={`cm-input w-full resize-none transition-opacity ${mutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <div className="text-xs text-cm-muted text-right mt-1">
            {feedback.length}/500
          </div>
        </div>

        {mutation.isError && (
          <div className="text-red-400 text-xs">
            {(mutation.error as any)?.response?.data?.detail || "Failed to submit review"}
          </div>
        )}

        <button
          onClick={() =>
            mutation.mutate({
              response_id: item.response_id,
              dimension_scores: scores,
              feedback,
            })
          }
          disabled={!canSubmit}
          className="cm-btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {mutation.isPending ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </motion.div>
  );
}

function SuccessView({
  result,
  onReviewAnother,
}: {
  result: ReviewResult;
  onReviewAnother: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cm-surface p-8 text-center space-y-4"
    >
      <div className="w-16 h-16 rounded-full bg-cm-lime/15 flex items-center justify-center mx-auto">
        <Award size={32} className="text-cm-lime" />
      </div>

      <h3 className="text-lg font-bold text-cm-text">Review Submitted!</h3>

      <div className="flex items-center justify-center gap-2">
        <Zap size={18} className="text-cm-lime" />
        <span className="text-cm-lime font-bold text-xl">+{result.xp_earned} XP</span>
      </div>

      {result.quality_bonus && (
        <div className="text-cm-amber text-sm font-medium">
          Quality Bonus! Your review closely matched the AI assessment.
        </div>
      )}

      {result.quality_score !== null && (
        <div className="text-cm-muted text-xs">
          Alignment score: {(result.quality_score * 100).toFixed(0)}%
        </div>
      )}

      <button onClick={onReviewAnother} className="cm-btn-primary mt-4">
        Review Another
      </button>
    </motion.div>
  );
}

function ReceivedReviewsView({ reviews }: { reviews: ReceivedReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="cm-surface p-8 text-center">
        <Inbox size={32} className="text-cm-muted mx-auto mb-3" />
        <div className="text-cm-muted text-sm">
          No reviews received yet. Complete more scenarios so peers can review your work!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, i) => (
        <motion.div
          key={review.review_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="cm-surface p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-cm-text">
                {review.scenario_title || `${review.scenario_category.replace(/_/g, " ")}`}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-cm-primary/10 text-cm-primary capitalize">
                  {review.scenario_category.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-cm-muted capitalize">
                  {review.scenario_difficulty}
                </span>
              </div>
              {review.scenario_question && (
                <p className="text-xs text-cm-muted mt-2 line-clamp-2">
                  {review.scenario_question}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="text-xs text-cm-muted">
                by {review.reviewer_name}
              </div>
              <div className="text-[10px] text-cm-muted/60 mt-0.5">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="flex gap-4">
            {Object.entries(review.dimension_scores).map(([dim, score]) => (
              <div key={dim} className="flex items-center gap-1.5">
                <span className="text-xs text-cm-muted capitalize">{dim}:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      className={n <= (score as number) ? "text-cm-amber fill-cm-amber" : "text-cm-muted/20"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="bg-cm-card-raised rounded-lg px-3 py-2">
            <p className="text-sm text-cm-text whitespace-pre-wrap">{review.feedback}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

type Tab = "review" | "received";

export default function PeerReviewPage() {
  const [tab, setTab] = useState<Tab>("review");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ["peer-review-categories"],
    queryFn: async () => {
      const res = await api.get("/peer-review/queue/categories");
      return res.data as CategoryCount[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["peer-review-queue", selectedCategory],
    queryFn: async () => {
      const params = selectedCategory ? `?category=${selectedCategory}` : "";
      const res = await api.get(`/peer-review/queue${params}`);
      return res.data as { queue: QueueItem[] };
    },
    enabled: tab === "review",
  });

  const { data: receivedReviews, isLoading: receivedLoading } = useQuery({
    queryKey: ["peer-review-received"],
    queryFn: async () => {
      const res = await api.get("/peer-review/received");
      return res.data as ReceivedReview[];
    },
    enabled: tab === "received",
  });

  const handleSuccess = (r: ReviewResult) => {
    setResult(r);
    setSelectedItem(null);
    queryClient.invalidateQueries({ queryKey: ["peer-review-queue"] });
    queryClient.invalidateQueries({ queryKey: ["peer-review-categories"] });
    queryClient.invalidateQueries({ queryKey: ["peer-review-received"] });
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  const handleReviewAnother = () => {
    setResult(null);
    setSelectedItem(null);
  };

  const showTabs = !selectedItem && !result;

  return (
    <div className="cm-page max-w-2xl">
      <h2 className="cm-title mb-4">Peer Review</h2>

      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 mb-4 bg-cm-card-raised rounded-lg p-1">
          <button
            onClick={() => setTab("review")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === "review"
                ? "bg-cm-primary/15 text-cm-primary"
                : "text-cm-muted hover:text-cm-text"
            }`}
          >
            <MessageSquare size={14} />
            Review Others
          </button>
          <button
            onClick={() => setTab("received")}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === "received"
                ? "bg-cm-primary/15 text-cm-primary"
                : "text-cm-muted hover:text-cm-text"
            }`}
          >
            <Inbox size={14} />
            Reviews on My Work
            {receivedReviews && receivedReviews.length > 0 && (
              <span className="bg-cm-primary/20 text-cm-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {receivedReviews.length}
              </span>
            )}
          </button>
        </div>
      )}

      {(isLoading || receivedLoading) && (
        <div className="text-cm-primary animate-pulse text-center py-12 text-sm">
          Loading...
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === "review" && (
          <>
            {result ? (
              <SuccessView
                key="success"
                result={result}
                onReviewAnother={handleReviewAnother}
              />
            ) : selectedItem ? (
              <ReviewForm
                key="form"
                item={selectedItem}
                onBack={() => setSelectedItem(null)}
                onSuccess={handleSuccess}
              />
            ) : data ? (
              <QueueView
                key="queue"
                queue={data.queue}
                onSelect={setSelectedItem}
                categories={categoriesData || []}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            ) : null}
          </>
        )}

        {tab === "received" && receivedReviews && (
          <ReceivedReviewsView key="received" reviews={receivedReviews} />
        )}
      </AnimatePresence>
    </div>
  );
}
