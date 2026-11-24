# Universal Application Development Playbook
**Base documentation for intent-driven, secure, testable application development across web, Android, iOS, Windows, Linux, and macOS**

> **Document status:** Reusable baseline / reference standard — **not** a project-specific implementation contract.  
> **Version:** 2.0 (revised 2026-11-23)  
> **Audience:** Product owners, designers, professional users of AI coding agents, engineers, QA, and security reviewers.  
> **Applicability:** Each recommendation is conditional on the selected platform, risk profile, architecture, and project scope. Mark non-applicable work **N/A with a reason**; do not manufacture services, accounts, APIs, or infrastructure.

## How to use this baseline

1. Start by defining the project's **approved intent**, actual use cases, constraints, and source references.
2. Create or import a project-specific contract (for example, through **Intent Workbench**). It takes precedence over generic suggestions here, subject to applicable higher-priority instructions and security constraints.
3. Select only the relevant platform modules and lifecycle steps. Skip client/server sections for fully local apps when they do not apply.
4. Convert requirements into **traceable acceptance criteria and real user journeys** before coding.
5. Use this playbook to check completeness and engineering quality, **not** to add unapproved functionality or replace the user's visual design.
6. Distinguish **planned**, **implemented**, **automatically verified**, **device-tested**, and **user-accepted** outcomes.

**Decision authority:** The user/product owner approves product behavior, design, scope and irreversible data/security decisions. Coding agents may choose routine implementation details only within the approved contract.

## 1. What every application is made of

Applications commonly involve some of these concerns, but **not every app requires a separate instance of every layer**. A local Android media player, for example, might have no backend server or remote API:

| Layer | Purpose | Examples |
|---|---|---|
| Presentation / UI | What users see and interact with | Screens, buttons, forms, animations |
| Client logic / Frontend | Rules for user interaction and local state | Form validation, navigation, offline cache |
| API / Service layer | Contract between clients and servers | REST, GraphQL, gRPC, WebSocket |
| Backend / Business logic | Core rules and workflows | Orders, payments, permissions, calculations |
| Data layer | Persistent and temporary data | SQL, NoSQL, files, cache |
| Infrastructure | Where and how software runs | Cloud, containers, servers, CI/CD |
| Security layer | Protection of users, data, and systems | Authentication, authorization, encryption |
| Observability | Understanding behavior in production | Logs, metrics, traces, alerts |

One *possible* client/server mental model is:

```text
User
  -> UI / Frontend
    -> [Optional API Client]
      -> [Optional Remote API / Backend]
        -> Business Logic (local and/or remote)
          -> Data stores / External services (as applicable)
```

## 2. Common prerequisites

These are shared prerequisites for nearly every platform.

### 2.1 Technical prerequisites

- Programming fundamentals: variables, functions, data types, loops, conditionals, errors, files, and basic algorithms.
- Git and GitHub/GitLab: version control, branches, commits, pull requests, code review.
- Command line basics: navigating folders, running programs, installing packages.
- HTTP fundamentals when the product uses networked services: requests, responses, status codes, headers, JSON, authentication.
- Data persistence appropriate to the product: local files, databases, caches, schema changes, migrations.
- Testing: unit tests, integration tests, end-to-end tests.
- Debugging: reading stack traces, breakpoints, logs, and error messages.
- Documentation: README, architecture notes, API documentation, changelog.

### 2.2 Product prerequisites

Before writing code, define:

- Problem statement: What user problem does the app solve?
- Target users: Who will use it and on which devices?
- Core user journeys: first launch, main feature, errors, recovery and safe exit (sign-up/support only where applicable).
- Minimum viable product (MVP): The smallest useful version.
- Non-functional requirements: Performance, security, accessibility, offline behavior, scalability.
- Success metrics appropriate to the goal: task completion, fidelity, latency, crashes, privacy outcomes, retention or conversion only if relevant.

### 2.3 Team and process prerequisites

- Product owner or decision maker.
- Designer or UI/UX workflow.
- Developer or development team.
- QA/tester or automated test strategy.
- DevOps/deployment owner.
- Security review process.
- Code review process.
- Issue tracker and project board.

## 3. Universal development lifecycle: 0 to 100

### Phase 0: Discovery

1. Identify the real problem.
2. Define users and use cases.
3. Research competitors and existing solutions.
4. Define scope and exclusions.
5. Create a product brief.
6. Define MVP acceptance criteria.

**Checklist**

- [ ] Problem is clearly written.
- [ ] Target platform list is defined.
- [ ] Primary user personas exist.
- [ ] MVP features are prioritized.
- [ ] Success metrics are selected.
- [ ] Legal, privacy, and compliance needs are identified.

