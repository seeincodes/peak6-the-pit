import DailyChallengeCard from "../components/DailyChallengeCard";
import CategoryProgress from "../components/CategoryProgress";
import PerformanceCharts from "../components/charts/PerformanceCharts";

export default function ProgressPage() {
  return (
    <div className="cm-page max-w-3xl space-y-6">
      <h2 className="cm-title">My Progress</h2>
      <DailyChallengeCard />
      <CategoryProgress />
      <PerformanceCharts />
    </div>
  );
}
