export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export interface CertificateCheck {
  name: string;
  url: string;
  issuer?: string;
  protocol?: string;
  expiresInDays?: number;
  alertDaysBefore?: number;
  status?: 'valid' | 'expiring_soon' | 'expired' | 'error';
  sslLabsUrl?: string;
}

export interface EndpointCheck {
  name: string;
  url: string;
  method?: HttpMethod;
  role?: string;
  expectedStatus?: number;
  maxAcceptableMs?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface EndpointTestResult {
  url: string;
  method: HttpMethod;
  status: number;
  latencyMs: number;
  ok: boolean;
  verdict: string;
  testedAt: Date;
  error?: string;
}

export interface BenchmarkMetrics {
  minMs: number;
  avgMs: number;
  maxMs: number;
  lossPercent: number;
  totalPings: number;
  status: 'ideal' | 'good' | 'acceptable' | 'slow' | 'down';
  verdictLabel: string;
  humanInterpretation: string;
}

export interface DatabaseHealthInfo {
  name?: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latencyMs?: number;
  poolUsage?: string;
  version?: string;
}

export interface HealthMonitorConfig {
  title?: string;
  subtitle?: string;
  certificates?: CertificateCheck[];
  endpoints?: EndpointCheck[];
  database?: DatabaseHealthInfo;
  uptimePercent30d?: number;
  enableLiveBenchmark?: boolean;
  benchmarkEndpointUrl?: string;
  inspectorApiRoute?: string;
  theme?: 'dark' | 'light' | 'auto';
  onTestComplete?: (result: EndpointTestResult) => void;
  onBenchmarkComplete?: (metrics: BenchmarkMetrics) => void;
}