### Phase 1: Product design

1. Create user stories.
2. Map user flows.
3. Create low-fidelity wireframes.
4. Create high-fidelity UI designs.
5. Define accessibility requirements.
6. Define empty, loading, error, and success states.

**Checklist**

- [ ] Every screen has a purpose.
- [ ] Every action has a visible result.
- [ ] Error states are designed.
- [ ] Empty states are designed.
- [ ] Loading states are designed.
- [ ] Accessibility contrast and touch-target rules are checked.

### Phase 2: Architecture

1. Choose platform strategy.
2. Choose frontend stack.
3. Choose backend stack.
4. Choose database type.
5. Define API contract.
6. Define authentication model.
7. Define deployment model.
8. Create repository structure.

**Checklist**

- [ ] Architecture diagram exists.
- [ ] Data model exists.
- [ ] API contract exists.
- [ ] Authentication flow is defined.
- [ ] Secrets-management strategy is defined.
- [ ] Environments are defined: development, staging, production.

### Phase 3: Environment setup

1. Install language runtime and package manager.
2. Install IDE and extensions.
3. Initialize Git repository.
4. Create project scaffold.
5. Configure formatter and linter.
6. Configure environment variables.
7. Set up local database or emulator.
8. Create CI pipeline.

**Checklist**

- [ ] Project runs locally with one command.
- [ ] `.env` files are excluded from Git.
- [ ] Dependencies are locked.
- [ ] Linting passes.
- [ ] Tests run locally.
- [ ] CI runs automatically on push.

### Phase 4: Backend foundation (only if a backend exists)

1. Create project structure.
2. Configure configuration loading.
3. Set up database connection.
4. Create migrations.
5. Implement health endpoint.
6. Implement structured logging.
7. Implement global error handling.
8. Implement authentication.

**Checklist**

- [ ] Secrets are not committed.
- [ ] Database migrations are versioned.
- [ ] API returns consistent error format.
- [ ] Logs do not contain passwords or tokens.
- [ ] Health check endpoint exists.
- [ ] Authentication is enforced where needed.

### Phase 5: Presentation/client foundation (platform-adapted)

1. Initialize UI project.
2. Set up routing/navigation.
3. Create design tokens: colors, typography, spacing.
4. Build reusable components.
5. Create API client.
6. Implement state management.
7. Implement form validation.
8. Implement error and loading states.

**Checklist**

- [ ] UI is responsive or platform-adaptive.
- [ ] API base URL is configurable.
- [ ] Tokens are stored securely.
- [ ] User-facing errors are understandable.
- [ ] Forms validate input.
- [ ] Accessibility basics are implemented.

### Phase 6: Feature development

For every feature:

1. Write acceptance criteria.
2. Design data changes.
3. Design an API endpoint **only if the feature uses an API**.
4. Implement local and/or backend business logic as applicable.
5. Write domain/backend tests where applicable.
6. Implement UI if the feature is user-facing.
7. Connect UI to the appropriate local service or API.
8. Write frontend tests where valuable.
9. Test manually across supported devices.
10. Review code.
11. Merge and deploy to staging.

**Checklist**

- [ ] Feature has acceptance criteria.
- [ ] All applicable trust-boundary inputs are validated.
- [ ] Authorization is checked wherever protected resources exist.
- [ ] UI handles success, failure, loading, and empty states.
- [ ] Tests cover critical logic.
- [ ] Code review is completed.

### Phase 7: Testing and quality

1. Unit tests.
2. Integration tests.
3. End-to-end tests.
4. Security tests.
5. Performance tests.
6. Accessibility tests.
7. Cross-platform testing.
8. Regression testing.

**Checklist**

- [ ] Critical paths are tested.
- [ ] Authentication and authorization are tested.
- [ ] Input validation is tested.
- [ ] Error paths are tested.
- [ ] Performance targets are measured.
- [ ] Accessibility is checked.

### Phase 8: Security hardening

1. Establish a threat model, trust boundaries, and least privilege.
2. Validate all external input.
3. Sanitize output.
4. Encrypt data in transit.
5. Encrypt sensitive data at rest where warranted by the threat model; manage keys and recovery safely.
6. Use a memory-hard password KDF for stored passwords where password authentication exists.
7. Design secret rotation/revocation and recovery appropriate to the system.
8. Add rate limiting or other abuse protection on relevant entry points.
9. Add privacy-safe audit logs only when useful and justified.
10. Conduct dependency/SBOM scanning and document third-party licenses.

**Checklist**

