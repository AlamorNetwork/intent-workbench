<div align="center">

<img src="assets/hero.svg" alt="Intent Workbench — Define before you generate" width="100%" />

<br />

**A local-first intent engineering workbench for AI-assisted software development.**

Turn a project's goals, constraints, visual references, requirements, and acceptance criteria into a **reviewable, portable handoff** for coding agents.

<br />

![Status](https://img.shields.io/badge/status-public_beta-A88AFF?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10%2B-33343C?style=flat-square&logo=python&logoColor=white)
![Interface](https://img.shields.io/badge/UI-charcoal-22232A?style=flat-square)
![Architecture](https://img.shields.io/badge/architecture-local--first-494353?style=flat-square)
![Agents](https://img.shields.io/badge/coding_agents-tool--agnostic-686070?style=flat-square)

[Quick start](#-quick-start) · [Features](#-what-you-can-do) · [Workflow](#-how-it-works) · [JSON & assets](#-json-and-visual-references) · [Limitations](#-current-limitations)

</div>

---

## The idea

**Stop asking a coding agent to guess what you meant.**

Most AI coding workflows mix requirements discovery, product design, architecture, and implementation in the same conversation. Intent Workbench separates **defining the work** from **doing the work**:

- The **human** owns scope, priorities, reference fidelity, and final approval.
- The **Workbench** helps structure and package those decisions.
- The **coding agent** implements the agreed contract in its own environment.

**This is not an agent harness, IDE, LLM router, or code execution engine.** Intent Workbench does not run your coding agent or manage its token budget. It generates files you can inspect, edit, export, and hand to the tool of your choice.

<div align="center">
  <img src="assets/workflow.gif" alt="Animated four-step workflow: Define → Structure → Package → Build" width="100%" />
</div>

## ✨ What you can do

| Workspace | Capabilities |
|:--|:--|
| **Project Intent** | Describe the product, intended audience, scope, non-goals, technical constraints, and fixed requirements. |
| **Requirements** | Manage traceable requirements, priorities, dependencies, change policies, and acceptance criteria. |
| **Visual Intent** | Define screens and link references to individual requirements. Distinguish inspiration from structural or strict references. |
| **User Journeys** | Document end-to-end acceptance scenarios and separate planned tests from executed results. |
| **Skill & Role Bank** | Select instruction-based project Skills and expert-role briefs; review suggestions before including them in an agent handoff. |
| **Execution Planner** | Create and edit tasks, dependencies, statuses, ownership, and evidence; exchange a task board with the coding agent manually. |
| **Document Manager** | Maintain project-level agent guidance and companion documents. |
| **Preflight & Export** | Find missing or inconsistent contract fields, then export a portable project package. |
| **JSON import/export** | Fill projects manually or obtain structured JSON from another model, then review everything locally. |

> **Approval matters:** AI-produced suggestions and imported data are not automatically approved requirements. Confirm critical choices before handoff.

## 🖥️ Interface preview

<div align="center">
  <img src="assets/dashboard-concept.webp" alt="Approved charcoal dashboard design direction" width="94%" />
  <br />
  <sub>Design-direction concept image — not a verified screenshot of the running app. Replace with real captures before the stable v1.0 release.</sub>
</div>

## 🚀 Quick start

**Requirements:** Python 3.10+ and a modern web browser. The core local server uses the Python standard library.

```bash
# Clone your repository once you publish it
# git clone https://github.com/YOUR_USERNAME/intent-workbench.git
# cd intent-workbench

python server.py
```

Open **http://127.0.0.1:8787**.

On Windows, you can also run `start-windows.bat` from the project root.

> Local-first does not mean public-network hardened. Keep the development server on your machine and do not expose it directly to the internet.

### Run the tests

```bash
python -m unittest discover -s tests -v
```

The source snapshot used to prepare this README passed **32 unit tests** in the packaging environment. Browser-wide interactive testing, device-specific validation, and third-party installation flows have **not** been independently verified here.

## 🧭 How it works

1. **Define** — Write the project goal, boundaries, requirements, and acceptance criteria.
2. **Ground** — Attach design references to screens and requirements; declare what must be preserved and what may change.
3. **Plan** — Choose appropriate Skills/role briefs and organize work into verifiable tasks.
4. **Review** — Run preflight, inspect open questions, and approve the contract.
5. **Package** — Export documents and machine-readable artifacts for a coding agent.
6. **Verify** — Test the agent's result against the approved contract and record your evidence.

```mermaid
flowchart LR
  A[Human intent] --> B[Structured project]
  B --> C[Visual and functional requirements]
  C --> D[Review and preflight]
  D --> E[Portable contract]
  E --> F[Your coding agent]
  F --> G[User acceptance testing]
  G -. Feedback .-> B
```

### Contract handoff example

A project export can include documents such as:

```text
project-handoff/
├── AGENTS.md
├── PROJECT_INTENT.md
├── REQUIREMENTS.md
├── ACCEPTANCE_TESTS.md
├── VISUAL_INTENT.md
├── USER_JOURNEYS.md
├── EXECUTION_PLAN.md
├── TASK_BOARD.json
├── CONTRACT_AUDIT.md
├── .agents/
│   └── skills/
│       └── project-intent/
│           └── SKILL.md
└── references/
    └── ...
```

Exact filenames and contents depend on the exported project and selected resources; the example illustrates the handoff pattern, not an API compatibility guarantee for every coding agent.

## 🧩 JSON and visual references

The application supports project JSON import/export and provides an **AI Extraction Kit** with a template and curated Skill/Role information for the upstream model.

Two supported creation paths:

- **Manual:** Fill in project fields, edit requirements, and attach images inside the app.
- **Assisted:** Give the extraction kit to a model familiar with the project, import its JSON response, then review the proposed requirements, roles, screens, and journeys.

Reference images can be attached to requirements. For portable JSON exports, image bytes may be embedded in the supported image-data field. External URLs are **not the same** as attached files; verify that the agent handoff actually contains the assets you need.

Project JSON uses a versioned schema. The current source snapshot exports schema **`1.6`** and can import earlier supported versions.

## 🎭 Skills and expert roles

Skill files and role briefs provide **task-specific guidance**, not extra system authority.

- Import or curate a role catalog; choose only roles relevant to the project.
- Include selected instruction-based Skills in an exported project.
- Keep third-party sources and licenses in mind before sharing their content.
- Selecting a role does **not** create a real subagent unless the target coding environment supports and invokes one.
- Unknown third-party scripts are **not** automatically executed.

## 🔒 Design boundaries

Intent Workbench is intentionally **a preparation and documentation tool**:

**In scope:** authoring, reference linking, review, controlled document generation, JSON interchange, manual agent handoff, and evidence tracking.

**Out of scope:** invoking or supervising coding models, automatic code execution, live token metering, orchestration of subagents, unattended repository mutation, or claiming that instructions cannot be ignored by an agent.

Contract files are project-level instructions. A coding agent's actual instruction hierarchy and tool permissions still apply.

## 🧪 Quality and trust

- A successful build does not prove correct behavior or visual fidelity.
- A completed checklist entry is not independent test evidence.
- An imported model suggestion is not an approved product decision.
- A reference URL is not an available local image file.
- The Workbench cannot guarantee that a coding agent follows every instruction.

Use a real user-acceptance pass before marking an application complete. Back up project data before upgrading installations or writing exported files into an existing repository.

## 📈 Early field feedback

The initial development experiments included a real Android media application project. The owner reported substantially less repetitive prompting and an **estimated ~70% reduction in token use** compared with their prior workflow. This is **anecdotal, uncontrolled feedback**, not a benchmark or product performance guarantee.

A reproducible comparison would need matched tasks, models, starting contexts, token accounting, time, and accepted output quality.

## 🗺️ Roadmap (not shipped)

- [ ] End-to-end browser regression tests and accessibility audit
- [ ] Verified screenshots and short feature walkthroughs
- [ ] JSON schema documentation, validation errors, and migration fixtures
- [ ] Better requirement coverage and contradiction detection
- [ ] Non-destructive project import/merge previews
- [ ] Agent-result acceptance report importer (manual; no runtime integration)
- [ ] Release packaging, version tags, changelog, and security review

## 🤝 Contributing

Issues and pull requests are welcome after the repository is published. For bug reports, include your OS, Python version, steps to reproduce, and a **redacted** sample project JSON. Never attach tokens, passwords, private media, or unreviewed personal project files.

Before opening a PR, run:

```bash
python -m unittest discover -s tests -v
```

## 📜 License

**Not yet selected.** Before calling this repository open source, add a `LICENSE` file with an OSI-approved license you choose (for example MIT or Apache-2.0), and check the licenses of third-party role catalogs, skill text, and assets before redistribution.

---

<div align="center">

**Make intent explicit. Keep implementation flexible. Let the human decide what “done” means.**

<sub>Intent Workbench · Define before you generate.</sub>

</div>
