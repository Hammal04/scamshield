export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AnalysisType = 'text' | 'image' | 'url';

export interface RedFlag {
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: RiskLevel;
  verdict: string;
  summary: string;
  red_flags: RedFlag[];
  recommendations: string[];
  detected_language: string | null;
  analysis_type: AnalysisType;
  input_preview: string | null;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  type: AnalysisType;
  title: string;
  risk_score: number;
  risk_level: RiskLevel;
  verdict: string;
  result: AnalysisResult;
}

export type AnalysisTab = 'message' | 'screenshot' | 'url';
export type View = 'analyze' | 'history' | 'about';
