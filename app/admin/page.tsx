import { JobsManager } from "./jobs-manager";
import { SeniorsDashboard } from "./seniors-dashboard";

export default function AdminPage() {
  return (
    <section className="space-y-12 py-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">담당자 대시보드</h1>
        <p className="text-xl text-muted-foreground">
          시니어의 매칭 상태를 한눈에 확인하고, 일자리를 관리합니다.
        </p>
      </header>

      <SeniorsDashboard />
      <JobsManager />
    </section>
  );
}
