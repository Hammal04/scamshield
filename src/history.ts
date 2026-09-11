import type { HistoryRecord, AnalysisResult, AnalysisType } from './types';

const STORAGE_KEY = 'scamshield_history';
const MAX_RECORDS = 50;

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage might be full or unavailable
  }
}

export function addToHistory(
  type: AnalysisType,
  result: AnalysisResult,
): HistoryRecord {
  const records = loadHistory();
  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    type,
    title: result.input_preview || `${type} analysis`,
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    verdict: result.verdict,
    result,
  };
  records.unshift(record);
  if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
  saveHistory(records);
  return record;
}

export function deleteHistoryRecord(id: string): HistoryRecord[] {
  const records = loadHistory().filter((r) => r.id !== id);
  saveHistory(records);
  return records;
}

export function clearAllHistory(): void {
  saveHistory([]);
}
