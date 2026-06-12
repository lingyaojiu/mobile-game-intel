import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "手游情报每日收集",
  description: "每日收集、整理和查阅手游情报",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
            <a href="/" className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl">🎮</span>
              <span className="gradient-text text-sm font-bold sm:text-lg">手游情报</span>
            </a>
            <div className="flex items-center gap-4 text-xs sm:gap-6 sm:text-sm">
              <a href="/" className="text-slate-300 transition-colors hover:text-cyan-400">今日情报</a>
              <a href="/history" className="text-slate-300 transition-colors hover:text-cyan-400">历史记录</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