- [ ] No secrets in source code.
- [ ] HTTPS/TLS is enforced **where communication crosses a network**.
- [ ] Stored authentication passwords use an appropriate password KDF when passwords exist.
- [ ] Sessions/tokens have an appropriate expiry and revocation policy if applicable.
- [ ] CORS is restricted for applicable browser-based APIs (not an authentication mechanism).
- [ ] Database access uses safe parameter binding where SQL is used.
- [ ] File uploads are validated.
- [ ] Dependencies are scanned.

### Phase 9: Deployment

1. Build production artifacts.
2. Configure production secrets.
3. Run database migrations safely.
4. Deploy backend.
5. Deploy frontend/client.
6. Verify monitoring.
7. Test production smoke paths.
8. Prepare rollback plan.

**Checklist**

- [ ] Production secrets are managed securely.
- [ ] Database backups exist.
- [ ] Rollback plan exists.
- [ ] Monitoring and alerting are active.
- [ ] Logs are centralized.
- [ ] Release notes exist.

### Phase 10: Operations and scaling

1. Monitor errors and latency.
2. Collect user feedback.
3. Prioritize bugs and improvements.
4. Optimize database queries.
5. Add caching where useful.
6. Scale infrastructure based on load.
7. Maintain dependencies.
8. Review security regularly.

**Checklist**

- [ ] Error rate is monitored.
- [ ] API latency is monitored.
- [ ] Database performance is monitored.
- [ ] Backups are tested.
- [ ] Security patches are applied.
- [ ] Documentation is updated.

## 4. UI/UX standards

### 4.1 Core principles

- Clarity: Users should understand what to do.
- Consistency: Similar actions should look and behave similarly.
- Feedback: Every action should produce a visible response.
- Forgiveness: Users should be able to undo or recover from mistakes.
- Accessibility: The product must be usable by people with disabilities.
- Performance: Interfaces should feel fast and responsive.

### 4.2 Essential UI states

Every dynamic screen should define:

| State | Purpose | Example |
|---|---|---|
| Loading | Data is being fetched | Skeleton or spinner |
| Empty | No data exists yet | “No projects yet” |
| Error | Request failed | Retry button and explanation |
| Success | Action completed | Confirmation message |
| Offline | Network unavailable | Cached data or retry option |
| Permission denied | User lacks access | Clear explanation and next step |

### 4.3 UX rules

- Use familiar navigation patterns.
- Keep primary actions visible.
- Make destructive actions confirmable.
- Use plain language in errors.
- Avoid asking for unnecessary permissions.
- Support keyboard navigation on desktop.
- Respect platform conventions.
- Test on small screens, large screens, dark mode, and slow networks.

## 5. Frontend architecture

### 5.1 Recommended structure

```text
src/
  app/
  features/
    auth/
      components/
      hooks/
      services/
      types/
    projects/
      components/
      hooks/
      services/
      types/
  shared/
    components/
    utils/
    config/
    api/
  assets/
  tests/
```

### 5.2 Rules

- Organize by feature, not only by file type.
- Keep components small and focused.
- Separate UI, business logic, and API calls.
- Do not put secrets in frontend code.
- Validate user input on both client and server.
- Use typed models where the language supports it.
- Cache carefully; never assume cached data is current.
- Handle network failure gracefully.

### 5.3 Simple example: login form

```text
User enters email and password
  -> Client validates format
  -> Client sends HTTPS POST /auth/login
  -> Server validates credentials
  -> Server returns short-lived access token
  -> Client stores refresh token securely
  -> Client navigates to dashboard
```

## 6. Backend architecture

### 6.1 Recommended structure

```text
src/
  main.py or main.ts
  config/
  core/
    security.py
    logging.py
    errors.py
  db/
    models/
    repositories/
    migrations/
  modules/
    auth/
      routes.py
      services.py
      schemas.py
      tests.py
    users/
      routes.py
      services.py
      schemas.py
      tests.py
  api/
    dependencies.py
  tests/
```

### 6.2 Layered design

| Layer | Responsibility | Rule |
|---|---|---|
| Route/controller | HTTP request and response | No business logic |
| Service | Business rules | No direct HTTP details |
| Repository/data access | Database operations | No business decisions |
| Schema/DTO | Input and output contracts | Validate data |
| Domain model | Core entities and rules | Independent of framework |

### 6.3 Backend rules

- Validate every request.
- Authorize every protected operation.
- Use idempotency for critical write operations.
- Return standardized error responses.
- Never expose internal stack traces to clients.
- Use structured logs with request IDs.
- Keep database transactions short.
- Use background jobs for slow work.
- Design APIs to be versioned.

## 7. Database architecture

### 7.1 Choosing a database

