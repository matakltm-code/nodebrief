# NodeBrief Architecture Specification 📐

## 1. System Vision & Core Principles

NodeBrief is an ultra-minimalist, local-first visual schema modeler that transforms abstract visual graphs into strict relational schemas and engineered LLM system prompt contexts in real time.

### Architectural Tenets:
1. **Zero-Latency Visual Feedback**: State updates, coordinate translations, and edge calculations happen synchronously in memory with zero network latency.
2. **Deterministic Schema Parsing**: The schema parser produces identical, structured markdown and code definitions from any identical graph topology.
3. **Lossless JSON Serialization & Portability**: Graph state can be exported, imported, and shared with complete fidelity across local sessions and machines.
4. **Resilient Data Safety**: Non-blocking background auto-saving (500ms debounce), multi-project isolation, undo/redo history, and modal confirmation safeguards prevent accidental data loss.
5. **Modular Decoupled Design**: Pure separation of concerns between state orchestration (`App.tsx`), domain hooks (`useProjectManager`, `useHistoryState`, `useCanvasShortcuts`), custom canvas components (`SchemaNodeComponent`, `RelationEdgeComponent`), and dialog modals (`AddNodeModal`, `AddRelationModal`, `EditRelationModal`).

---

## 2. Data Modeling & Graph Topology

The internal state graph is represented as normalized data structures defined in `src/types/schema.ts`:

```typescript
export type NodeTagType = 'primary' | 'active' | 'taxonomy' | 'relation' | 'custom';
export type Cardinality = '1:N' | 'M:N' | '1:1';
export type EdgeStyle = 'solid' | 'dashed';
export type PathStyle = 'bezier' | 'smoothstep';
export type EdgeColor = 'slate' | 'magenta';

export interface SchemaField {
  id: string;
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  refTarget?: string;
  details?: string;
  icon?: string;
}

export interface SchemaNode {
  id: string;
  title: string;
  tag: string;
  tagType: NodeTagType;
  x: number;
  y: number;
  fields: SchemaField[];
}

export interface SchemaEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  cardinality: Cardinality;
  style?: EdgeStyle;
  pathStyle?: PathStyle;
  color?: EdgeColor;
}
```

---

## 3. Modular Architecture & Custom Hooks

NodeBrief decomposes its business logic into focused, single-responsibility units:

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│             (Root Coordinator / <450 LOC)              │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│useProjectManager │ │useHistoryState│ │useCanvasShortcuts│
│- Projects Index  │ │- Undo Stack   │ │- Ctrl/Cmd+Z/Y    │
│- Active Project  │ │- Redo Stack   │ │- Input Guards    │
│- 500ms Auto-Save │ │- Snapshots    │ │                  │
│- JSON Imp/Export │ │               │ │                  │
└──────────────────┘ └───────────────┘ └──────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌────────────────────────────────────────────────────────┐
│                   Component Hierarchy                  │
│ ├── Header (Multi-Project Dropdown & Export Actions)   │
│ ├── CanvasWorkbench (React Flow Workbench)             │
│ │   ├── SchemaNodeComponent (Custom Entity Card)       │
│ │   └── RelationEdgeComponent (Custom Relation Path)   │
│ ├── RightOutputPanel (Live Schema & Prompt Generator)  │
│ └── Modals (AddNode, AddRelation, EditRelation, Conf.) │
└────────────────────────────────────────────────────────┘
```

### 1. `useProjectManager` (`src/hooks/useProjectManager.ts`)
- Manages isolated project instances in `localStorage` under `nodebrief_projects_v1`.
- Auto-saves mutations with a **500ms debounce timer** to eliminate disk churn while typing.
- Project switching, creation, and deletion operate with zero page reloads.

### 2. `useHistoryState` (`src/hooks/useHistoryState.ts`)
- Encapsulates deep-cloned canvas topology snapshots (`historyPast`, `historyFuture`).
- Provides bounded history stack (up to 30 snapshots) with non-destructive undo and redo.

### 3. `useCanvasShortcuts` (`src/hooks/useCanvasShortcuts.ts`)
- Global window keyboard listener for `Ctrl+Z` / `Cmd+Z` and `Ctrl+Y` / `Cmd+Shift+Z`.
- Automatically ignores key events when focused in inputs, textareas, or modal forms.

---

## 4. Graph Layout & Auto-Layout Engine (`src/utils/dagreLayout.ts`)

NodeBrief features an integrated hierarchical auto-layout engine powered by **Dagre**:
- **Directional Modes**: Supports horizontal left-to-right (`LR`) and vertical top-to-bottom (`TB`) hierarchies.
- **Dynamic Node Dimensions**: Calculates node height dynamically based on the number of property fields ($H = 48 + |fields| \times 28 \text{ px}$), preventing node overlaps.
- **Coordinate Sanitization**: Validates all layout calculations with `Number.isFinite()` guards to guarantee that `NaN` values are never emitted to React Flow or SVG attributes.

---

## 5. The Schema Compilation Pipeline

```
  ┌─────────────────────────┐
  │  React Graph State      │
  │  (nodes[], edges[])     │
  └────────────┬────────────┘
               │
               ▼
  ┌─────────────────────────┐
  │ Compiler Intermediary   │
  │ - Resolves FK targets   │
  │ - Groups relationships  │
  └────────────┬────────────┘
               │
       ┌───────┴────────────────────────┬────────────────────────┐
       ▼                                ▼                        ▼
