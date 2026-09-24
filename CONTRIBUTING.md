# Contributing to NodeBrief ⚡

Thank you for your interest in contributing to **NodeBrief**! We welcome contributions from developers, designers, and data architects of all skill levels.

---

## 🛠️ Development Setup

### 1. Fork & Clone
```bash
# Fork the repo on GitHub, then clone your fork:
git clone https://github.com/matakltm-code/nodebrief.git
cd nodebrief
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🧪 Testing & Quality Assurance

Before submitting a pull request, ensure all linting and test suites pass locally:

```bash
# Type check and lint codebase (enforces noUnusedLocals & noUnusedParameters)
npm run lint

# Run all automated Vitest unit test suites
npm test

# Build application for production bundle verification
npm run build
```

---

## 📐 Project Architecture Guidelines

- **Component Design**: Functional React components with hooks.
- **Custom Hooks**: Stateful logic lives in `src/hooks/` (`useProjectManager`, `useHistoryState`, `useCanvasShortcuts`).
- **Modal Dialogs**: Dialog components live in `src/components/modals/`.
- **Canvas Nodes & Edges**: Custom React Flow elements live in `src/components/flow/`.
- **Styling**: Tailwind CSS utility classes exclusively.
- **Icons**: `lucide-react`.

---

## 🚀 Pull Request Workflow

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit with conventional messages:
   ```bash
   git commit -m "feat(canvas): add snap-to-grid coordinate alignment"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request targeting the `main` branch.

---

## 📜 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

---

## 👤 Maintainer

Created and maintained with ❤️ by [Micheal Ataklt](https://github.com/matakltm-code).
