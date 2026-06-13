"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCategory } from "@/lib/categories";
import type { Entry } from "@/lib/types";

export default function ArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEntry(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <span className="text-4xl">📄</span>
        <p className="mt-3 text-sm">文章不存在</p>
      </div>
    );
  }

  const cat = getCategory(entry.category);

  return (
    <div className="mx-auto max-w-3xl">
      <a
        href="/"
        className="mb-4 inline-block text-xs text-slate-500 transition-colors hover:text-cyan-400"
      >
        ← 返回
      </a>

      <article className="glass-card overflow-hidden">
        {entry.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.imageUrl} alt={entry.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-4 sm:p-8">
          {/* Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-white/5 px-2 py-0.5 text-slate-400">
              {cat?.icon} {cat?.label}
            </span>
            <span className="text-slate-500">{entry.date}</span>
            {entry.source && (
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-cyan-400">{entry.source}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-xl font-bold text-slate-100 sm:text-2xl">{entry.title}</h1>

          {/* Summary */}
          {entry.summary && entry.summary !== entry.title && (
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{entry.summary}</p>
          )}

          {/* Article Content */}
          {entry.contentHtml ? (
            <div
              className="prose prose-invert prose-sm max-w-none sm:prose-base
                prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-cyan-400
                prose-strong:text-slate-200 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
            />
          ) : (
            <div className="rounded-lg bg-white/5 p-4 text-sm text-slate-400">
              <p>{entry.content}</p>
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-cyan-400 transition-colors hover:text-cyan-300"
                >
                  查看原文
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
