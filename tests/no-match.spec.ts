import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    ".env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되어 있어야 합니다."
  );
}

const NEVER_ID = "00000000-0000-0000-0000-000000000000";

async function rest(pathAndQuery: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${init.method ?? "GET"} ${pathAndQuery} 실패: ${res.status} ${body}`);
  }
  return res;
}

test.beforeEach(async () => {
  await rest(`matches?id=neq.${NEVER_ID}`, { method: "DELETE" });
  await rest(`seniors?id=neq.${NEVER_ID}`, { method: "DELETE" });
  await rest(`jobs?id=neq.${NEVER_ID}`, { method: "DELETE" });
});

test("매칭되는 공고가 없으면 추천 페이지에 빈 상태가 보인다", async ({ page }) => {
  await page.goto("/register");

  await page.locator("#name").fill("매칭없음시니어");

  await page.locator("#region").click();
  await page.getByRole("option", { name: "서울" }).click();

  await page.locator("#desired_job").click();
  await page.getByRole("option", { name: "경비" }).click();

  await page.locator("#career_years").fill("3");

  await page.getByRole("button", { name: "등록하기" }).click();

  await expect(page.getByText("등록이 완료")).toBeVisible();

  await page.getByRole("link", { name: "추천 일자리 보러 가기" }).click();

  await expect(page).toHaveURL(/\/recommendations\?senior_id=/);
  await expect(page.getByText("현재 매칭되는 일자리가 없습니다.")).toBeVisible();
});
