# @route-auditor/cli

Catch security issues in your Next.js routes before they reach production.

Scans App Router, Pages Router, and API Routes — detecting missing authentication, CSRF gaps, permissive CORS, open redirects, and more. Stack-aware: fix suggestions are tailored to your detected auth library, validation library, and rate-limiting solution.

## Installation

```bash
# Run without installing (recommended)
npx @route-auditor/cli audit .

# Or install globally
npm install -g @route-auditor/cli
```

## Usage

```bash
route-auditor audit [directory]
```

```
⚡ route-auditor
Audit Next.js routes for security issues.

✔ Scanned 34 routes in 8ms

  [HIGH] Unprotected API Route  ·  3 routes
         OWASP A01:2021 – Broken Access Control

         → /api/users          app/api/users/route.ts
         → /api/posts/[id]     app/api/posts/[id]/route.ts

         Fix: Wrap your handler with getServerSession(authOptions) to verify the session
         before returning any data. With next-auth:

           const session = await getServerSession(authOptions)
           if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  85 / 100  Good
  █████████████████████████████████░░░░░░░

  3 vulnerabilities across 34 routes in 0.0s
```

## Commands

| Command                        | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `route-auditor audit [dir]`    | Scan a Next.js project for security vulnerabilities |
| `route-auditor init`           | Generate a `route-auditor.config.json` config file |
| `route-auditor report <file>`  | Re-render a saved JSON audit in any output format  |

## Audit Options

| Option                   | Description                                                           | Default   |
| ------------------------ | --------------------------------------------------------------------- | --------- |
| `-o, --output <format>`  | Output format: `console`, `json`, `sarif`                             | `console` |
| `-s, --severity <level>` | Minimum severity to display: `critical`, `high`, `medium`, `low`, `info` | `info` |
| `--fail-on <level>`      | Exit with code 1 if issues at this severity or higher are found       | —         |
| `--file <path>`          | Write output to a file instead of stdout                              | —         |
| `--config <path>`        | Path to a custom `route-auditor.config.json`                          | —         |

## Rules

| ID               | Name                          | Severity | Description                                              |
| ---------------- | ----------------------------- | -------- | -------------------------------------------------------- |
| `RW-AUTH-001`    | Unprotected API Route         | high     | API route with no auth check                             |
| `RW-AUTH-002`    | Missing CSRF Protection       | high     | Server Action with no CSRF guard                         |
| `RW-AUTH-003`    | Unprotected Sensitive Page    | medium   | Admin/dashboard page with no auth check                  |
| `RW-RATE-001`    | Missing Rate Limiting         | medium   | API route with no rate-limit (high on auth endpoints)    |
| `RW-CORS-001`    | Permissive CORS Policy        | high     | Wildcard `Access-Control-Allow-Origin: *`                |
| `RW-INPUT-001`   | Missing Input Validation      | medium   | POST/PUT route that parses body without schema validation |
| `RW-ENV-001`     | Exposed Environment Variable  | high     | Sensitive env var leaked in a response                   |
| `RW-REDIRECT-001`| Open Redirect                 | medium   | `redirect()` called with unvalidated user-supplied URL   |

## CI Integration

Fail the pipeline if any high or critical vulnerabilities are found:

```bash
route-auditor audit . --fail-on high
```

Export a SARIF report for GitHub Code Scanning:

```bash
route-auditor audit . --output sarif --file results.sarif
```

Add to `.github/workflows/security.yml`:

```yaml
- name: Audit Next.js routes
  run: npx @route-auditor/cli audit . --fail-on high

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

## Configuration

Run `route-auditor init` to generate a config file, or create `route-auditor.config.json` manually:

```json
{
  "severity": "medium",
  "failOn": "high",
  "rules": {
    "RW-AUTH-001": true,
    "RW-AUTH-002": true,
    "RW-AUTH-003": true,
    "RW-RATE-001": true,
    "RW-CORS-001": true,
    "RW-INPUT-001": true,
    "RW-ENV-001": true,
    "RW-REDIRECT-001": true
  },
  "ignore": [
    "/api/health",
    "/api/public/*",
    "/api/internal/**"
  ]
}
```

### Ignore patterns

| Pattern            | Matches                                      |
| ------------------ | -------------------------------------------- |
| `/api/health`      | Exact path only                              |
| `/api/public/*`    | One level deep (e.g. `/api/public/ping`)     |
| `/api/internal/**` | Any depth (e.g. `/api/internal/admin/users`) |

## License

MIT
