import { useState } from "react";

interface ResponseInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function ResponseInput({ onSubmit, placeholder, loading }: ResponseInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && !loading) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <div className="cm-surface p-4">
      <label htmlFor="response-input" className="sr-only">Your analysis</label>
      <textarea
        id="response-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || "Type your analysis..."}
        className="w-full h-32 bg-transparent text-cm-text placeholder-cm-muted resize-none outline-none text-sm leading-relaxed focus-ring"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleSubmit();
        }}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-cm-muted text-xs">Cmd+Enter to submit</span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="cm-btn-primary px-6 py-2"
        >
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-lg bg-cm-primary/5 border border-cm-primary/20 animate-pulse">
          <div className="w-5 h-5 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
          <span className="text-sm text-cm-primary">AI is analyzing your response...</span>
        </div>
      )}
    </div>
  );
}
