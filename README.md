# 🩺 React Health Monitor

> **Composant React & Next.js universel et autonome pour la surveillance des certificats SSL/HTTPS et le diagnostic de performance et latence d'API.**

Développé par **ParallalaxStudio**, ce composant a été conçu pour être **100% autonome et agnostique** : il s'intègre en 2 lignes de code dans n'importe quel tableau de bord administrateur (SaaS, back-office, outils internes) et ne nécessite aucun cron de surveillance complexe.

---

## 🌟 Fonctionnalités Clés

- **🔒 Surveillance SSL / HTTPS Proactive** : Affiche la validité des certificats, l'autorité émettrice (*Let's Encrypt, ZeroSSL, DigiCert...*), le protocole (*TLS 1.3*) et le décompte des jours restants avant renouvellement automatique.
- **⚡ Banc d'Essai de Latence en Direct (Benchmark)** : Lance 10 pings consécutifs avec barre de progression et calcule instantanément le minimum, la moyenne, le maximum et le taux de perte de paquets.
- **💡 Interprétation Pédagogique Intégrée** : Traduit les millisecondes brutes en explications humaines compréhensibles par les fondateurs et product managers (*< 50 ms = Ultra-rapide*, *50-150 ms = Très bon*, *> 500 ms = Attention*).
- **🎯 Test Unitaire des Endpoints Clés** : Bouton individuel pour pinger et tester une route stratégique à la demande (API, Auth JWT, Webhooks Stripe...).
- **🎨 Zéro Dépendance CSS Lourde** : Embarque ses propres styles élégants (Mode Sombre Midnight Teal & Mint), compatibles immédiatement avec ou sans Tailwind CSS.

---

## 📦 Installation

```bash
npm install @parallalaxstudio/react-health-monitor
# ou
pnpm add @parallalaxstudio/react-health-monitor
# ou
yarn add @parallalaxstudio/react-health-monitor
```

---

## 🚀 Utilisation Rapide (Quick Start)

### 1. Dans votre page Admin (React / Next.js)

```tsx
'use client';

import { HealthMonitor } from '@parallalaxstudio/react-health-monitor';

export default function AdminHealthPage() {
  return (
    <HealthMonitor
      title="Santé API, Performances & Certificats"
      subtitle="Surveillance en temps réel des infrastructures et de la latence de réponse."
      
      // 1. Liste des domaines dont vous surveillez le certificat SSL
      certificates={[
        {
          name: 'Site Public',
          url: 'https://monsite.fr',
          issuer: "Let's Encrypt Authority",
          protocol: 'TLS 1.3',
          expiresInDays: 48,
          sslLabsUrl: 'https://www.ssllabs.com/ssltest/analyze.html?d=monsite.fr',
        },
        {
          name: 'API Backend',
          url: 'https://api.monsite.fr',
          issuer: "Let's Encrypt Authority",
          protocol: 'TLS 1.3 · HTTP/3',
          expiresInDays: 48,
        },
      ]}

      // 2. Liste des routes API stratégiques à tester
      endpoints={[
        {
          name: 'Check Santé Global',
          url: '/api/health',
          method: 'GET',
          role: 'Disponibilité & Ping Base de données',
          maxAcceptableMs: 50,
        },
        {
          name: 'Ressource Métier Critique',
          url: '/api/resource',
          method: 'GET',
          role: 'Opération métier avec persistance BDD',
          maxAcceptableMs: 150,
        },
        {
          name: 'Authentification JWT',
          url: '/api/auth/login',
          method: 'POST',
          role: 'Hachage bcrypt & émission de token',
          maxAcceptableMs: 100,
        },
      ]}

      // 3. Statut de votre base de données (optionnel)
      database={{
        name: 'PostgreSQL 16',
        status: 'connected',
        latencyMs: 1.8,
        poolUsage: '4/20 connexions',
      }}

      // 4. Options
      uptimePercent30d={99.98}
      enableLiveBenchmark={true}
      benchmarkEndpointUrl="/api/health"
    />
  );
}
```

---

## 🛠️ Helper Serveur Optionnel (Next.js App Router)

Si vous souhaitez inspecter dynamiquement les certificats SSL côté serveur via Node.js natif (`node:tls`) sans aucun outil tiers, vous pouvez créer un Route Handler :

Dans `app/api/health-inspector/route.ts` :

```ts
import { createHealthInspectorHandler } from '@parallalaxstudio/react-health-monitor/server';

export async function GET(req: Request) {
  return createHealthInspectorHandler(req);
}
```

Appel : `GET /api/health-inspector?url=https://monsite.fr`  
Retourne :
```json
{
  "domain": "monsite.fr",
  "issuer": "Let's Encrypt",
  "validFrom": "2026-09-10T12:00:00.000Z",
  "validTo": "2026-12-10T12:00:00.000Z",
  "daysRemaining": 48,
  "isExpired": false,
  "isExpiringSoon": false,
  "protocol": "TLS 1.3",
  "authorized": true
}
```

---

## ⚙️ Configuration & Props

| Propriété | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Titre principal du bloc (défaut : *"Santé API, Performances & Certificats"*). |
| `subtitle` | `string` | Sous-titre explicatif. |
| `certificates` | `CertificateCheck[]` | Tableau des domaines et certificats SSL à afficher et surveiller. |
| `endpoints` | `EndpointCheck[]` | Tableau des routes API à tester avec leur méthode, rôle et seuil d'alerte. |
| `database` | `DatabaseHealthInfo` | Informations de connectivité et pool de la base de données. |
| `uptimePercent30d`| `number` | Taux de disponibilité global estimé (ex: `99.98`). |
| `enableLiveBenchmark` | `boolean` | Active ou désactive le bloc interactif de test de 10 pings (défaut : `true`). |
| `benchmarkEndpointUrl` | `string` | URL ciblée lors du test de benchmark direct (défaut : `/health`). |
| `onTestComplete` | `(res) => void` | Callback appelé après le test unitaire d'une route. |
| `onBenchmarkComplete` | `(metrics) => void` | Callback appelé après la fin d'un benchmark de latence. |

---

## 📄 Licence

MIT © [ParallalaxStudio](https://github.com/ParallalaxStudio)
