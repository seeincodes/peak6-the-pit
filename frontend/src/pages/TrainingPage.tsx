export default function TrainingPage({
  unlockedCategories,
}: {
  unlockedCategories: { category: string; difficulty: string }[];
}) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-cm-text mb-4">Training</h2>
      <p className="text-cm-muted">Select a scenario to begin training.</p>
    </div>
  );
}
