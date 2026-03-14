# @route-auditor/cli

## 0.1.1

### Patch Changes

- Add npm README with full documentation — commands table, all 8 rules, CI integration examples, configuration reference, and ignore patterns guide.

## 0.1.0

### Minor Changes

- Initial release of route-auditor CLI.

  ## Features
  - **Scanner** — detects App Router, Pages Router, and mixed monorepo setups with support for dynamic segments, catch-all routes, and route groups
  - **8 audit rules** out of the box:
    - `RW-AUTH-001` Unprotected API Route
    - `RW-AUTH-002` Missing CSRF Protection in Server Actions
    - `RW-AUTH-003` Unprotected Sensitive Page (`/admin`, `/dashboard`, etc.)
    - `RW-RATE-001` Missing Rate Limiting (severity based on route type)
    - `RW-CORS-001` Permissive CORS Policy
    - `RW-INPUT-001` Missing Input Validation
    - `RW-ENV-001` Potentially Exposed Environment Variable
    - `RW-REDIRECT-001` Potential Open Redirect
  - **Stack-aware fixes** — fix descriptions and code examples tailored to the detected auth/validation library (next-auth, Clerk, Supabase, Zod, etc.)
  - **Multiple output formats** — console, JSON, SARIF (for GitHub Code Scanning)
  - **CI integration** — `--fail-on <severity>` exits with code 1 for pipeline enforcement
  - **Config file** — `route-auditor.config.json` with rule toggles, severity filter, and ignore patterns
  - **`init` command** — generates a config file with all rules listed
  - **`report` command** — re-renders a saved JSON audit in any format
