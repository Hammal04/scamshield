export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MessageCategory = 'scam' | 'promotional' | 'general';
export type AnalysisType = 'text' | 'image' | 'url' | 'number';

export interface RedFlag {
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface LinkAnalysis {
  url: string;
  visited: boolean;
  original_domain: string | null;
  final_url: string | null;
  final_domain: string | null;
  redirected: boolean;
  redirect_count: number;
  domain_changed: boolean;
  domain_match: boolean | null;
  website_title: string | null;
  visible_text: string | null;
  page_indicators: string[];
  status: 'likely_safe' | 'suspicious' | 'likely_malicious' | 'unable_to_verify';
  reason: string;
  http_status: number | null;
}

export interface NumberIndicator { title: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; explanation: string; }

export interface NumberAnalysisResult {
  number: string; normalized_number: string; national_format: string; country: string; region_code: string | null; carrier: string; number_type: string; valid: boolean; risk_score: number; risk_level: RiskLevel; status: 'likely_safe' | 'suspicious' | 'likely_malicious'; verdict: string; indicators: NumberIndicator[]; recommendation: string; database_match: boolean;
}

export interface AnalysisResult {
  category: MessageCategory;
  risk_score: number;
  risk_level: RiskLevel;
  overview: string;
  indicators: string[];
  links: LinkAnalysis[];
  recommendation: string;
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
  overview: string;
  indicators: string[];
  links: LinkAnalysis[];
  recommendation: string;
  verdict: string;
  result: AnalysisResult;
}

export type AnalysisTab = 'message' | 'screenshot' | 'url' | 'number';
export type View = 'analyze' | 'history' | 'about';
