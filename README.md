# MetriCheck AI — Legal Metrology Compliance Inspection Platform

MetriCheck AI is an advanced inspection-assistance platform designed for Legal Metrology officers under SIH Problem Statement **26034**. It facilitates package label verification under the **Legal Metrology (Packaged Commodities) Rules, 2011** (amended through 2026).

---

## 🏛️ Mission & Product Principles

- **Inspection-Assistance, Not Autonomous Authority**: AI performs multi-image perception & OCR extraction; a deterministic, versioned legal rule engine evaluates compliance.
- **Human-in-the-loop**: Authorized inspectors review, correct, override, attach evidence, and confirm final legal status before issuing statutory notices.
- **Traceable Evidence**: Every compliance check links back to cropped source package photos and explicit rule IDs (`Rule 6(1)(a)`, etc.).

---

## 📱 Inspector UI Design System

Built pixel-faithfully according to official Legal Metrology mobile mockups:
- **Navy & Orange Visual Palette**: `#0D223A` Deep Navy header, `#D9531E` Vibrant Orange primary action buttons.
- **Bi-lingual Labels**: Hindi (Devanagari) + English text (`नया निरीक्षण - New Inspection`, `स्कैन परिणाम - Result`).
- **Complete Inspector Flow**: Login ➔ OTP Verification ➔ Jurisdiction Setup ➔ Scanner Viewfinder Overlay ➔ Scan Result Checklist ➔ Session Summary ➔ Product Detail & Evidence ➔ Add Observation Drawer ➔ Report Preview ➔ Submitted Success & Court-Ready PDF.

---

## 🛠️ Monorepo Architecture

```text
metri-check/
├── apps/
│   ├── web/            # React + TypeScript + Vite + Tailwind CSS
│   ├── api/            # Node.js + Express + TypeScript + PDFKit + Store
│   └── ai-service/     # Python + FastAPI + OCR & Fixture Perception Engine
├── packages/
│   ├── shared-types/   # Shared TypeScript DTOs & Domain interfaces
│   └── rule-engine/    # Pure TS Deterministic Legal Rule Evaluator (v2026.01)
├── database/           # Migrations & Seeds
├── docs/               # Legal Register & Status documentation
├── docker-compose.yml  # Monorepo container orchestrator
└── README.md
```

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Services Locally
```bash
npm run dev
```

- **Frontend Inspector App**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **AI Perception Service**: http://localhost:8000

---

## 🧪 Testing & Verification

```bash
# Run monorepo tests across shared-types, rule-engine, and api
npm test
```
