import type { Student, StudentCreateInput, StudentUpdateInput, ApiError } from './studentTypes';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const ROOT_URL = import.meta.env.VITE_ROOT_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected server error occurred.';
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        if (typeof errJson.detail === 'string') {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          // Format Pydantic validation errors nicely
          errorDetail = errJson.detail
            .map((e: { loc?: string[]; msg?: string }) => {
              const field = e.loc ? e.loc[e.loc.length - 1] : 'field';
              return `${field}: ${e.msg || 'invalid'}`;
            })
            .join('; ');
        }
      }
    } catch {
      errorDetail = `Request failed with status ${res.status} (${res.statusText})`;
    }
    const err: ApiError = { detail: errorDetail, status: res.status };
    throw err;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json() as Promise<T>;
}

export const studentApi = {
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await fetch(`${ROOT_URL}/health`);
    return handleResponse<{ status: string; service: string; version: string }>(res);
  },

  async list(filters?: { department?: string; year?: number }): Promise<Student[]> {
    const url = new URL(`${API_BASE}/students`);
    if (filters?.department) {
      url.searchParams.append('department', filters.department);
    }
    if (filters?.year) {
      url.searchParams.append('year', filters.year.toString());
    }
    const res = await fetch(url.toString());
    return handleResponse<Student[]>(res);
  },

  async getById(id: number): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`);
    return handleResponse<Student>(res);
  },

  async create(data: StudentCreateInput): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Student>(res);
  },

  async update(id: number, data: StudentUpdateInput): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Student>(res);
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};
