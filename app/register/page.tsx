"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { JOB_TYPES, REGIONS } from "@/lib/constants";
import { recomputeForSenior } from "@/lib/matching";

type Status = "idle" | "saving" | "success" | "error";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [desiredJob, setDesiredJob] = useState("");
  const [careerYears, setCareerYears] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedSeniorId, setSavedSeniorId] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setRegion("");
    setDesiredJob("");
    setCareerYears("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !region || !desiredJob) {
      setStatus("error");
      setErrorMsg("이름, 지역, 희망 직종은 반드시 입력해 주세요.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    const { data, error } = await supabase
      .from("seniors")
      .insert({
        name: name.trim(),
        region,
        desired_job: desiredJob,
        career_years: careerYears === "" ? 0 : Number(careerYears),
      })
      .select("id")
      .single();

    if (error || !data) {
      setStatus("error");
      setErrorMsg(`저장에 실패했습니다: ${error?.message ?? "알 수 없는 오류"}`);
      return;
    }

    await recomputeForSenior(data.id);

    setSavedSeniorId(data.id);
    setStatus("success");
    resetForm();
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">시니어 프로필 등록</h1>
        <p className="text-xl text-muted-foreground">
          아래 항목을 채워주시면 잘 맞는 일자리를 자동으로 찾아드려요.
        </p>
      </header>

      {status === "success" && (
        <div
          role="status"
          className="space-y-4 rounded-md border-2 border-green-700 bg-green-50 p-5 text-green-800"
        >
          <p className="text-xl font-semibold">등록이 완료되었습니다.</p>
          {savedSeniorId && (
            <Link
              href={`/recommendations?senior_id=${savedSeniorId}`}
              className={cn(buttonVariants({ variant: "default" }), "h-12 px-5 text-lg")}
            >
              추천 일자리 보러 가기
            </Link>
          )}
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="rounded-md border-2 border-red-700 bg-red-50 p-5 text-xl font-semibold text-red-800"
        >
          {errorMsg}
        </div>
      )}

      <Card className="border-2">
        <CardContent className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">
                이름 <span className="text-red-700">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-lg">
                지역 <span className="text-red-700">*</span>
              </Label>
              <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
                <SelectTrigger id="region" className="!h-12 w-full text-lg">
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-lg">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_job" className="text-lg">
                희망 직종 <span className="text-red-700">*</span>
              </Label>
              <Select value={desiredJob} onValueChange={(v) => setDesiredJob(v ?? "")}>
                <SelectTrigger id="desired_job" className="!h-12 w-full text-lg">
                  <SelectValue placeholder="희망 직종을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((j) => (
                    <SelectItem key={j} value={j} className="text-lg">
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="career_years" className="text-lg">
                경력 (년)
              </Label>
              <Input
                id="career_years"
                type="number"
                min={0}
                value={careerYears}
                onChange={(e) => setCareerYears(e.target.value)}
                placeholder="0"
                className="h-12 text-lg"
              />
            </div>

            <Button
              type="submit"
              className="h-14 w-full text-xl"
              disabled={status === "saving"}
            >
              {status === "saving" ? "저장 중..." : "등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
