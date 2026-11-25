# Contract history, AI review, and acceptance evidence

## Import and migration

Import accepts Schema 1.0 through 1.6. Use the extraction kit template for new
files. Open Import JSON to preview field errors, links, and image availability
before creating a new draft. The project you already have open is separate
from the imported draft. See the [Schema 1.6 template](../template_v0.9.json) for an example.

History keeps up to 30 named snapshots and 20 MiB of snapshot documents per
project. Snapshots point to local image assets. Restore saves the prior
state, then creates a new draft version. The private History backup ZIP
contains project storage and any available referenced images. Keep it private
and extract it into a separate standardized project directory when recovering
a backup. Ordinary schema JSON and handoff ZIPs are the portable formats.

## Optional AI review

Configure `IW_AI_MODEL`, `IW_AI_API_KEY`, and optionally `IW_AI_BASE_URL`
in the environment that starts `python server.py`. Supply the provider's
OpenAI-compatible API base URL (normally ending in /v1). Only HTTPS and an
explicit loopback HTTP port are accepted. Keep the key in your local secret
environment and keep Workbench on loopback. Requests use the configured
destination and redirects are disabled.

Save the project, choose fields to redact, and review the exact contract
text and image list. Vision requires a compatible model and explicit image
selection. The limit is three attached images of 2 MiB each and 512 KiB of
contract text. URL-only references are unverified. Confirm to submit the
preview. Ratings and draft suggestions are advisory, distinct from Preflight.
Weights are set per review, and N/A dimensions are excluded from the overall
rating. The ten latest reports and their decisions are stored locally.
Draft suggestions stay in their report until you edit the contract yourself.

## Acceptance evidence format

Import a UTF-8 JSON array, an object with an evidence array, or a UTF-8 CSV.
Use at least one requirement_id or journey_id, a timezone-aware timestamp,
a source or tester, and a description or artifact identifier. Optional values
include task_id and type. Status values are pass, fail, blocked, not_run, and
unverified. Include the observed result in description to count pass or fail
as a reported result. An artifact-only pass or fail appears as unverified.

Example with a deliberately unexecuted test. Replace the IDs with an existing linked requirement and journey in your project:

```json
[
  {
    "requirement_id": "REQ-007",
    "journey_id": "UAT-001",
    "status": "not_run",
    "timestamp": "2026-11-25T12:00:00Z",
    "source": "Example QA plan",
    "type": "browser",
    "description": "Execution pending"
  }
]
```

```csv
requirement_id,journey_id,status,timestamp,source,type,description
REQ-007,UAT-001,not_run,2026-11-25T12:00:00Z,Example QA plan,browser,Execution pending
```

Artifact references are inert text. Shared handoff archives, portable schema
exports and AI requests exclude evidence. Evidence reports are exported
explicitly from the Evidence page as JSON, CSV, or Markdown.