| Need | Common choice | When to use |
|---|---|---|
| Structured relational data | PostgreSQL, MySQL | Users, orders, financial records |
| Flexible documents | MongoDB | Rapidly changing nested data |
| Key-value cache | Redis | Sessions, rate limits, caching |
| Search | Elasticsearch, Meilisearch | Full-text search |
| Time-series | TimescaleDB, InfluxDB | Metrics and sensor data |
| Local device storage | SQLite, Room, Core Data | Offline-first mobile/desktop apps |

### 7.2 Data rules

- Use UUIDs or stable public identifiers for external references.
- Use auto-incrementing integers internally when appropriate.
- Store timestamps in UTC.
- Use soft deletion only when business rules require it.
- Create indexes for frequent queries.
- Avoid storing secrets, passwords, or tokens in plaintext.
- Use migrations for every schema change.
- Back up data and test restoration.

### 7.3 Simple data model example

```text
users
  id UUID PRIMARY KEY
  email TEXT UNIQUE
  password_hash TEXT
  created_at TIMESTAMP

projects
  id UUID PRIMARY KEY
  owner_id UUID REFERENCES users(id)
  name TEXT
  created_at TIMESTAMP

project_members
  project_id UUID REFERENCES projects(id)
  user_id UUID REFERENCES users(id)
  role TEXT
```

## 8. API rules

### 8.1 REST API conventions

- Use nouns for resources: `/users`, `/projects`.
- Use HTTP methods correctly: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Use plural resource names.
- Use pagination for list endpoints.
- Use filtering, sorting, and pagination parameters consistently.
- Return meaningful status codes.
- Use versioning: `/api/v1/`.
- Use idempotency keys for payment or critical creation operations.

### 8.2 Standard response format

Success:

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "My project"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": [
      {
        "field": "email",
        "issue": "invalid_format"
      }
    ]
  }
}
```

### 8.3 API security rules

- Use HTTPS/TLS for applicable network communications; local-only apps do not need a remote API.
- Authenticate every protected endpoint.
- Authorize every resource access.
- Validate and limit request body size.
- Apply rate limiting.
- Use CORS allowlists, not `*` in production.
- Do not return sensitive data unnecessarily.
- Log authentication failures and suspicious activity.
- Use short-lived access tokens and secure refresh-token handling.

## 9. Security and encryption

### 9.1 Authentication versus authorization

- Authentication answers: “Who are you?”
- Authorization answers: “What are you allowed to do?”

Example: A logged-in user is authenticated. Whether they can delete another user’s project is authorization.

### 9.2 Password and token rules

- For **password verifiers**, use a suitable salted password KDF (e.g., Argon2id; scrypt/bcrypt under appropriate constraints), not an unsalted fast hash. For **encryption keys derived from passwords**, explicitly design and review the KDF and key hierarchy.
- Never store plaintext passwords.
- Use secure random values for tokens.
- If access tokens are used, choose bounded lifetimes and revocation policies appropriate to the threat model.
- If refresh tokens are used, store them securely and support rotation/revocation.
- Evaluate MFA for sensitive accounts according to risk, usability, and recovery requirements.
- Use secure, HTTP-only cookies for web sessions when appropriate.

### 9.3 Encryption rules

| Type | Purpose | Example |
|---|---|---|
| TLS | Data in transit | HTTPS, database TLS |
| At-rest encryption | Stored data protection | Disk/database encryption |
| Field-level encryption | Highly sensitive fields | Medical IDs, financial data |
| Password hashing / KDF | Password verification and certain key-derivation uses | Argon2id, scrypt (design-dependent) |
| Cryptographic hashes / MACs | Checksums, integrity or keyed authentication depending on primitive | SHA-256, HMAC |
| Digital signatures | Authenticity of signed data | Ed25519, ECDSA |

### 9.4 Secure coding rules

- Never trust client input.
- Use parameterized queries.
- Escape output to prevent XSS.
- Use CSRF protection for browser-based state-changing requests.
- Restrict file types, size, and storage location for uploads.
- Use least-privilege database users.
- Keep dependencies updated.
- Scan for vulnerable dependencies.
- Do not log secrets, tokens, passwords, or full personal data.

## 10. Platform-specific guidance

### 10.1 Windows

**Common stacks**

- C#/.NET with WPF, WinUI, or Avalonia.
- Electron with web technologies.
- Python with PyQt/PySide or Tkinter.
- C++ with Qt.

**Rules**

- Use the Windows installer format appropriate to your distribution model.
- Request only necessary permissions.
- Handle high-DPI displays.
- Support keyboard shortcuts.
- Store user data in the proper application-data directory.
- Sign executables and installers when distributing publicly.

### 10.2 macOS

**Common stacks**

- Swift/SwiftUI.
- Objective-C/AppKit.
- Electron.
- Flutter desktop.
- Qt.

**Rules**

- Follow Apple Human Interface Guidelines.
- Handle macOS permissions: camera, microphone, files, notifications.
- Use Keychain for sensitive secrets.
- Support dark mode and accessibility.
- Notarize and sign distributed applications.

### 10.3 Linux

**Common stacks**

- GTK with C, C++, Python, or Rust.
- Qt with C++ or Python.
- Electron.
- Flutter desktop.
- Tauri.

**Rules**

- Support multiple desktop environments and window managers.
- Package using appropriate formats: DEB, RPM, Flatpak, Snap, or AppImage.
- Follow freedesktop conventions for icons and desktop entries.
- Avoid hard-coded paths.
- Handle Wayland and X11 differences where relevant.

### 10.4 Android

**Common stacks**

- Kotlin with Jetpack Compose.
- Java with XML UI.
- Flutter.
- React Native.
- .NET MAUI.

**Rules**

- Respect Android conventions and accessibility; use Material Design where appropriate without overriding approved original visual identity.
- Request runtime permissions only when needed.
- Use Android Keystore as appropriate for device-bound key protection; separately design portable backup/recovery where required.
- Use encrypted storage for sensitive local data.
- Support different screen sizes and orientations.
- Test on low-end devices and poor networks.
- Publish through Google Play or another trusted distribution channel.

### 10.5 iOS

**Common stacks**

- Swift with SwiftUI.
- Objective-C with UIKit.
- Flutter.
- React Native.
- .NET MAUI.

**Rules**

- Follow Apple Human Interface Guidelines.
- Request permissions with clear purpose strings.
- Use Keychain for sensitive values.
- Respect privacy requirements and App Store rules.
- Test on multiple iPhone and iPad sizes.
- Support Dark Mode, Dynamic Type, and accessibility features.

## 11. Cross-platform strategy

| Approach | Best for | Tradeoff |
|---|---|---|
| Native per platform | Best performance and platform integration | More code and maintenance |
| Flutter | Consistent UI across mobile/desktop | Larger app size, platform-specific work still needed |
| React Native | Mobile-first teams with JavaScript/TypeScript | Native modules may be needed |
| Electron | Desktop apps based on web technologies | Higher memory usage |
| Tauri | Lightweight desktop apps using web frontend | Rust backend knowledge may be needed |
| .NET MAUI | Microsoft-centered cross-platform development | Platform-specific gaps can occur |
| Kotlin Multiplatform | Shared business logic with native UI options | Ecosystem maturity varies by use case |

## 12. Simple end-to-end example: task manager

### Product definition

Users can create, complete, and delete personal tasks.

### Data model

```text
users
  id
  email
  password_hash

