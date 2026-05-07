import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const tiles = [
  {
    href: "/register",
    title: "시니어 프로필 등록",
    desc: "이름, 지역, 희망 직종, 경력을 입력해 주세요.",
  },
  {
    href: "/recommendations",
    title: "추천 일자리 보기",
    desc: "조건이 맞는 일자리를 점수가 높은 순으로 보여드려요.",
  },
  {
    href: "/admin",
    title: "담당자 대시보드",
    desc: "미매칭, 매칭 대기, 배정 완료를 한눈에 봅니다.",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-8 py-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          시니어와 일자리를 자동으로 연결합니다
        </h1>
        <p className="text-xl text-muted-foreground">
          프로필을 등록하면 규칙 기반으로 잘 맞는 일자리를 추천해 드립니다.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="h-full border-2 transition-colors group-hover:border-foreground">
              <CardContent className="space-y-3 p-6">
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription className="text-lg">{t.desc}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
