import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const FILESYSTEM_SIGNATURES = [
  'readFile(',
  'readFileSync(',
  'writeFile(',
  'writeFileSync(',
  'readdir(',
  'readdirSync(',
  'createReadStream(',
  'createWriteStream(',
  'unlink(',
  'unlinkSync(',
]

const USER_INPUT_SIGNATURES = [
  'req.query',
  'request.query',
  'params.',
  'searchParams.',
  'req.params',
]

const SANITIZATION_SIGNATURES = [
  'path.resolve(',
  'path.normalize(',
  'resolve(process.cwd()',
  'resolve(__dirname',
  'startsWith(baseDir',
  'startsWith(ALLOWED',
  'allowedPaths',
]

const usesFilesystem = (rawContent: string): boolean =>
  FILESYSTEM_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

const usesUserInput = (route: RouteFile): boolean =>
  route.isDynamic ||
  USER_INPUT_SIGNATURES.some((innerSignature) => route.rawContent.includes(innerSignature))

const hasSanitization = (rawContent: string): boolean =>
  SANITIZATION_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

export const pathTraversal: AuditRule = {
  id: 'RW-PATH-001',
  name: 'Potential Path Traversal',
  description:
    'Route performs filesystem operations with user-controlled input without path sanitization.',
  severity: 'high',
  category: 'path-traversal',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (!usesFilesystem(route.rawContent)) return []
    if (!usesUserInput(route)) return []
    if (hasSanitization(route.rawContent)) return []

    return [
      {
        id: 'RW-PATH-001',
        title: 'Potential Path Traversal',
        description: `The API route ${route.routePath} performs filesystem operations with user-controlled input. An attacker could use "../" sequences to access files outside the intended directory.`,
        severity: 'high',
        category: 'path-traversal',
        owasp: 'A01:2021 – Broken Access Control',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            'Use path.resolve() to normalize the path and verify it stays within the allowed base directory before any filesystem operation.',
          effort: 'low',
          codeExample: `import { resolve } from 'path'\n\nconst BASE_DIR = resolve(process.cwd(), 'public/files')\n\nexport async function GET(req: Request, { params }: { params: { file: string } }) {\n  const filePath = resolve(BASE_DIR, params.file)\n  if (!filePath.startsWith(BASE_DIR)) {\n    return Response.json({ error: 'Forbidden' }, { status: 403 })\n  }\n  // safe to read filePath\n}`,
        },
      },
    ]
  },
}
