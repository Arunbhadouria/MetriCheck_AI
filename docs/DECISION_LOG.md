# Architecture Decision Log (ADR)

## ADR-001 — Perception & Rule Engine Separation
- **Status**: Accepted
- **Context**: LLM outputs can be non-deterministic or hallucinate legal rules.
- **Decision**: AI performs image perception & OCR extraction; a pure TypeScript deterministic rule engine evaluates legal compliance.

## ADR-002 — Versioned Rule Sets
- **Status**: Accepted
- **Context**: Legal Metrology rules undergo statutory amendments.
- **Decision**: Rule sets are tagged with explicit version strings (e.g., `2026.01`). Inspections preserve the rule version evaluated at scan time.

## ADR-003 — Demo Mode Fixtures
- **Status**: Accepted
- **Context**: Hackathon evaluation requires 100% reliable execution without external paid API dependencies.
- **Decision**: `DEMO_MODE=true` enables `DemoOCRProvider` fixtures alongside live OCR capability.

## ADR-004 — Audit Event Persistence
- **Status**: Accepted
- **Context**: Inspector manual edits must be traceable in court.
- **Decision**: Every manual override creates an immutable `AuditEvent` recording actor, entity, action, and before/after JSON diffs.

## ADR-005 — Server-Side PDF Report Generation
- **Status**: Accepted
- **Context**: Formal legal notices under Rule 32 require standardized document layouts.
- **Decision**: Server-side PDFKit service generates official court-ready inspection reports with rule breakdown and inspector signature lines.

## ADR-006 — Offline-First IndexedDB Architecture
- **Status**: Accepted
- **Context**: Field officers often work in markets with spotty connectivity.
- **Decision**: IndexedDB handles local draft persistence and background queue sync.
