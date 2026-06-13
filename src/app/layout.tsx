import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLG手游情报与产品分析",
  description: "SLG手游行业情报采集、产品分析与深度研究平台",
  keywords: ["SLG", "手游", "游戏情报", "产品分析", "行业研究"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-100 antialiased">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0e1a]/90 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
                S
              </div>
              <div className="hidden sm:block">
                <span className="gradient-text text-base font-bold tracking-tight">SLG情报</span>
                <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500 border border-white/[0.06]">
                  BETA
                </span>
              </div>
            </a>

            {/* Nav Links */}
            <div className="flex items-center gap-1 sm:gap-3">
              <NavLink href="/" label="首页" />
              <NavLink href="/daily" label="每日简报" />
              <NavLink href="/games" label="游戏库" />
              <NavLink href="/search" label="搜索" />
              <NavLink href="/admin" label="管理" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#0a0e1a] py-6">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-cyan-500 to-purple-600 text-[10px] font-bold text-white">S</span>
                <span>SLG手游情报与产品分析</span>
                <span className="text-slate-700">|</span>
                <span>BETA v2.0</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>数据来源：公开网络采集</span>
                <span className="text-slate-700">|</span>
                <span>仅供行业研究参考</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  "use client";
  // Use a simple client component for active state
  return (
    <a
      href={href}
      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-200 sm:px-3 sm:text-sm"
    >
      {label}
    </a>
  );
}
