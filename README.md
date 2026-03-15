# route-auditor

Catch security issues in your Next.js routes before they reach production.

## Installation

```bash
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

  [HIGH] Unprotected API Route  3 routes
         A01:2021 – Broken Access Control

         → /api/users                          app/api/users/route.ts
         → /api/posts/[id]                     app/api/posts/[id]/route.ts

         Fix: Use getServerSession(authOptions) to verify the session.  (low effort)

  85 / 100  Good
  █████████████████████████████████░░░░░░░

  3 vulnerabilities  across 34 routes in 0.0s
```

## Options

| Option                   | Description                                                           | Default   |
| ------------------------ | --------------------------------------------------------------------- | --------- |
| `-o, --output <format>`  | Output format: `console`, `json`, `sarif`                             | `console` |
| `-s, --severity <level>` | Minimum severity: `critical`, `high`, `medium`, `low`, `info`         | `info`    |
| `--fail-on <level>`      | Exit with code 1 if vulnerabilities at this level or higher are found | —         |
| `--file <path>`          | Write output to file instead of stdout                                | —         |
| `--config <path>`        | Path to `route-auditor.config.json`                                   | —         |

## CI Integration

### GitHub Action

Add to `.github/workflows/route-auditor.yml` in your repository:

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

```bash
# Fail the pipeline if any high or critical vulnerabilities are found
route-auditor audit . --fail-on high
```

```bash
# Export a SARIF report for GitHub Code Scanning
route-auditor audit . --output sarif --file results.sarif
```

## Configuration

```json
{
  "severity": "medium",
  "failOn": "high",
  "rules": {
    "RW-AUTH-001": false
  },
  "ignore": ["app/api/health/**"]
}
```

## Contributing

Want to contribute? Check out the codebase and submit a PR.

```bash
git clone https://github.com/ayaxsoft/route-auditor
cd route-auditor
pnpm install
pnpm build
```

Run locally:

```bash
node packages/cli/dist/index.js audit /path/to/your/nextjs-project
```

## License

route-auditor is MIT-licensed open-source software.
