import type {
  AuditRule,
  AuditContext,
  RouteFile,
  Vulnerability,
  Fix,
  DetectedStack,
} from '../types'

const BODY_PARSING_SIGNATURES = [
  'req.json()',
  'request.json()',
  'req.formData()',
  'request.formData()',
  'req.text()',
  'request.text()',
  'req.body',
  'request.body',
]

const VALIDATION_SIGNATURES = [
  '.parse(',
  '.safeParse(',
  '.parseAsync(',
  '.safeParseAsync(',
  '.validate(',
  '.validateAsync(',
  'z.object(',
  'z.string(',
  'z.number(',
  'yup.object(',
  'Joi.object(',
  'v.object(',
  'v.parse(',
  'createSafeActionClient',
  'next-safe-action',
]

const VALIDATION_FIX: Record<NonNullable<DetectedStack['validation']>, Fix> = {
  zod: {
    description: 'Use Zod to parse and validate the request body before processing it.',
    effort: 'low',
    codeExample: `import { z } from 'zod'\n\nconst schema = z.object({\n  name: z.string().min(1),\n  email: z.string().email(),\n})\n\nexport async function POST(req: Request) {\n  const body = await req.json()\n  const parsed = schema.safeParse(body)\n  if (!parsed.success) {\n    return Response.json({ error: parsed.error.flatten() }, { status: 400 })\n  }\n  // use parsed.data\n}`,
  },
  yup: {
    description: 'Use Yup to validate the request body before processing it.',
    effort: 'low',
    codeExample: `import * as yup from 'yup'\n\nconst schema = yup.object({\n  name: yup.string().required(),\n  email: yup.string().email().required(),\n})\n\nexport async function POST(req: Request) {\n  const body = await req.json()\n  const parsed = await schema.validate(body, { abortEarly: false }).catch((err) => ({ error: err }))\n  // use parsed\n}`,
  },
  joi: {
    description: 'Use Joi to validate the request body before processing it.',
    effort: 'low',
    codeExample: `import Joi from 'joi'\n\nconst schema = Joi.object({\n  name: Joi.string().required(),\n  email: Joi.string().email().required(),\n})\n\nexport async function POST(req: Request) {\n  const body = await req.json()\n  const { error, value } = schema.validate(body)\n  if (error) return Response.json({ error: error.message }, { status: 400 })\n  // use value\n}`,
  },
  valibot: {
    description: 'Use Valibot to parse and validate the request body before processing it.',
    effort: 'low',
    codeExample: `import * as v from 'valibot'\n\nconst schema = v.object({\n  name: v.string(),\n  email: v.pipe(v.string(), v.email()),\n})\n\nexport async function POST(req: Request) {\n  const body = await req.json()\n  const result = v.safeParse(schema, body)\n  if (!result.success) return Response.json({ error: result.issues }, { status: 400 })\n  // use result.output\n}`,
  },
}

const GENERIC_FIX: Fix = {
  description:
    'Validate the request body before processing it. Consider using Zod for type-safe runtime validation.',
  effort: 'low',
}

const parsesBody = (rawContent: string): boolean =>
  BODY_PARSING_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

const hasValidation = (rawContent: string): boolean =>
  VALIDATION_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

const hasMutationMethod = (methods: string[]): boolean =>
  methods.some((innerMethod) => ['POST', 'PUT', 'PATCH'].includes(innerMethod))

const buildFix = (validation: DetectedStack['validation']): Fix =>
  validation ? VALIDATION_FIX[validation] : GENERIC_FIX

export const missingInputValidation: AuditRule = {
  id: 'RW-INPUT-001',
  name: 'Missing Input Validation',
  description: 'API route reads the request body without validating its shape or content.',
  severity: 'medium',
  category: 'injection',
  enabled: true,
  check(route: RouteFile, context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (!hasMutationMethod(route.methods)) return []
    if (!parsesBody(route.rawContent)) return []
    if (hasValidation(route.rawContent)) return []

    return [
      {
        id: 'RW-INPUT-001',
        title: 'Missing Input Validation',
        description: `The API route ${route.routePath} reads the request body without validating its shape. Unexpected input can cause errors, injection, or unintended behavior.`,
        severity: 'medium',
        category: 'injection',
        owasp: 'A03:2021 – Injection',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: buildFix(context.detectedStack.validation),
      },
    ]
  },
}
