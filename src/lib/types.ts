export interface Entry {
  id: number;
  date: string;
  category: string;
  title: string;
  content: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  date: string;
  category: string;
  title: string;
  content: string;
  source?: string;
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  source?: string;
}
