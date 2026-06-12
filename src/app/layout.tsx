import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "手游情报每日收集",
  description: "每日收集、整理和查阅手游情报",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span className="gradient-text text-lg font-bold">手游情报</span>
            </a>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="/"
                className="text-slate-300 transition-colors hover:text-cyan-400"
              >
                今日情报
              </a>
              <a
                href="/history"
                className="text-slate-300 transition-colors hover:text-cyan-400"
              >
                历史记录
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
