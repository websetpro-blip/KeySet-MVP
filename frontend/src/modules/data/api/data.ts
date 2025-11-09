const BASE_URL = '/api/data';

export interface FrequencyRowDto {
  id: number;
  phrase: string;
  ws: number;
  qws: number;
  bws: number;
  region: number;
  status: string;
  group: string | null;
  updatedAt?: string | null;
}

export interface GroupRowDto {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  color: string;
  type: string;
  locked: boolean;
  comment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Data API error (${response.status})`);
  }

  return (await response.json()) as T;
}

export interface FetchPhraseParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}

export function fetchPhrases(params: FetchPhraseParams = {}): Promise<FrequencyRowDto[]> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<FrequencyRowDto[]>(`/phrases${suffix}`);
}

export function fetchGroups(): Promise<GroupRowDto[]> {
  return request<GroupRowDto[]>('/groups');
}

export interface EnqueuePhrasesPayload {
  phrases: string[];
  region?: number;
}

export function enqueuePhrases(payload: EnqueuePhrasesPayload): Promise<{ inserted: number }> {
  return request<{ inserted: number }>('/phrases/enqueue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deletePhrasesById(ids: number[]): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/phrases/delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export function clearAllPhrases(): Promise<{ status: string }> {
  return request<{ status: string }>('/phrases/clear', {
    method: 'POST',
  });
}

export function updatePhraseGroup(ids: number[], group: string | null): Promise<{ updated: number }> {
  return request<{ updated: number }>('/phrases/group', {
    method: 'POST',
    body: JSON.stringify({ ids, group }),
  });
}
