<!--
Sync Impact Report
- Version change: N/A (template placeholders) -> 1.0.0
- Modified principles:
	- Template Principle 1 -> I. Security First
	- Template Principle 2 -> II. Clean Architecture with Pragmatic SOLID
	- Template Principle 3 -> III. Testability and Coverage Discipline (NON-NEGOTIABLE)
	- Template Principle 4 -> IV. Explicit Dependencies and Small Modules
	- Template Principle 5 -> V. Deterministic Delivery and Operational Readiness
- Added sections:
	- Technical Standards
	- Development Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present; no files to update)
- Follow-up TODOs:
	- None
-->

# Second Brain Constitution

## Core Principles

### I. Security First
Security is the primary decision criterion for this project. When security and convenience conflict,
security MUST win. Secrets MUST NOT be stored in source code, logs, test fixtures, or generated
artifacts. All inputs at system boundaries MUST be validated and rejected safely on failure. Logging
MUST exclude secrets, tokens, and sensitive personal data.

Rationale: A secure default posture reduces breach likelihood and protects users, operations,
and project continuity.

### II. Clean Architecture with Pragmatic SOLID
All new code MUST follow Clean Architecture boundaries and SOLID principles, applied pragmatically.
The domain layer MUST contain business rules only and remain free of framework or database concerns.
The application layer MUST orchestrate use cases. The infrastructure layer MUST isolate frameworks,
database access, and external integrations. The presentation layer MUST depend inward only.
Architectural deviations MUST be explicit, documented, and intentional.

Rationale: Clear boundaries preserve maintainability and make change cost predictable over time.

### III. Testability and Coverage Discipline (NON-NEGOTIABLE)
Every change MUST preserve or improve testability. No feature is complete without tests at the
correct layer. The domain layer MUST maintain 100% automated test coverage. Testing strategy MUST
prove behavior at unit, integration, and contract levels where applicable.

Rationale: Strong testing is the fastest path to reliable change and safer refactoring.

### IV. Explicit Dependencies and Small Modules
Dependencies MUST be explicit and composed through simple, observable wiring. Hidden coupling is
prohibited. Modules SHOULD be small, composable, and single-responsibility by design. Any external
dependency MUST be justified, minimized, and reviewed for security risk before adoption.

Rationale: Explicit composition reduces accidental complexity and operational surprises.

### V. Deterministic Delivery and Operational Readiness
The project MUST be locally runnable, locally testable, and easy to bootstrap on a clean machine.
Development standards MUST include one command to install, one to test, and one to run. PostgreSQL
migrations MUST be repeatable and reversible where possible. Observability basics (structured logs,
error handling, and metrics where useful) MUST be present for production-readiness.

Rationale: Deterministic workflows and operational signals reduce deployment risk and recovery time.

## Technical Standards

- Bun and TypeScript MUST be used for all application code and tooling.
- PostgreSQL is the only allowed persistent datastore.
- Conventional Commits are the source of truth for versioning and changelog automation.
- Husky MUST enforce quality gates before commit.
- Important architectural choices MUST be recorded through decision records (ADR process).

## Development Workflow and Quality Gates

- Each pull request MUST demonstrate compliance with all core principles.
- Changes introducing security-sensitive behavior MUST include threat-aware validation and tests.
- Any architecture boundary exception MUST include an ADR and a rollback or remediation plan.
- Database changes MUST include migration files and downgrade feasibility notes when full reversal is
	not possible.
- Observability changes MUST be reviewed for signal quality and sensitive-data safety.

## Governance

This constitution supersedes conflicting project practices and templates. Amendments require a
documented proposal, rationale, and impact analysis across spec, plan, and tasks templates.

Versioning policy:
- MAJOR: incompatible governance changes or removal/redefinition of principles.
- MINOR: addition of new principle or materially expanded guidance.
- PATCH: clarification, wording improvements, and non-semantic refinements.

Compliance review expectations:
- Planning artifacts MUST include a constitution check before implementation begins.
- Task breakdowns MUST include work that enforces security, architecture boundaries,
	and test obligations.
- Reviews MUST block merges for unresolved constitution violations unless an approved ADR exists.

**Version**: 1.0.0 | **Ratified**: 2026-04-27 | **Last Amended**: 2026-04-27
