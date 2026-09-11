import type { AnalysisResult } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(res: Response): Promise<AnalysisResult> {
  if (!res.ok) {
    let detail = 'An error occurred during analysis.';
    try {
      const error = await res.json();
      detail = error.detail || detail;
    } catch {
      // ignore parse error
    }

    if (res.status === 429) detail = 'Rate limit reached. Please wait a moment and try again.';
    if (res.status === 503) detail = 'AI service is not configured. Check that the backend has a valid Groq API key.';
    if (res.status === 502) detail = 'The AI service is temporarily unavailable. Please try again.';

    throw new Error(detail);
  }
  return res.json();
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/analyze/image`, {
    method: 'POST',
    body: formData,
  // Don't set Content-Type — browser sets it with boundary for FormData
  });
  return handleResponse(res);
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return handleResponse(res);
}

export async function checkHealth(): Promise<{ status: string; groq_configured: boolean; model: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend unavailable');
  return res.json();
}
