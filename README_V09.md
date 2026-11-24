# Intent Workbench v0.9 — Extraction Completeness

This release fixes missing sections from AI-generated project contracts.

## Workflow
1. Launch the app with `python server.py`.
2. Open **Import JSON** and choose **Download AI extraction kit + Skill/Role catalog**.
3. Give the downloaded kit to the model that knows the original project. Ask it to follow the included `instructions` and return a complete JSON object in the `template` format.
4. Import the resulting JSON, review suggested Skills/Roles, Visual Intent screens, and UAT Journeys.
5. Run Preflight; missing sections are warnings, not falsely completed checklists. Approve and export only after review.

The built-in catalog is a *curated subset*, not the whole third-party 200-agent repo. External catalog import remains available inside the bank. Model role selection is a proposal, not a real subagent launcher.

`Velvet_Intent_Complete_Draft_v0.9.json` is a separately supplied **draft** with ten screen specifications, six not-run user journeys, six suggested skills and eight suggested roles, based on previous Velvet requirements. It does not contain original reference images. Unapproved visual tokens have not been made binding.

## Safety and correctness
- Prior JSON schemas remain importable.
- No model is contacted automatically on importing; nothing is inferred from blank fields without evidence.
- Never mark user journeys PASS before the relevant test is executed.
- Keep all contracts in Draft until user review.
- Install behavior remains governed by explicit folder selection and backup rules.
