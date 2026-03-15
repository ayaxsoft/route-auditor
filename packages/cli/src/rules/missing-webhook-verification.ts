import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const WEBHOOK_PATH_SEGMENTS = ['webhook', 'webhooks']

const SIGNATURE_VERIFICATION_SIGNATURES = [
  'createHmac',
  'timingSafeEqual',
  'stripe-signature',
  'x-hub-signature',
  'svix-signature',
  'x-signature-256',
  'constructEvent',
  'verifyWebhook',
  'webhook.verify',
  'Webhook(',
]

const isWebhookRoute = (routePath: string): boolean =>
  WEBHOOK_PATH_SEGMENTS.some((innerSegment) => routePath.toLowerCase().includes(innerSegment))

const hasSignatureVerification = (rawContent: string): boolean =>
  SIGNATURE_VERIFICATION_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

export const missingWebhookVerification: AuditRule = {
  id: 'RW-WEBHOOK-001',
  name: 'Missing Webhook Signature Verification',
  description: 'Webhook route does not verify the incoming request signature.',
  severity: 'high',
  category: 'authentication',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (!isWebhookRoute(route.routePath)) return []
    if (!route.methods.includes('POST')) return []
    if (hasSignatureVerification(route.rawContent)) return []

    return [
      {
        id: 'RW-WEBHOOK-001',
        title: 'Missing Webhook Signature Verification',
        description: `The webhook route ${route.routePath} does not verify the incoming request signature. Any actor can send arbitrary payloads to this endpoint.`,
        severity: 'high',
        category: 'authentication',
        owasp: 'A07:2021 – Identification and Authentication Failures',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            'Verify the webhook signature using HMAC before processing the payload. Use timingSafeEqual to prevent timing attacks.',
          effort: 'low',
          codeExample: `import { createHmac, timingSafeEqual } from 'crypto'\n\nexport async function POST(req: Request) {\n  const signature = req.headers.get('x-signature') ?? ''\n  const body = await req.text()\n  const expected = createHmac('sha256', process.env.WEBHOOK_SECRET!)\n    .update(body)\n    .digest('hex')\n  const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected))\n  if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 })\n  // process payload safely\n}`,
        },
      },
    ]
  },
}
