export interface Student {
  id: number;
  name: string;
  roll_number: string;
  department: string;
  year: number;
  avatar_url?: string | null;
  skills: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  version?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentCreateInput {
  name: string;
  roll_number: string;
  department: string;
  year: number;
  avatar_url?: string | null;
  skills?: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
}

export interface StudentUpdateInput {
  name?: string;
  roll_number?: string;
  department?: string;
  year?: number;
  avatar_url?: string | null;
  skills?: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  version?: number;
}

export interface StudentListFilters {
  department?: string;
  year?: number;
  q?: string;
  skip?: number;
  limit?: number;
}

export interface StudentListResult {
  items: Student[];
  totalCount: number;
}

export interface ApiError {
  detail: string;
  status?: number;
}
