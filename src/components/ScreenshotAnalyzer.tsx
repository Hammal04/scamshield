import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2, FileImage } from 'lucide-react';
import { analyzeImage } from '../api';
import type { AnalysisResult } from '../types';
import { addToHistory } from '../history';

interface ScreenshotAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

const loadingMessages = [
  'Reading screenshot...',
  'Checking suspicious patterns...',
  'Preparing risk assessment...',
];

export default function ScreenshotAnalyzer({ onResult }: ScreenshotAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Invalid file format. Supported: PNG, JPG, WEBP.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Image too large. Maximum size is 10 MB.');
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a screenshot to analyze.');
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingIdx(0);

    const interval = setInterval(() => {
      setLoadingIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    try {
      const result = await analyzeImage(file);
      addToHistory('image', result);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-accent-500 bg-accent-500/10 scale-[1.01]'
              : 'border-navy-600 hover:border-accent-500/50 hover:bg-navy-800/30'
          }`}
          aria-label="Upload screenshot by clicking or dragging"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
            aria-label="File input"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-accent-400" />
            </div>
            <div>
              <p className="text-white font-medium">Drop a screenshot here, or click to browse</p>
              <p className="text-sm text-navy-400 mt-1">PNG, JPG, or WEBP — max 10 MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-navy-700 bg-navy-900">
            <img src={preview} alt="Screenshot preview" className="w-full max-h-80 object-contain" />
            <button
              onClick={removeFile}
              disabled={loading}
              className="absolute top-3 right-3 p-2 rounded-lg bg-navy-900/80 backdrop-blur-sm text-white hover:bg-red-500/80 transition-all disabled:opacity-50"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-300">
            <FileImage className="w-4 h-4 text-accent-400" />
            <span className="truncate">{file?.name}</span>
            {file && <span className="text-navy-500">({(file.size / 1024).toFixed(0)} KB)</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {preview && (
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingMessages[loadingIdx]}
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              Analyze Screenshot
            </>
          )}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-navy-700" />
            <div className="absolute inset-0 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