tasks
  id
  user_id
  title
  description
  is_completed
  created_at
  updated_at
```

### API endpoints

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/{id}
PATCH  /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

### Frontend behavior

1. User opens app.
2. App checks for a valid token.
3. If no token, show login screen.
4. After login, fetch tasks.
5. Show loading, empty, error, and success states.
6. Allow creating, editing, completing, and deleting tasks.
7. Refresh list after mutation or update local cache safely.

### Backend behavior

1. Receive request.
2. Authenticate token.
3. Validate input.
4. Check ownership.
5. Execute database operation.
6. Return standardized response.
7. Log important events without sensitive data.

## 13. Project intent and authority model

A generic playbook cannot substitute for a project-specific definition of **what must be built**. Before implementation, establish:

| Artifact | Purpose | Minimum information |
|---|---|---|
| Project intent | User's intended product and rationale | Problem, target users, outcomes, exclusions, success evidence |
| Requirements register | Explicit, testable obligations | Stable ID, description, category, priority, source, change policy, dependencies, acceptance criteria |
| Decision log | Keep decisions stable across sessions | Decision, alternatives, owner approval, date, reason, superseded decision |
| Reference register | Ground images and external examples | File/URL, availability, role, protected properties, allowed deviations, linked requirement IDs |
| User journeys | Verify complete real usage | Preconditions, ordered actions, expected results, error/recovery behavior, platform/device |
| Risk register | Make threats and unknowns visible | Severity, probability/impact, mitigation, owner, evidence, status |

**Requirement authority:** `USER_EXPLICIT`, `USER_APPROVED`, `DOCUMENT_DERIVED`, `REFERENCE_DERIVED`, `MODEL_INFERRED`, `UNKNOWN`. Do not silently promote model inferences to user approvals. For conflicting requirements, log the conflict and obtain the appropriate decision rather than choosing a design by preference.

**Change policy:** `LOCKED` (user approval required to change), `APPROVAL` (proposed change needs approval), `FLEXIBLE` (implementation choice within explicit acceptance limits). The user's newest *approved* decision supersedes an older conflicting decision, and the change is recorded.

**Examples of invalid conclusions:** "Build passed, therefore UX is correct"; "Reference image differs, therefore the requirements conflict"; "20 unit tests passed, therefore real-device security is proven".

## 14. Visual intent and reference fidelity

For visual products, define the design **page by page**, not merely as "modern", "premium", or "minimal":

- Screen/panel ID, platform, size class, intent, entry/exit route and intended audience.
- Layout hierarchy, grouping, navigation, spacing, density, color and typography **when explicitly defined**.
- Components, data/content examples, interactions, gestures, accessibility alternatives and all UI states.
- Reference image/file IDs attached **directly to relevant requirements and screens**; preserve attachment paths when exporting ZIP packages.
- Explicit reference roles: `INSPIRATION` (style ideas only), `STRUCTURE` (identified hierarchy/interaction patterns), `STRICT` (specified visual properties are binding).
- `preserve`, `modify`, `prohibit`, `unknown` per reference; one image can be strict for a component while inspirational for the rest.
- Evidence confidence per observation: `OBSERVED`, `USER_SPECIFIED`, `INFERRED`, `UNKNOWN`.

**Visual fidelity acceptance:** Implemented screen + accessible reference + target viewport/density + agreed comparison criteria. A source-level check is **not** equivalent to an actual screenshot comparison. Run real device/browser checks for clipping, hierarchy, typography, RTL, keyboard overlap, gestures and accessibility. If images are unavailable, record `UNVERIFIED`, not `PASS`.

**UX rule:** For disabled actions, show the unmet preconditions near the control. Every critical user journey must be discoverable and recoverable; do not rely only on hidden gestures. Treat deliberate mismatch between a reference and an approved requirement as `INTENTIONAL_DIVERGENCE`, not automatically a defect.

## 15. User journey acceptance and real-device testing

Acceptance tests should cover a *complete path*, not only isolated functions. For each journey include `JOURNEY_ID`, affected `REQ_IDs`, preconditions, exact actions, expected observable result, error cases, data-safety constraints, environments, and evidence.

Example: `First launch -> Create password -> Confirm requirements -> Save recovery key -> Unlock -> Import a test photo -> View -> Lock -> Verify denial -> Unlock again`.

**Media import semantics:** `COPY` into an encrypted vault preserves the original. `MOVE` requires explicit user choice, verified encrypted import, safe rollback behavior and a separate authorization for removal of the original; platform APIs may prevent deletion. Do not claim that importing alone removes other copies (gallery, trash, cloud backups).

**Evidence states:**

- `NOT_IMPLEMENTED`: no corresponding functioning feature.
- `IMPLEMENTED`: code exists but verification is incomplete.
- `AUTO_VERIFIED`: automated test passed in a stated environment.
- `DEVICE_VERIFIED`: applicable physical/emulated device journey was exercised with evidence.
- `USER_ACCEPTED`: owner approved the observed behavior.
- `FAIL`, `BLOCKED`, `UNVERIFIED`: use with an explanation and the blocking condition.

Use separate evidence entries for build, unit tests, integration tests, screenshots, accessibility, real-device behavior, security review and user acceptance. A passing build must never automatically close an acceptance criterion.

## 16. AI coding-agent handoff and autonomous execution

AI may help **extract** requirements, but a professional user reviews and approves their meaning before handing them to a coding agent. Generate a portable contract, not just one long prompt.

Recommended handoff structure (adapt to the agent's actual capabilities):

```text
project-contract/
  MANIFEST.json
  PROJECT_INTENT.md
  REQUIREMENTS.md
  DECISIONS.md
  REFERENCE_MAP.md
  VISUAL_INTENT.md
  USER_JOURNEYS.md
  ACCEPTANCE_TESTS.md
  CONTRACT_AUDIT.md
  AGENTS.md
  .agents/skills/project-intent/SKILL.md
  references/images/
