---
'@route-auditor/cli': minor
---

feat: add security rules, rules management command, and test coverage

- Add 4 new audit rules: insecure cookies (RW-COOKIE-001), missing webhook  
  verification (RW-WEBHOOK-001), path traversal (RW-PATH-001), and hardcoded
  secret detection (RW-SECRET-001)
- Add `rules` CLI command to list, enable, and disable rules interactively
- Fix audit command config resolution to fall back to cwd when config not  
  found in projectRoot
