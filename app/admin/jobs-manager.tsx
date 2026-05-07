"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { JOB_TYPES, REGIONS } from "@/lib/constants";
import { recomputeForJob } from "@/lib/matching";

type Job = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
  created_at: string;
};

type FormStatus = "idle" | "saving" | "success" | "error";

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [jobType, setJobType] = useState("");
  const [requiredCareer, setRequiredCareer] = useState("");

  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, region, job_type, required_career, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError(error.message);
      setJobs([]);
    } else {
      setLoadError("");
      setJobs((data ?? []) as Job[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function resetForm() {
    setTitle("");
    setRegion("");
    setJobType("");
    setRequiredCareer("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !region || !jobType) {
      setFormStatus("error");
      setFormError("공고명, 지역, 직종은 반드시 입력해 주세요.");
      return;
    }
    setFormStatus("saving");
    setFormError("");
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: title.trim(),
        region,
        job_type: jobType,
        required_career: requiredCareer === "" ? 0 : Number(requiredCareer),
      })
      .select("id")
      .single();
    if (error || !data) {
      setFormStatus("error");
      setFormError(`등록에 실패했습니다: ${error?.message ?? "알 수 없는 오류"}`);
      return;
    }
    await recomputeForJob(data.id);
    setFormStatus("success");
    resetForm();
    await fetchJobs();
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("이 일자리를 삭제하시겠습니까?");
    if (!ok) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      setLoadError(`삭제 실패: ${error.message}`);
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">일자리 관리</h2>
        <p className="text-lg text-muted-foreground">
          일자리를 등록하고, 등록된 목록을 관리합니다.
        </p>
      </div>

      {formStatus === "success" && (
        <div
          role="status"
          className="rounded-md border-2 border-green-700 bg-green-50 p-4 text-lg font-semibold text-green-800"
        >
          일자리를 등록했습니다.
        </div>
      )}
      {formStatus === "error" && (
        <div
          role="alert"
          className="rounded-md border-2 border-red-700 bg-red-50 p-4 text-lg font-semibold text-red-800"
        >
          {formError}
        </div>
      )}

      <Card className="border-2">
        <CardContent className="p-6">
          <form
            onSubmit={handleAdd}
            noValidate
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg">
                공고명 <span className="text-red-700">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 아파트 경비원 모집"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-region" className="text-lg">
                지역 <span className="text-red-700">*</span>
              </Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="job-region" className="!h-12 w-full text-lg">
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
              <Label htmlFor="job-type" className="text-lg">
                직종 <span className="text-red-700">*</span>
              </Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger id="job-type" className="!h-12 w-full text-lg">
                  <SelectValue placeholder="직종을 선택하세요" />
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
              <Label htmlFor="required-career" className="text-lg">
                요구 경력 (년)
              </Label>
              <Input
                id="required-career"
                type="number"
                min={0}
                value={requiredCareer}
                onChange={(e) => setRequiredCareer(e.target.value)}
                placeholder="0"
                className="h-12 text-lg"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                className="h-14 w-full text-xl"
                disabled={formStatus === "saving"}
              >
                {formStatus === "saving" ? "등록 중..." : "일자리 추가"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-2xl font-semibold">등록된 일자리</h3>
        {loadError && (
          <div
            role="alert"
            className="rounded-md border-2 border-red-700 bg-red-50 p-4 text-lg font-semibold text-red-800"
          >
            {loadError}
          </div>
        )}
        <Card className="border-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-lg">공고명</TableHead>
                  <TableHead className="text-lg">지역</TableHead>
                  <TableHead className="text-lg">직종</TableHead>
                  <TableHead className="text-lg">요구 경력</TableHead>
                  <TableHead className="text-right text-lg">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-lg text-muted-foreground">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-lg text-muted-foreground">
                      아직 등록된 일자리가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="text-lg font-medium">{job.title}</TableCell>
                      <TableCell className="text-lg">{job.region}</TableCell>
                      <TableCell className="text-lg">{job.job_type}</TableCell>
                      <TableCell className="text-lg">{job.required_career}년</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          className="h-10 text-base"
                          onClick={() => handleDelete(job.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
