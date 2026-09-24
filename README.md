# NodeBrief ⚡

> **Ultra-Minimalist Visual Entity Modeling & Relational Schema Compiler**  
> Transform visual topology graphs into production-ready data schemas and structured LLM system prompts in real time.

[![GitHub Repository](https://img.shields.io/badge/GitHub-matakltm--code%2Fnodebrief-181717?style=flat&logo=github)](https://github.com/matakltm-code/nodebrief)
[![CI Pipeline](https://github.com/matakltm-code/nodebrief/actions/workflows/ci.yml/badge.svg)](https://github.com/matakltm-code/nodebrief/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8.svg)](https://tailwindcss.com/)

---

## 🧭 Architectural Overview

NodeBrief is built on a **Local-First Graph-to-Prompt Logic Flow**, allowing developers, systems architects, and technical leads to design database architectures visually on a high-precision canvas while instantly compiling the resulting graph into typed schemas and contextual LLM engineering prompts.

```
┌─────────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────────┐
│  Visual Graph Canvas    │ ───► │  Declarative Schema AST   │ ───► │  Compiled Output Pipeline   │
│  - Drag & Drop Entities │      │  - Nodes & Custom Fields  │      │  - Markdown Schema          │
│  - 1:1, 1:N, M:N Edges  │      │  - Relational Topology    │      │  - Prisma / SQL DDL         │
│  - Hierarchical Layout  │      │  - Foreign Key References │      │  - Hardened LLM Prompts     │
│  - Edge Reconnection    │      │  - Strict Type Safety     │      │  - TypeScript Interfaces    │
└─────────────────────────┘      └───────────────────────────┘      └─────────────────────────────┘
```

For a comprehensive technical breakdown of state management, schema compilation, and serialization algorithms, read the [Architecture Guide](docs/architecture.md).

---

## ✨ Features Checklist

- [x] **Ultra-Minimalist Pure White Canvas UI**: High-contrast, clean 1px borders, distraction-free engineering environment.
- [x] **Interactive Visual Node Graph**: Create, drag, update, and interconnect entity nodes with dynamic bezier or smoothstep curves, handles, and cardinality badges.
- [x] **Hierarchical Auto-Layout (Dagre)**: One-click automated graph layout with horizontal (LR) and vertical (TB) directional support.
- [x] **Interactive Edge Reconnection**: Drag and reconnect existing relation lines to different entity ports dynamically with full coordinate safety.
- [x] **Relationship Editor Modal**: Double-click relation lines or badges to edit source, target, label, cardinality (`1:N`, `M:N`, `1:1`), line styles (solid/dashed), and curve types (bezier/smoothstep) with automated default mappings.
- [x] **Declarative Field Management**: Assign Primary Keys (`[pk]`), Foreign Keys (`[ref: > Target.id]`), slug fields, enums, and timestamps.
- [x] **Real-Time Live Schema Compilation**:
  - **`schema.md` / `schema.txt`**: Clean Markdown tables and explicit relations.
  - **Prisma Schema & PostgreSQL DDL**: Relational models ready for copy or download.
  - **TypeScript Interfaces**: Strongly typed models with Zod validation targets.
  - **LLM Context Injections**: Automated context prompts for AI code generation engines.
- [x] **Multi-Project Management & Local Persistence**: Auto-save engine with switchable projects, instant JSON canvas serialization, lossless export/import pipelines, and delete confirmation safeguards.
- [x] **Canvas History & Keyboard Shortcuts**: Multi-level undo/redo (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) with input protection guards.
- [x] **SEO & AI/LLM Discoverability**: Built-in OpenGraph cards, standard `favicon.svg`, `robots.txt`, `sitemap.xml`, and `/llms.txt` for AI agent indexing.
- [x] **Responsive Mobile Experience**:
  - **Desktop (md+)**: 60% workbench canvas split with 40% real-time output panel.
  - **Mobile / Touch**: 100% full-screen canvas estate with a fluid slide-up bottom-sheet drawer (`h-[85vh]`).
- [x] **Zero-Warning Strict Type Safety**: Strict TypeScript compiler checks (`noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`), strong `@xyflow/react` generics, and 100% Vitest unit test coverage.

---

## 📂 Project Structure

```
nodebrief/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Issue template for bugs
│   │   └── feature_request.md   # Issue template for feature proposals
│   ├── pull_request_template.md # PR description checklist
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI workflow
├── docs/
│   ├── architecture.md          # Technical deep-dive & schema pipeline
│   └── contributing.md          # Contribution guidelines & coding standards
├── public/
│   ├── favicon.svg              # Minimalist SVG vector favicon
│   ├── og-image.svg             # OpenGraph social share card preview
│   ├── robots.txt               # Search crawler permissions
│   ├── sitemap.xml              # XML URL sitemap index
│   └── llms.txt                 # AI/LLM agent documentation index
├── src/
│   ├── components/
│   │   ├── flow/
│   │   │   ├── RelationEdgeComponent.tsx # Custom typed React Flow edge with label badge
│   │   │   └── SchemaNodeComponent.tsx   # Custom typed React Flow entity node card
│   │   ├── modals/
│   │   │   ├── AddNodeModal.tsx          # Standalone entity creation dialog
│   │   │   ├── AddRelationModal.tsx      # Standalone relation connection dialog
│   │   │   ├── EditRelationModal.tsx     # Standalone relation editing & deletion dialog
│   │   │   ├── ExportModal.tsx           # Advanced JSON & YAML schema export dialog
│   │   │   └── ImportModal.tsx           # Advanced JSON & YAML schema import dialog
│   │   ├── CanvasWorkbench.tsx           # React Flow canvas wrapper, toolbar & controls
│   │   ├── ConfirmationModal.tsx         # Reusable delete confirmation dialog
│   │   ├── Header.tsx                    # Top navigation, project selector & export
│   │   └── RightOutputPanel.tsx          # Schema compiler panel & LLM prompt generator
│   ├── hooks/
│   │   ├── useCanvasShortcuts.ts         # Global keyboard shortcuts listener (Undo/Redo)
│   │   ├── useHistoryState.ts            # Undo/Redo topology snapshot stack manager
│   │   └── useProjectManager.ts          # Multi-project CRUD, persistence & auto-save hook
│   ├── tests/
│   │   ├── setup.ts                      # Testing environment configuration
│   │   ├── Canvas.test.tsx               # Canvas workbench & node interactions test suite
│   │   ├── ConfirmationModal.test.tsx    # Confirmation dialog test suite
│   │   ├── DagreLayout.test.ts           # Dagre hierarchical layout algorithm tests
│   │   ├── Export.test.ts                # JSON & YAML export serialization tests
│   │   ├── ExportModal.test.tsx          # Export modal copy & download test suite
│   │   ├── ImportModal.test.tsx          # Advanced import validation & routing tests
│   │   ├── ProjectDatabase.test.ts       # Multi-project localStorage database tests
│   │   ├── RelationModal.test.tsx        # Relationship editing & cardinality tests
│   │   └── RightOutputPanel.test.tsx     # Schema compiler & synchronization tests
│   ├── types/
│   │   └── schema.ts                     # Core TypeScript domain models & interfaces
│   ├── utils/
│   │   ├── dagreLayout.ts                # Dagre hierarchical auto-layout engine
│   │   ├── exportCanvas.ts               # Canvas JSON serializer & validator
│   │   ├── importParser.ts               # JSON/YAML parser, normalizer & routing engine
│   │   ├── projectDatabase.ts            # Local-first multi-project storage engine
│   │   └── relationUtils.ts              # Cardinality & relationship label helpers
│   ├── App.tsx                           # Modular root orchestrator (<450 lines)
│   ├── index.css                         # Tailwind CSS v4 design tokens
│   └── main.tsx                          # React 19 root bootstrap entry
├── index.html                            # HTML entry point with OpenGraph & SEO tags
├── metadata.json                         # AI Studio applet metadata
├── package.json                          # Dependencies & NPM scripts
├── tsconfig.json                         # Strict TypeScript compiler options
└── vite.config.ts                        # Bundler & test configuration
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20 or later
- **npm**: v10 or later

### Installation
```bash
git clone https://github.com/matakltm-code/nodebrief.git
cd nodebrief
npm install
```

### Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to launch the interactive studio.

### Production Build
```bash
npm run build
npm run preview
```

### Quality Assurance & Tests
```bash
# Run strict TypeScript compiler verification
npm run lint

# Run all unit tests
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Created and maintained with ❤️ by [Micheal Ataklt](https://github.com/matakltm-code).
