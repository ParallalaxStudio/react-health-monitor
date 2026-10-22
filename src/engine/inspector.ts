import { BenchmarkMetrics, EndpointCheck, EndpointTestResult } from '../types.js';

export function interpretLatency(avgMs: number, lossPercent: number = 0): {
  status: BenchmarkMetrics['status'];
  label: string;
  interpretation: string;
} {
  if (lossPercent > 50) {
    return {
      status: 'down',
      label: 'Service indisponible',
      interpretation: 'Plus de 50% des requêtes ont échoué. Le service API ou le serveur semble hors ligne.',
    };
  }

  if (avgMs < 50) {
    return {
      status: 'ideal',
      label: 'Ultra-rapide (Idéal)',
      interpretation: `Temps moyen de ${Math.round(avgMs)} ms. Exceptionnel ! Les requêtes sont traitées instantanément en mémoire vive (cache mémoire / runtime optimisé). Aucun goulot d'étranglement.`,
    };
  }

  if (avgMs < 150) {
    return {
      status: 'good',
      label: 'Très Bon',
      interpretation: `Temps moyen de ${Math.round(avgMs)} ms. Performance optimale pour des requêtes calculées avec persistance base de données.`,
    };
  }

  if (avgMs < 400) {
    return {
      status: 'acceptable',
      label: 'Acceptable',
      interpretation: `Temps moyen de ${Math.round(avgMs)} ms. Temps de réponse correct sur réseau mobile ou pour des opérations volumineuses.`,
    };
  }

  return {
    status: 'slow',
    label: 'À surveiller',
    interpretation: `Temps moyen de ${Math.round(avgMs)} ms supérieur au seuil recommandé (400 ms). Vérifiez les requêtes de base de données non indexées ou la charge serveur.`,
  };
}

export async function pingEndpoint(endpoint: EndpointCheck): Promise<EndpointTestResult> {
  const method = endpoint.method || 'GET';
  const start = performance.now();

  try {
    const response = await fetch(endpoint.url, {
      method,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(endpoint.headers || {}),
      },
      body: method !== 'GET' && method !== 'HEAD' && endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      cache: 'no-store',
    });

    const latencyMs = Math.round(performance.now() - start);
    const expected = endpoint.expectedStatus || 200;
    const ok = response.status === expected;

    let verdict = '✓ Impeccable';
    if (!ok) {
      verdict = `⚠️ Statut ${response.status} (attendu ${expected})`;
    } else if (endpoint.maxAcceptableMs && latencyMs > endpoint.maxAcceptableMs) {
      verdict = `⚠️ Latence élevée (${latencyMs} ms)`;
    }

    return {
      url: endpoint.url,
      method,
      status: response.status,
      latencyMs,
      ok,
      verdict,
      testedAt: new Date(),
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const errorMsg = err instanceof Error ? err.message : 'Erreur réseau inconnue';

    return {
      url: endpoint.url,
      method,
      status: 0,
      latencyMs,
      ok: false,
      verdict: '✕ Échec de connexion',
      error: errorMsg,
      testedAt: new Date(),
    };
  }
}

export async function runBenchmark(
  url: string,
  pingsCount: number = 10,
  onProgress?: (percent: number, currentMs: number) => void
): Promise<BenchmarkMetrics> {
  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < pingsCount; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      const duration = Math.max(1, Math.round(performance.now() - start));
      if (!res.ok && res.status >= 500) {
        failures++;
      } else {
        latencies.push(duration);
      }
      if (onProgress) {
        onProgress(Math.round(((i + 1) / pingsCount) * 100), duration);
      }
    } catch {
      failures++;
      if (onProgress) {
        onProgress(Math.round(((i + 1) / pingsCount) * 100), 0);
      }
    }
    // Micro-delay between pings
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  const lossPercent = Math.round((failures / pingsCount) * 100);
  const minMs = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxMs = latencies.length > 0 ? Math.max(...latencies) : 0;
  const avgMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((acc, curr) => acc + curr, 0) / latencies.length)
      : 0;

  const evaluation = interpretLatency(avgMs, lossPercent);

  return {
    minMs,
    avgMs,
    maxMs,
    lossPercent,
    totalPings: pingsCount,
    status: evaluation.status,
    verdictLabel: evaluation.label,
    humanInterpretation: evaluation.interpretation,
  };
}
