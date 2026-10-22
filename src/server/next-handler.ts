/**
 * Helper serveur Next.js (App Router / Pages Router / Node.js)
 * Permet d'inspecter les certificats SSL réels via le module natif node:tls
 * sans aucune dépendance externe.
 *
 * Utilisation typique dans app/api/health-inspector/route.ts :
 * export { GET, POST } from '@parallalaxstudio/react-health-monitor/server';
 */

import tls from 'node:tls';
import { URL } from 'node:url';

export interface SslInspectionResult {
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  protocol: string;
  authorized: boolean;
  authorizationError?: string;
}

export function inspectSslCertificate(targetUrl: string, timeoutMs: number = 5000): Promise<SslInspectionResult> {
  return new Promise((resolve, reject) => {
    let host = targetUrl;
    try {
      const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      host = parsed.hostname;
    } catch {
      // Keep host as is
    }

    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol() || 'TLS 1.3';
        const authorized = socket.authorized;
        const authError = socket.authorizationError ? String(socket.authorizationError) : undefined;

        socket.end();

        if (!cert || !cert.valid_to) {
          return resolve({
            domain: host,
            issuer: 'Inconnue',
            validFrom: '',
            validTo: '',
            daysRemaining: 0,
            isExpired: true,
            isExpiringSoon: true,
            protocol,
            authorized: false,
            authorizationError: 'Aucun certificat reçu',
          });
        }

        const validTo = new Date(cert.valid_to);
        const validFrom = new Date(cert.valid_from);
        const now = new Date();
        const diffMs = validTo.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const isExpired = daysRemaining <= 0;
        const isExpiringSoon = daysRemaining <= 15;

        const rawIssuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Autorité SSL') : "Let's Encrypt";
        const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : (rawIssuer || 'Autorité SSL');

        resolve({
          domain: host,
          issuer,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining,
          isExpired,
          isExpiringSoon,
          protocol,
          authorized,
          authorizationError: authError,
        });
      }
    );

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Délai d'attente dépassé (${timeoutMs} ms) pour inspecter ${host}`));
    });
  });
}

/**
 * Gestionnaire standard pour Next.js App Router (app/api/health-inspector/route.ts)
 */
export async function createHealthInspectorHandler(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url') || url.searchParams.get('domain');

  if (!target) {
    return new Response(JSON.stringify({ error: 'Paramètre ?url= manquant' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const cert = await inspectSslCertificate(target);
    return new Response(JSON.stringify(cert), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur d\'inspection SSL';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
