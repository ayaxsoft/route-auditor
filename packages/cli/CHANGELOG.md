# @route-auditor/cli

## 0.4.0

### Minor Changes

- f5c43ae: feat: add security rules, rules management command, and test coverage
  - Add 4 new audit rules: insecure cookies (RW-COOKIE-001), missing webhook
    verification (RW-WEBHOOK-001), path traversal (RW-PATH-001), and hardcoded
    secret detection (RW-SECRET-001)
  - Add `rules` CLI command to list, enable, and disable rules interactively
  - Fix audit command config resolution to fall back to cwd when config not
    found in projectRoot

### Patch Changes

- f5c43ae: Fix crash when running CLI via npx — replace `createRequire(import.meta.url)` with a build-time constant injected by tsup, which works in both CJS and ESM bundles.
- f5c43ae: Fix code style violations per AGENTS.md rules

## 0.3.0

### Minor Changes

- 8971f67: feat: add security rules, rules management command, and test coverage
  - Add 4 new audit rules: insecure cookies (RW-COOKIE-001), missing webhook
    verification (RW-WEBHOOK-001), path traversal (RW-PATH-001), and hardcoded
    secret detection (RW-SECRET-001)
  - Add `rules` CLI command to list, enable, and disable rules interactively
  - Fix audit command config resolution to fall back to cwd when config not
    found in projectRoot

### Patch Changes

- 8971f67: Fix crash when running CLI via npx — replace `createRequire(import.meta.url)` with a build-time constant injected by tsup, which works in both CJS and ESM bundles.
- 8971f67: Fix code style violations per AGENTS.md rules

## 0.2.0

### Minor Changes

- 6185758: feat: add security rules, rules management command, and test coverage
  - Add 4 new audit rules: insecure cookies (RW-COOKIE-001), missing webhook
    verification (RW-WEBHOOK-001), path traversal (RW-PATH-001), and hardcoded
    secret detection (RW-SECRET-001)
  - Add `rules` CLI command to list, enable, and disable rules interactively
  - Fix audit command config resolution to fall back to cwd when config not
    found in projectRoot

### Patch Changes

- 6185758: Fix code style violations per AGENTS.md rules

## 0.1.6

### Patch Changes

- 0586b29: Fix code style violations per AGENTS.md rules

## 0.1.5

### Patch Changes

- 88ab222: GitHub Action now posts audit results as a PR comment instead of blocking — updates existing comment on re-runs, supports optional `fail-on` threshold.
- 88ab222: Fix crash when running CLI via npx — replace `createRequire(import.meta.url)` with a build-time constant injected by tsup, which works in both CJS and ESM bundles.

## 0.1.4

### Patch Changes

- 2ecd7ef: Fix crash when running CLI via npx — replace `createRequire(import.meta.url)` with a build-time constant injected by tsup, which works in both CJS and ESM bundles.

## 0.1.3

### Patch Changes

- 21a1032: Fix table formatting in README — shorter columns to prevent wrapping on GitHub and npm.

## 0.1.2

### Patch Changes

- c92e964: Fix table formatting in README — shorter columns to prevent wrapping on GitHub and npm.
- 6f21a39: Fix npm install failure — move `@route-auditor/shared` to devDependencies since tsup bundles it into the dist. Prevents E404 when installing the CLI in external projects.

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
