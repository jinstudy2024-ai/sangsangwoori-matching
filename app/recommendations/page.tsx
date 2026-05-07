import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type EmbeddedJob = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
};

type MatchRow = {
  id: string;
  score: number;
  status: "pending" | "assigned" | "done";
  jobs: EmbeddedJob | null;
};

function ScoreBadge({ score }: { score: number }) {
  if (score >= 6) {
    return (
      <Badge className="border-2 border-yellow-600 bg-yellow-300 text-lg text-yellow-900 px-3 py-1">
        {score}점
      </Badge>
    );
  }
  if (score >= 4) {
    return (
      <Badge className="border-2 border-green-700 bg-green-600 text-lg text-white px-3 py-1">
        {score}점
      </Badge>
    );
  }
  return (
    <Badge className="border-2 border-gray-400 bg-gray-200 text-lg text-gray-800 px-3 py-1">
      {score}점
    </Badge>
  );
}

function EmptyBox({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-md border-2 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
      <p className="text-2xl font-semibold">{title}</p>
      <div className="mt-2 text-lg text-muted-foreground">{body}</div>
    </div>
  );
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const seniorId = typeof sp.senior_id === "string" ? sp.senior_id : null;

  if (!seniorId) {
    return (
      <section className="space-y-6 py-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">추천 일자리</h1>
        </header>
        <EmptyBox
          title="시니어를 먼저 등록해 주세요."
          body={
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "default" }), "mt-4 h-12 px-5 text-lg")}
            >
              시니어 등록하러 가기
            </Link>
          }
        />
      </section>
    );
  }

  const { data: senior } = await supabase
    .from("seniors")
    .select("id, name, region, desired_job, career_years")
    .eq("id", seniorId)
    .maybeSingle();

  const { data: rawMatches, error: matchErr } = await supabase
    .from("matches")
    .select("id, score, status, jobs(id, title, region, job_type, required_career)")
    .eq("senior_id", seniorId)
    .order("score", { ascending: false });

  const matches = (rawMatches ?? []) as unknown as MatchRow[];
  const positive = matches.filter((m) => m.score > 0);

  return (
    <section className="space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">추천 일자리</h1>
        {senior ? (
          <p className="text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">{senior.name}</span>
            님 · {senior.region} · 희망 {senior.desired_job} · 경력 {senior.career_years}년
          </p>
        ) : (
          <p className="text-xl text-muted-foreground">
            등록된 시니어를 찾을 수 없습니다.
          </p>
        )}
      </header>

      {matchErr && (
        <div role="alert" className="rounded-md border-2 border-red-700 bg-red-50 p-5 text-lg font-semibold text-red-800">
          매칭을 불러오지 못했습니다: {matchErr.message}
        </div>
      )}

      {!matchErr && positive.length === 0 ? (
        <EmptyBox
          title="현재 매칭되는 일자리가 없습니다."
          body="잠시 후 새 일자리가 등록되면 자동으로 추천해 드립니다."
        />
      ) : (
        <ul className="space-y-4">
          {positive.map((m) => {
            const job = m.jobs;
            if (!job) return null;
            return (
              <li key={m.id}>
                <Card className="border-2">
                  <CardContent className="flex items-center justify-between gap-6 p-6">
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold">{job.title}</p>
                      <p className="text-lg text-muted-foreground">
                        {job.region} · {job.job_type} · 요구 경력 {job.required_career}년
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-sm text-muted-foreground">매칭 점수</p>
                      <ScoreBadge score={m.score} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
