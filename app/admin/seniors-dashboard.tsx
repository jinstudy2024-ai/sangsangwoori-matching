"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type Senior = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
};

type Match = {
  senior_id: string;
  score: number;
  status: "pending" | "assigned" | "done";
};

type SeniorBucket = "unmatched" | "pending" | "assigned";

type Row = {
  senior: Senior;
  maxScore: number | null;
  bucket: SeniorBucket;
};

function deriveBucket(matches: Match[]): SeniorBucket {
  if (matches.length === 0) return "unmatched";
  if (matches.some((m) => m.status === "assigned" || m.status === "done")) return "assigned";
  return "pending";
}

function StatusBadge({ bucket }: { bucket: SeniorBucket }) {
  if (bucket === "assigned") {
    return (
      <Badge className="border-2 border-blue-700 bg-blue-100 text-base text-blue-900 px-3 py-1">
        배정 완료
      </Badge>
    );
  }
  if (bucket === "pending") {
    return (
      <Badge className="border-2 border-amber-600 bg-amber-100 text-base text-amber-900 px-3 py-1">
        매칭 대기
      </Badge>
    );
  }
  return (
    <Badge className="border-2 border-gray-400 bg-gray-100 text-base text-gray-700 px-3 py-1">
      미매칭
    </Badge>
  );
}

export function SeniorsDashboard() {
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [seniorsRes, matchesRes] = await Promise.all([
      supabase
        .from("seniors")
        .select("id, name, region, desired_job, career_years")
        .order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("senior_id, score, status")
        .gt("score", 0),
    ]);
    if (seniorsRes.error || matchesRes.error) {
      setError(seniorsRes.error?.message ?? matchesRes.error?.message ?? "");
      setSeniors([]);
      setMatches([]);
    } else {
      setError("");
      setSeniors((seniorsRes.data ?? []) as Senior[]);
      setMatches((matchesRes.data ?? []) as Match[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rows: Row[] = useMemo(() => {
    const bySenior = new Map<string, Match[]>();
    for (const m of matches) {
      if (!bySenior.has(m.senior_id)) bySenior.set(m.senior_id, []);
      bySenior.get(m.senior_id)!.push(m);
    }
    return seniors.map((s) => {
      const ms = bySenior.get(s.id) ?? [];
      const maxScore = ms.length === 0 ? null : Math.max(...ms.map((m) => m.score));
      return { senior: s, maxScore, bucket: deriveBucket(ms) };
    });
  }, [seniors, matches]);

  const counts = useMemo(() => {
    const c = { unmatched: 0, pending: 0, assigned: 0 };
    for (const r of rows) c[r.bucket]++;
    return c;
  }, [rows]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">매칭 현황</h2>
          <p className="text-lg text-muted-foreground">
            등록된 시니어의 매칭 상태를 한눈에 봅니다.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 text-base"
          onClick={fetchAll}
          disabled={loading}
        >
          {loading ? "불러오는 중..." : "새로고침"}
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border-2 border-red-700 bg-red-50 p-4 text-lg font-semibold text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="미매칭" value={counts.unmatched} desc="아직 매칭되지 않은 시니어" tone="gray" Icon={UserX} />
        <StatCard label="매칭 대기" value={counts.pending} desc="추천은 있으나 배정 전" tone="amber" Icon={Clock} />
        <StatCard label="배정 완료" value={counts.assigned} desc="일자리에 배정된 시니어" tone="blue" Icon={CheckCircle2} />
      </div>

      <Card className="border-2">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg">이름</TableHead>
                <TableHead className="text-lg">지역</TableHead>
                <TableHead className="text-lg">희망 직종</TableHead>
                <TableHead className="text-lg">최고 매칭 점수</TableHead>
                <TableHead className="text-lg">상태</TableHead>
                <TableHead className="text-right text-lg">상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-lg text-muted-foreground">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-lg text-muted-foreground">
                    아직 등록된 시니어가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ senior, maxScore, bucket }) => (
                  <TableRow key={senior.id}>
                    <TableCell className="text-lg font-medium">{senior.name}</TableCell>
                    <TableCell className="text-lg">{senior.region}</TableCell>
                    <TableCell className="text-lg">{senior.desired_job}</TableCell>
                    <TableCell className="text-lg">
                      {maxScore === null ? "-" : `${maxScore}점`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge bucket={bucket} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/recommendations?senior_id=${senior.id}`}
                        className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4 text-base")}
                      >
                        상세 보기
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function StatCard({
  label,
  value,
  desc,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  desc: string;
  tone: "gray" | "amber" | "blue";
  Icon: LucideIcon;
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-700 bg-blue-50"
      : tone === "amber"
      ? "border-amber-600 bg-amber-50"
      : "border-gray-400 bg-gray-50";
  const iconClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "amber"
      ? "text-amber-700"
      : "text-gray-600";
  return (
    <Card className={`border-2 ${toneClass}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Icon className={`h-7 w-7 ${iconClass}`} aria-hidden />
          <p className="text-lg font-semibold">{label}</p>
        </div>
        <p className="mt-2 text-5xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-base text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
