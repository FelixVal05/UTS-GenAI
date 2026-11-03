const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface CreateSessionParams {
  scenario: string;
  persona?: 'ramah' | 'netral' | 'tegas';
  language?: 'id' | 'en';
  github?: string;
  job_url?: string;
  job_text?: string;
  cv?: File | null;
}

export interface BackendSession {
  id: string;
  scenario: string;
  persona: string;
  language: string;
  status: string;
  cv_chars?: number;
  job_chars?: number;
  plan?: BackendPlan | null;
  report?: BackendReport | null;
  turns?: BackendTurn[];
  created_at?: string;
  overall_score?: number | null;
}

export interface BackendPlan {
  candidate_summary?: string;
  skill_gaps?: {
    requirement: string;
    level: 'wajib' | 'nilai_tambah' | string;
    status: 'terbukti' | 'sebagian' | 'belum_terbukti' | string;
    evidence: string;
  }[];
  claims?: {
    claim: string;
    status: 'match' | 'mismatch' | 'unverified' | string;
    evidence: string;
  }[];
  topics?: {
    topic: string;
    goal: string;
    questions: string[];
  }[];
  probing?: string[];
  github?: {
    found: boolean;
    users?: string[];
    repos?: {
      name: string;
      description: string | null;
      languages: string[];
      main_language: string | null;
      stars: number;
      is_fork: boolean;
      last_push: string;
      readme_excerpt?: string;
    }[];
    errors?: string[];
  };
  job?: {
    title?: string;
    company?: string;
    must_have?: string[];
    nice_to_have?: string[];
    tech_stack?: string[];
    responsibilities?: string[];
    error?: string;
  };
  semantic_match_score?: number | null;
  planner_llm?: string;
  error?: string;
}

export interface BackendTurn {
  id?: number;
  role: 'user' | 'ai';
  text: string;
  audio_seconds?: number | null;
  metrics?: {
    words?: any[];
    acoustic_silence_ratio?: number | null;
    voice_tone?: {
      label: string;
      score?: number;
      model?: string;
    } | null;
  } | null;
  latency_ms?: {
    stt_ms: number;
    llm_ms: number;
    tts_ms: number;
  };
}

export interface BackendReport {
  overall_score: number;
  scores: {
    relevansi?: number;
    struktur_star?: number;
    kejelasan?: number;
    kedalaman?: number;
    ketepatan_teknis?: number | null;
  };
  strengths: string[];
  weaknesses: string[];
  per_answer: {
    question: string;
    answer_summary: string;
    star: {
      situation: boolean;
      task: boolean;
      action: boolean;
      result: boolean;
    };
    feedback: string;
    better_answer?: string;
  }[];
  recommendations: string[];
  delivery?: {
    overall?: {
      total_words?: number;
      speaking_seconds?: number;
      wpm?: number;
      pause_pct?: number;
      long_pause_count?: number;
      longest_pause?: number;
      avg_start_delay?: number;
      fillers?: number;
      acoustic_silence_ratio?: number;
      silence_source?: string;
      voice_tone_indicator?: {
        label: string;
        model?: string;
      };
    };
    flags?: string[];
    voice_tone_indicator?: {
      label: string;
      model?: string;
    };
  };
  semantic_relevance_score?: number | null;
  evaluator_llm?: string;
}

export async function createSession(params: CreateSessionParams): Promise<BackendSession> {
  const fd = new FormData();
  fd.append('scenario', params.scenario);
  fd.append('persona', params.persona || 'netral');
  fd.append('language', params.language || 'id');
  if (params.github) fd.append('github', params.github);
  if (params.job_url) fd.append('job_url', params.job_url);
  if (params.job_text) fd.append('job_text', params.job_text);
  if (params.cv) fd.append('cv', params.cv);

  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function getSession(sessionId: string): Promise<BackendSession> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId.trim()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function makePlan(sessionId: string): Promise<BackendPlan> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId.trim()}/plan`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function listSessions(): Promise<BackendSession[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function startInterview(
  sessionId: string,
  audio: boolean = true
): Promise<{
  ai_text: string;
  ai_audio_b64: string | null;
  llm_provider: string;
  finished: boolean;
}> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId.trim()}/start?audio=${audio}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function submitTurn(
  sessionId: string,
  audioBlob: Blob,
  audio: boolean = true,
  filename: string = 'audio.webm'
): Promise<{
  user_text: string;
  ai_text: string;
  ai_audio_b64: string | null;
  llm_provider: string;
  finished: boolean;
  latency_ms?: {
    stt_ms: number;
    llm_ms: number;
    tts_ms: number;
  };
}> {
  const fd = new FormData();
  fd.append('file', audioBlob, filename);

  const res = await fetch(`${API_BASE}/sessions/${sessionId.trim()}/turn?audio=${audio}`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export async function finishInterview(
  sessionId: string,
  refresh: boolean = false
): Promise<BackendReport> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId.trim()}/finish?refresh=${refresh}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

