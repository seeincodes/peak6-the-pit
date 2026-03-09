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
    <div className="rounded-md border border-cm-border bg-cm-card p-4">
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
          className="px-6 py-2 rounded-md bg-cm-cyan/20 border border-cm-cyan/50 text-cm-cyan font-semibold text-sm hover:bg-cm-cyan/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
        >
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
