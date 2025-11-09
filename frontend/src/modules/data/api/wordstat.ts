import type { WordstatResult } from '../types';

const BASE_URL = '/api/wordstat';

export interface WordstatAccount {
  id: number;
  name: string;
  status: string;
  profilePath: string;
  proxy?: string | null;
  notes?: string | null;
}

export interface WordstatRegion {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  depth: number;
  hasChildren: boolean;
}

export interface WordstatCollectRequest {
  phrases: string[];
  regions: number[];
  profile: string | null;
  modes: {
    ws: boolean;
    qws: boolean;
    bws: boolean;
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload?.detail) {
      return typeof payload.detail === 'string'
        ? payload.detail
        : JSON.stringify(payload.detail);
    }
    return JSON.stringify(payload);
  } catch {
    try {
      return await response.text();
    } catch {
      return `Wordstat API error (${response.status})`;
    }
  }
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
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export function fetchWordstatAccounts(): Promise<WordstatAccount[]> {
  return request<WordstatAccount[]>('/accounts');
}

export function fetchWordstatRegions(): Promise<WordstatRegion[]> {
  return request<WordstatRegion[]>('/regions');
}

export function collectWordstat(payload: WordstatCollectRequest): Promise<WordstatResult[]> {
  return request<WordstatResult[]>('/collect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

