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

| Command         | Description                                         |
| --------------- | --------------------------------------------------- |
| `audit [dir]`   | Scan a Next.js project for security vulnerabilities |
| `rules [dir]`   | List all rules with their enabled/disabled status   |
| `rules disable` | Interactively select rules to disable               |
| `rules enable`  | Interactively select rules to enable                |
| `init`          | Generate a `route-auditor.config.json` config file  |
| `report <file>` | Re-render a saved JSON audit in any output format   |

## Audit Options

| Option                   | Description                                               | Default   |
| ------------------------ | --------------------------------------------------------- | --------- |
| `-o, --output <format>`  | Output format: `console`, `json`, `sarif`                 | `console` |
| `-s, --severity <level>` | Minimum severity: `critical` `high` `medium` `low` `info` | `info`    |
| `--fail-on <level>`      | Exit code 1 if issues at or above this severity           | —         |
| `--file <path>`          | Write output to file instead of stdout                    | —         |
| `--config <path>`        | Path to config file                                       | —         |

## Configuration

Run `route-auditor init` to generate a config file, or create `route-auditor.config.json` manually:

```json
{
  "severity": "medium",
  "failOn": "high",
  "rules": {
    "RW-RATE-001": false
  },
  "ignore": ["/api/health", "/api/public/*", "/api/internal/**"]
}
```

All rules are enabled by default. Set a rule to `false` to disable it, or use `route-auditor rules disable` to manage rules interactively.

### Ignore patterns

| Pattern            | Matches                                      |
| ------------------ | -------------------------------------------- |
| `/api/health`      | Exact path only                              |
| `/api/public/*`    | One level deep (e.g. `/api/public/ping`)     |
| `/api/internal/**` | Any depth (e.g. `/api/internal/admin/users`) |

## Rules

| ID                | Name                         | Severity | Description                                               |
| ----------------- | ---------------------------- | -------- | --------------------------------------------------------- |
| `RW-AUTH-001`     | Unprotected API Route        | high     | API route with no auth check                              |
| `RW-AUTH-002`     | Missing CSRF Protection      | high     | Server Action with no CSRF guard                          |
| `RW-AUTH-003`     | Unprotected Sensitive Page   | medium   | Admin/dashboard page with no auth check                   |
| `RW-CORS-001`     | Permissive CORS Policy       | high     | Wildcard `Access-Control-Allow-Origin: *`                 |
| `RW-ENV-001`      | Exposed Environment Variable | high     | Sensitive env var leaked in a response                    |
| `RW-WEBHOOK-001`  | Missing Webhook Verification | high     | Webhook route with no signature verification              |
| `RW-PATH-001`     | Path Traversal               | high     | Filesystem operation using unvalidated user input         |
| `RW-SECRET-001`   | Hardcoded Secret             | critical | API key or secret hardcoded in source code                |
| `RW-RATE-001`     | Missing Rate Limiting        | medium   | API route with no rate-limit (high on auth endpoints)     |
| `RW-INPUT-001`    | Missing Input Validation     | medium   | POST/PUT route that parses body without schema validation |
| `RW-REDIRECT-001` | Open Redirect                | medium   | `redirect()` called with unvalidated user-supplied URL    |
| `RW-COOKIE-001`   | Insecure Cookie              | medium   | Cookie set without `HttpOnly`, `Secure`, or `SameSite`    |

## CI Integration

### GitHub Action

The easiest way to integrate route-auditor in any repository is via the GitHub Action. Add to `.github/workflows/route-auditor.yml`:

```yaml
name: Route Auditor

on:
  push:
    branches: [main]
  pull_request:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ayaxsoft/route-auditor@v1
        with:
          fail-on: high
```

The action automatically posts audit results as a PR comment and updates it on each push.

#### With SARIF upload (GitHub Code Scanning)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ayaxsoft/route-auditor@v1
    with:
      sarif-file: results.sarif
      fail-on: high
  - uses: github/codeql-action/upload-sarif@v3
    if: always()
    with:
      sarif_file: results.sarif
```

#### Action inputs

| Input        | Description                                         | Default  |
| ------------ | --------------------------------------------------- | -------- |
| `directory`  | Path to the Next.js project to audit                | `.`      |
| `severity`   | Minimum severity to report                          | `info`   |
| `fail-on`    | Fail if issues at this severity or higher are found | —        |
| `sarif-file` | Write SARIF output to this file path                | —        |
| `config`     | Path to `route-auditor.config.json`                 | —        |
| `version`    | Version of `@route-auditor/cli` to use              | `latest` |

### CLI

Fail the pipeline if any high or critical vulnerabilities are found:

```bash
route-auditor audit . --fail-on high
```

Export a SARIF report for GitHub Code Scanning:

```bash
route-auditor audit . --output sarif --file results.sarif
```

## License

MIT