┌───────────────┐              ┌────────────────┐       ┌─────────────────┐
│  schema.md    │              │ Prisma/SQL DDL │       │ LLM Prompt AST  │
│  - Markdown   │              │ - Data models  │       │ - System context│
│  - Attributes │              │ - Constraints  │       │ - Hardened tasks│
└───────────────┘              └────────────────┘       └─────────────────┘
```

### 1. Markdown Compilation
The compiler walks every node, rendering tables with primary keys and foreign key constraints:
- Attributes marked with `isPk: true` resolve to `uuid [pk]`.
- Attributes with `isFk: true` resolve to `uuid [ref: > Target.id]`.
- Edges map directly to relational symbols (`1:N` as `<`, `M:N` as `<>`).

### 2. LLM Context Prompt Compilation
The compiler extracts entities and relationships into an AI-ready structured format. Depending on the user's selected generator target (`Prisma Schema`, `TypeScript Types`, `SQL DDL`, or `System Prompt`), it prepends strict system instructions:

```text
// Prompt Context: NodeBrief Visual Schema
You are an elite data systems architect.
Given the following declarative visual graph schema parsed from the active NodeBrief workbench:

## GRAPH NODES:
- Entity: User (PK: id[uuid], email: string, role: enum(admin, member))
- Entity: Books (PK: id[uuid], title: string, author_id: fk(User.id), status: published)

## RELATIONSHIPS:
- User [1] --> [N] Books (has many [1:N])

## SYSTEM INSTRUCTION:
Generate a production-grade, hardened Prisma schema including relational indexes, cascading deletion behaviors, and timestamped audit fields.
```

---

## 6. SEO & AI/LLM Discoverability

NodeBrief implements a comprehensive discoverability layer for both human search engines and LLM crawler agents:
- **`public/robots.txt`**: Declares crawler permissions, pointing search engines and AI agents to sitemaps and LLM manifests.
- **`public/sitemap.xml`**: Standard XML sitemap index.
- **`public/llms.txt`**: Standard machine-readable AI agent index describing NodeBrief's capabilities, prompt format, and schema generation targets.
- **OpenGraph & Meta Tags**: High-resolution OpenGraph cards (`og:image`, `twitter:card`) embedded in `index.html`.

---

## 7. Testing & Quality Assurance

- **Vitest & React Testing Library**: All suites are fully typed in TypeScript:
  - `src/tests/Canvas.test.tsx`: Canvas rendering, entity creation, field addition, and auto-layout.
  - `src/tests/RelationModal.test.tsx`: Double-click editing modal and cardinality default synchronization.
  - `src/tests/ConfirmationModal.test.tsx`: Delete confirmation dialog triggers and callbacks.
  - `src/tests/DagreLayout.test.ts`: Dagre hierarchical layout positioning and coordinate integrity.
  - `src/tests/ProjectDatabase.test.ts`: Local storage multi-project initialization and serialization.
  - `src/tests/Export.test.ts`: Schema markdown, TypeScript, and SQL compilation pipelines.
  - `src/tests/RightOutputPanel.test.tsx`: Dual-tab switching, code generator toggles, and clipboard copying.

---

## 8. Core Pivot to Idea-Validation Framework 💡

### 1. Architectural Intent Shift
- **Problem Statement:** The initial engine generated infrastructure artifacts (SQL, Prisma schemas) too early in the ideation phase, forcing engineers into concrete implementation structures before validating user needs.
- **Architectural Solution:** Pivoted the generation engine to treat canvas maps as abstract conceptual entities, transforming the downstream compiler into a strategic prompt pipeline for Large Language Models (LLMs).

### 2. Strategic Portfolio Impact
- Documenting this shift shows hiring managers that you understand engineering efficiency: avoiding building code for unvalidated ideas.
- It highlights your knowledge of context window engineering—using custom canvas topologies to feed high-fidelity context maps directly into generative AI systems for rapid business analysis.