```

- Keep `AGENTS.md` short: where to find authoritative files, when to load a Skill, how to report deviations. Its authority is limited by the host agent's instruction hierarchy.
- Skills describe **how** to execute a project's approved intent; they do not independently authorize new requirements.
- Use **progressive disclosure**: index first, load only relevant requirements and reference files for a task, while retaining a compact stable summary of critical invariants.
- Agents must audit existing code before edits; reuse working modules and map changes/tests to requirement IDs.
- Prefer **autonomous incremental work with verification gates**, not untested full-project generation. Avoid asking for approval on routine implementation details. Stop at genuine irreversible/security-critical decisions and continue independent tasks where possible.
- On completion, provide artifacts, environment/build information, failures, screenshots when possible, acceptance evidence, and **known unverified claims**. Agents must not claim that unexecuted tests passed.

## 17. Structured project JSON and import/export contract

A project JSON is a **transfer format**, not a substitute for review or actual image files. Define a versioned JSON Schema and publish a template/sample. The following compact sample illustrates the *conceptual data model*; actual applications must document and validate their precise field names and versions.

```json
{
  "schema_version": "1.0",
  "project": {"name": "Example", "status": "draft", "platforms": ["android"]},
  "requirements": [
    {
      "id": "REQ-001",
      "title": "First-run setup",
      "category": "ux",
      "policy": "locked",
      "source": "user_explicit",
      "priority": "high",
      "description": "User can finish setup with actionable validation feedback.",
      "acceptance_criteria": ["The continue button explains unmet conditions."],
      "reference_ids": ["REF-001"]
    }
  ],
  "references": [
    {"id": "REF-001", "role": "inspiration", "asset_path": "references/images/setup.png", "availability": "attached"}
  ],
  "journeys": [
    {"id": "JRN-001", "requirement_ids": ["REQ-001"], "steps": ["Open setup", "Enter valid values", "Continue"]}
  ],
  "decisions": [],
  "open_questions": []
}
```

**Import checks:** parse/schema validation; duplicate IDs; invalid references; path traversal and archive size limits; unsupported values; contradictory locked requirements; missing referenced image bytes; provenance and approval status. Reject unsafe archive paths and executables by default. Display a preview and **do not silently overwrite** the user's existing project. Provide import diagnostics per field and a migration path for older schema versions.

**Export checks:** include related image assets, preserve stable IDs and approved decisions, validate all cross-file references, include a manifest and checksums for assets where useful, and make resulting ZIP independently interpretable. Export JSON and Markdown so both humans and coding agents can inspect the contract.

## 18. Security, privacy, and data lifecycle review

Security design must be threat-model-driven and platform-aware, not a fixed checklist applied blindly to every app:

- Map data classification, storage locations, trust boundaries, permissions, retention, backups and deletion semantics.
- Define authentication, authorization, session expiry, account recovery, device binding and key management **only where relevant**.
- Prefer vetted cryptographic libraries and authenticated encryption; design key rotation, backup portability, corruption handling and recovery before destructive migration.
- Document that encryption at rest does not erase original copies, cloud backups, system logs, screenshots or traces outside the app's control.
- Protect secrets in CI, signing, builds, logging, crash reports and analytics; scrub sensitive values in diagnostic artifacts.
- Consider supply-chain risks: dependency pinning, licenses, SBOM, update cadence and provenance.
- Document consent/permissions and applicable privacy obligations. Never promise forensic invisibility or impossible platform guarantees.
- Require explicit confirmation for irreversible deletion, data/key migration, production access changes and disabling protective controls.

Use OWASP-style application and mobile security verification guidance where applicable, and record the specific standards/version used in the project's implementation contract rather than treating this baseline as a certification.

## 19. Platform applicability and quality attributes

| Project type | Typically needed | Not automatically required |
|---|---|---|
| Offline mobile app | Local state, device permissions, packaging, lifecycle, on-device testing | Remote API, authentication server, cloud monitoring |
| Desktop utility | File/system permissions, installer, native UX, update strategy | Mobile responsive breakpoints, backend server |
| Browser web app | Browser accessibility, navigation, security boundaries, deployment | Native APK, app-store signing |
| Hosted SaaS | APIs, persistence, authorization, observability, backups and scaling | Embedded/offline media architecture |
| CLI/automation | Command contracts, exit codes, dry-run/safe mode, logging and recovery | Full graphical UI |
| AI-enabled application | Model selection, data boundaries, evaluation sets, cost, latency, abuse prevention | Sending private data to hosted models by default |

For all types, make relevant **quality attributes measurable**: startup time, memory budget, latency, crash-free operation, offline behavior, accessibility, localization, compatibility, performance, maintainability and cost. Record target, measurement method, device/environment and outcome; label unavailable measurements `UNVERIFIED`.

## 20. Changes, approvals, and delivery governance

- Keep a decision log and requirement-level change history. A changed requirement retains its ID when its purpose persists; create a new ID for materially new scope.
- Track baseline versions and changes to source references and approved screenshots.
- Define review gates: `DRAFT -> REVIEWED -> APPROVED_FOR_BUILD -> IMPLEMENTED -> VERIFIED -> USER_ACCEPTED` with explicit evidence and ownership.
- Never auto-promote imported model output to `APPROVED_FOR_BUILD`.
- Protect user data during upgrades, rollback and uninstall; verify migration/restore using test data before production data.
- Release bundles should include reproducible build instructions, source, licensed dependencies, installable artifacts when supported, hashes, known limitations, requirement matrix and test evidence. Avoid secrets and unnecessary caches in delivery archives.
- Make "not applicable", "not tested" and "failed" visibly different statuses.

## 21. Base documentation versus project documentation

**This document (`app_development_playbook_en.md`) is the reusable base.** Do not paste its full contents into every coding prompt. The project contract names the relevant sections and supplies concrete, approved values.

Recommended ownership:

| Layer | Owner | Changes when |
|---|---|---|
| Universal playbook | Methodology maintainer | A general engineering practice changes |
| Domain playbook / expert role | Specialist/reviewer | New platform-specific guidance is vetted |
| Project intent and requirements | User/product owner | An approved project decision changes |
| Agent Skill / AGENTS.md | Project maintainer | Execution workflow or host instructions change |
| Implementation and verification evidence | Coding agent + human testers | Code/tests and device results change |

**Precedence for product facts:** explicit approved project decisions and actual inspected evidence outrank generic examples in this playbook. Higher-priority tool/system instructions still apply. When there is insufficient evidence, report uncertainty and request targeted approval instead of silently inventing details.

---

## 22. Master checklist

### Product

- [ ] Problem defined.
- [ ] Users defined.
- [ ] MVP scope defined.
- [ ] Success metrics defined.
- [ ] Legal and privacy requirements reviewed.

### Design

- [ ] User flows created.
- [ ] Wireframes created.
- [ ] UI design completed.
- [ ] Accessibility reviewed.
- [ ] Error and empty states designed.

### Architecture

- [ ] Platforms selected.
- [ ] Tech stack selected.
- [ ] Data model designed.
- [ ] API contract defined.
- [ ] Security model defined.
- [ ] Deployment strategy defined.

### Development

- [ ] Repository initialized.
- [ ] Coding standards documented.
- [ ] CI/CD configured.
- [ ] Local environment reproducible.
- [ ] Feature workflow defined.
- [ ] Code review process active.

### Backend

- [ ] Input validation implemented.
- [ ] Authentication implemented.
- [ ] Authorization implemented.
- [ ] Error handling standardized.
- [ ] Logging implemented.
- [ ] Database migrations managed.

### Frontend

- [ ] Navigation implemented.
- [ ] API client implemented.
- [ ] State management implemented.
- [ ] Forms validated.
- [ ] Loading/error/empty states implemented.
- [ ] Accessibility checked.

### Security

- [ ] HTTPS enforced.
- [ ] Secrets stored securely.
- [ ] Passwords hashed.
- [ ] Tokens expire.
- [ ] Rate limiting enabled.
- [ ] Dependency scanning enabled.
- [ ] Security tests performed.

### Testing

- [ ] Unit tests written.
- [ ] Integration tests written.
- [ ] End-to-end tests written.
- [ ] Cross-platform tests completed.
- [ ] Performance tested.
- [ ] Security tested.

### Release

- [ ] Production build created.
- [ ] Secrets configured securely.
- [ ] Backups verified.
- [ ] Monitoring enabled.
- [ ] Rollback plan ready.
- [ ] Release notes published.

### Operations

- [ ] Errors monitored.
- [ ] Performance monitored.
- [ ] User feedback collected.
- [ ] Dependencies updated.
- [ ] Security reviewed regularly.
- [ ] Documentation maintained.


### Intent-driven delivery extension

- [ ] Project intent approved and traceable to user decisions.
- [ ] Every critical requirement has a stable ID, category, source and policy.
- [ ] Reference images are attached or explicitly marked unavailable.
- [ ] Each image's role (inspiration/structure/strict) is recorded.
- [ ] Critical screens have visual intent and accessibility expectations.
- [ ] Critical user journeys have device-level acceptance steps.
- [ ] Design/architecture conflicts are classified and resolved or gated.
- [ ] Project JSON passed versioned schema and reference checks.
- [ ] Agent handoff includes only approved content and usable references.
- [ ] Security and data lifecycle are reviewed before irreversible actions.
- [ ] Automated verification, visual verification and user acceptance are distinguished.
- [ ] Final release includes a requirement compliance matrix and limitations.

## Revision notes — v2.0

- Preserved the original cross-platform lifecycle, engineering disciplines, and checklists.
- Corrected blanket client/server assumptions and made network/backend features optional when irrelevant.
- Clarified password KDFs versus hashes/signatures, and security checks by applicability.
- Added intent authority, traceability, reference fidelity, user journeys, JSON import/export, agent handoff, evidence status and user acceptance.
- Kept baseline advice separate from project-specific approved choices; no implementation or security certification is implied.
