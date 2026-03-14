---
'@route-auditor/cli': patch
---

Fix crash when running CLI via npx — replace `createRequire(import.meta.url)` with a build-time constant injected by tsup, which works in both CJS and ESM bundles.
