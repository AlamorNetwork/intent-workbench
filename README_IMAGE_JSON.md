# Reference Images in Project JSON — v0.8

## What was fixed

Previously `reference_ids` and `related_requirements` could be out of sync, and JSON exports omitted local image bytes. A reference might be listed, but its image thumbnail would appear blank after JSON import because the actual image never arrived.

Now both relationship directions are reconciled on import and project save. The JSON export has an explicit `image_status` field:

- `attached`: image bytes are in project storage.
- `external_url_only`: an external URL is recorded, but no local image is attached.
- `not_attached`: metadata only.

The **Download JSON** action embeds images as `image_data: "data:image/png;base64,..."`. Importing this portable JSON recreates the image files in the new project. Each image is limited to 8 MB (16 MB combined). For larger images use project ZIP and/or upload manually.

A reference can also have `related_requirements` (reverse link) or the requirement can have `reference_ids` (direct link). Both are now reconciled. For display, URL-only items have a clear label instead of an empty image box.

## Sample fragment

```json
{
  "schema_version": "1.5",
  "project": {"title": "Example", "summary": "Example project"},
  "requirements": [{"id":"REQ-001", "title":"Home UI", "text":"Match approved layout", "acceptance":"Check screenshot against reference", "reference_ids":["REF-001"]}],
  "references": [{"id":"REF-001", "name":"Approved Home Image", "mode":"structure", "related_requirements":["REQ-001"], "image_status":"attached", "image_data":"data:image/png;base64,<actual-base64>"}]
}
```

`image_status` is informational. It never creates an image. Image bytes need `image_data` or a manual upload; plain URLs are not silently fetched.

## Tests
Run `python -m unittest discover -s tests -v`. Includes round-trip, reverse-link, URL-only, and invalid-image coverage.
