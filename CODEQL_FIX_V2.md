# CodeQL remediation pass 2 — candidate patch

Scope: findings #1–#5 observed on GitHub commit `a28a2ab713d32f916adbf5679a4dbf96518d84f8`.

- Replace path joining via `Path / untrusted_component` with `os.path.realpath(os.path.join(...))`, validate using `os.path.commonpath` and exact parent match, then convert to `Path` only after containment.
- Validate fixed `project.json` and `project.tmp` paths too; reject a symlinked `project.json` escaping project root.
- Image serving reads through validated `existing_upload` and verifies existence.
- HTTP response header values are rejected if containing CR, LF, or NUL, and explicitly stripped of CR/LF before reaching the `send_header` call to aid static dataflow analysis.
- Keep the local-first application interface and portable contract format unchanged.

## Important status

This patch passed all local unit tests and Python compilation in its construction environment. It **has not** been verified by a fresh CodeQL scan on the revised commit. GitHub may still flag certain paths because static analysis does not always recognize custom sanitizers. Do not dismiss security alerts merely to get zero open findings.

## Apply

Copy `server.py` and `tests/test_security_codeql.py` to your existing repository (same paths), run `python -m unittest discover -s tests -q`, then commit, pull with rebase if needed and push. Never copy a bundled `data/` folder into a live install. A branch/PR is recommended so CodeQL reviews the changes before merging.
