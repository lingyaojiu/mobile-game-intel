"use client";

import { useEffect, useState } from "react";
import type { DailyReportData } from "@/lib/types";

export default function DailyBriefPage() {
  const [reports, setReports] = useState<DailyReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/daily");
        if (res.ok) {
          const data = await res.json();
          setReports(data.items || data);
          if (data.items?.length > 0) {
            setSelectedReport(data.items[0]);
          }
        }
      } catch (err) {
        console.error("加载每日简报失败:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">每日简报</h1>
        <p className="mt-1 text-sm text-slate-500">每日SLG行业情报精选汇总</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-sm">暂无每日简报</p>
          <p className="mt-1 text-xs text-slate-700">每日采集完成后会自动生成简报</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 简报列表 */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">历史简报</h2>
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left glass-card p-3 transition-all ${
                  selectedReport?.id === report.id
                    ? "border-cyan-500/30 bg-cyan-500/5"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <div className="text-sm font-medium text-slate-200">{report.title}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                  <span>{report.date}</span>
                  <span>·</span>
                  <span>{report.articleCount} 篇文章</span>
                  <span>·</span>
                  <span className={report.status === "published" ? "text-emerald-500" : "text-amber-500"}>
                    {report.status === "published" ? "已发布" : "草稿"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* 简报详情 */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="glass-card-strong p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-100">{selectedReport.title}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>{selectedReport.date}</span>
                    <span>·</span>
                    <span>{selectedReport.articleCount} 篇文章</span>
                  </div>
                </div>
                {selectedReport.content ? (
                  <div className="article-content">
                    {selectedReport.content.split("\n").map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      return <p key={i} className="mb-3 text-sm leading-relaxed text-slate-400">{trimmed}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">简报内容生成中...</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-600">
                <p className="text-sm">选择一个简报查看详情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
