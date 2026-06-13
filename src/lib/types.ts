export interface Entry {
  id: number;
  date: string;
  category: string;
  title: string;
  content: string;
  summary: string | null;
  source: string | null;
  imageUrl: string | null;
  link: string | null;
  contentHtml: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  date: string;
  category: string;
  title: string;
  content: string;
  summary?: string;
  source?: string;
  imageUrl?: string;
  link?: string;
  contentHtml?: string;
  publishedAt?: string;
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  summary?: string;
  source?: string;
  imageUrl?: string;
  link?: string;
  contentHtml?: string;
  publishedAt?: string;
}
