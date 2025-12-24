export type Language = 'en' | 'zh';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectionResult {
  found: boolean;
  gridSize: {
    rows: number;
    cols: number;
  };
  anomalyPosition?: {
    row: number; // 1-based index
    col: number; // 1-based index
  };
  boundingBox?: BoundingBox; // 0-1000 scale
  description: string;
  reason: string;
  confidence: number; // 0.0 to 1.0
  suggestion?: string; // analysis suggestion
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageSrc: string; // output/result image
  originalImageSrc?: string; // original input image (for custom entries)
  result: DetectionResult | null; // null if error or processing
  status: 'success' | 'error' | 'processing';
  zoomImageSrc?: string; // optional zoomed view image from preset
  duration?: number; // analysis duration in milliseconds
  customLogs?: LogEntry[]; // custom log entries for manual input
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  FINISHED = 'FINISHED' // Queue finished
}

export interface PresetMapping {
  id: string;
  inputImageSrc: string;  // base64 of input image
  outputImageSrc: string; // base64 of result image
  reason: string;
  found: boolean;         // true = anomaly found, false = perfect
  confidence?: number;    // 0.0 to 1.0, default 1.0
  zoomImageSrc?: string;  // optional zoomed view image
  createdAt: number;
}