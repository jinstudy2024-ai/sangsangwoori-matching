import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "상상우리 시니어 일자리 매칭",
  description: "시니어와 일자리를 자동으로 연결합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-lg">
        <header className="border-b-2 border-border">
          <nav className="mx-auto flex w-full max-w-5xl items-center gap-6 p-6">
            <Link href="/" className="text-2xl font-bold">
              상상우리 매칭
            </Link>
            <div className="ml-auto flex gap-2">
              <Link href="/register" className="px-4 py-2 text-lg hover:underline">
                시니어 등록
              </Link>
              <Link href="/recommendations" className="px-4 py-2 text-lg hover:underline">
                추천 목록
              </Link>
              <Link href="/admin" className="px-4 py-2 text-lg hover:underline">
                담당자
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
