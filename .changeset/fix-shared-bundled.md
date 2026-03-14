---
"@route-auditor/cli": patch
---

Fix npm install failure — move `@route-auditor/shared` to devDependencies since tsup bundles it into the dist. Prevents E404 when installing the CLI in external projects.
