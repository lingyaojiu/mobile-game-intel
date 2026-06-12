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
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  summary?: string;
  source?: string;
  imageUrl?: string;
  link?: string;
}
