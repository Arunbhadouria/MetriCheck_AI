# MetriCheck AI — System Architecture & Design

## 1. System Overview

MetriCheck AI is an inspection-assistance platform built for the Legal Metrology framework. AI performs image perception and label extraction, while a deterministic versioned rule engine evaluates legal compliance under the **Legal Metrology (Packaged Commodities) Rules, 2011** (amended through 2026).

```text
┌──────────────────────┐
│  React Inspector UI  │ (apps/web — Port 3000)
└──────────┬───────────┘
           │ HTTPS / REST
           ▼
┌──────────────────────┐
│  Node.js API Gateway │ (apps/api — Port 4000)
└─────┬────────────┬───┘
      │            │
      ▼            ▼
┌──────────┐  ┌──────────────────────┐
│ DB Store │  │  FastAPI Perception  │ (apps/ai-service — Port 8000)
└──────────┘  └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Pure TS Rule Engine  │ (packages/rule-engine — v2026.01)
              └──────────────────────┘
```

---

## 2. Core Domain Invariants

1. **AI Perception vs Legal Determination**: AI extracts text and candidate fields (`MRP`, `Net Quantity`, `Address`), but NEVER directly issues a legal verdict. The deterministic rule engine evaluates rule conditions.
2. **Human-in-the-Loop Verification**: Inspector can override any declaration or rule result. Every modification generates an audit event with `beforeJson` and `afterJson` state diffs.
3. **Rule Versioning**: Historical inspections retain the exact rule-set version (`2026.01`) evaluated at inspection time.
4. **Offline Capability**: Inspection drafts and captured evidence photos store in IndexedDB during low-connectivity operations and reconcile via `/api/v1/sync`.

---

## 3. Data Flow

```text
Image Acquisition ➔ AI OCR ➔ Declaration Normalization ➔ Deterministic Rule Engine ➔ Inspector Verification ➔ Final Audit Log ➔ Court-Ready PDF Report
```
