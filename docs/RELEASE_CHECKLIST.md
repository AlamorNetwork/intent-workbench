# Release checklist

## Before publishing
- [ ] Copy README.md and assets/ into repository root; verify images display on GitHub.
- [ ] Run `python -m unittest discover -s tests -v` on supported Windows and at least one other OS.
- [ ] Test browser flows: create, edit, save, import JSON, attach image, export ZIP, reload, and restore project.
- [ ] Test task board import roundtrip and selected Skill/Role installation in a temporary repository.
- [ ] Verify the new release ZIP excludes temporary data, secrets, .env, caches, credentials, and private Velvet project artifacts.
- [ ] Review local server security; confirm it binds to loopback by default and never expose it publicly without hardening.
- [ ] Verify Python minimum version and startup instructions on a clean environment.
- [ ] Replace the conceptual dashboard image with real screenshot(s) when available; update caption.
- [ ] Choose and add a license; inspect licenses of all external catalogs, role text, images, and other bundled material.
- [ ] Add CONTRIBUTING.md, SECURITY.md (disclosure channel), CHANGELOG.md, and an appropriate CODE_OF_CONDUCT.md as the project grows.
- [ ] Check the latest CodeQL analysis for the exact release commit and review any open alerts before tagging.

## Release positioning
- Workbench supports optional, consent-based contract review. Coding-agent execution and runtime management are outside its scope.
- Project documents cannot override coding-agent system/developer policies.
- See the execution plan for tested environments and pending release checks.
- ~70% token reduction is an unverified user estimate, not a controlled benchmark.
