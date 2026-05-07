import { supabase } from "@/lib/supabase";

export type Senior = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
};

export type Job = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
};

export type MatchStatus = "pending" | "assigned" | "done";

export function score(senior: Senior, job: Job): number {
  let s = 0;
  if (senior.region === job.region) s += 3;
  if (senior.desired_job === job.job_type) s += 2;
  if (senior.career_years >= job.required_career) s += 1;
  return s;
}

async function fallbackRecomputeForSenior(seniorId: string): Promise<void> {
  const [{ data: senior }, { data: jobs }, { data: existing }] = await Promise.all([
    supabase.from("seniors").select("id, name, region, desired_job, career_years").eq("id", seniorId).single(),
    supabase.from("jobs").select("id, title, region, job_type, required_career"),
    supabase.from("matches").select("id, job_id").eq("senior_id", seniorId),
  ]);
  if (!senior || !jobs) return;

  const existingByJob = new Map((existing ?? []).map((m) => [m.job_id, m.id]));

  for (const job of jobs) {
    const sc = score(senior as Senior, job as Job);
    const existingId = existingByJob.get(job.id);
    if (sc > 0) {
      if (existingId) {
        await supabase.from("matches").update({ score: sc }).eq("id", existingId);
      } else {
        await supabase.from("matches").insert({
          senior_id: seniorId,
          job_id: job.id,
          score: sc,
          status: "pending",
        });
      }
    } else if (existingId) {
      await supabase.from("matches").delete().eq("id", existingId);
    }
  }
}

async function fallbackRecomputeForJob(jobId: string): Promise<void> {
  const [{ data: job }, { data: seniors }, { data: existing }] = await Promise.all([
    supabase.from("jobs").select("id, title, region, job_type, required_career").eq("id", jobId).single(),
    supabase.from("seniors").select("id, name, region, desired_job, career_years"),
    supabase.from("matches").select("id, senior_id").eq("job_id", jobId),
  ]);
  if (!job || !seniors) return;

  const existingBySenior = new Map((existing ?? []).map((m) => [m.senior_id, m.id]));

  for (const senior of seniors) {
    const sc = score(senior as Senior, job as Job);
    const existingId = existingBySenior.get(senior.id);
    if (sc > 0) {
      if (existingId) {
        await supabase.from("matches").update({ score: sc }).eq("id", existingId);
      } else {
        await supabase.from("matches").insert({
          senior_id: senior.id,
          job_id: jobId,
          score: sc,
          status: "pending",
        });
      }
    } else if (existingId) {
      await supabase.from("matches").delete().eq("id", existingId);
    }
  }
}

export async function recomputeForSenior(seniorId: string): Promise<void> {
  const { error } = await supabase.rpc("recompute_matches_for_senior", {
    p_senior_id: seniorId,
  });
  if (error) {
    console.warn("[matching] RPC failed, falling back to client compute:", error.message);
    await fallbackRecomputeForSenior(seniorId);
  }
}

export async function recomputeForJob(jobId: string): Promise<void> {
  const { error } = await supabase.rpc("recompute_matches_for_job", {
    p_job_id: jobId,
  });
  if (error) {
    console.warn("[matching] RPC failed, falling back to client compute:", error.message);
    await fallbackRecomputeForJob(jobId);
  }
}
