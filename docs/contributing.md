# Contributing to NodeBrief 🤝

Thank you for your interest in contributing to **NodeBrief**! We welcome bug fixes, feature proposals, UI enhancements, and documentation improvements from the open-source community.

---

## 🛠️ Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/matakltm-code/nodebrief.git
   cd nodebrief
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Testing & Code Quality Guidelines

Before submitting any code changes, ensure all quality assurance checks pass cleanly:

1. **Strict TypeScript & Linting Check**:
   ```bash
   npm run lint
   ```
   NodeBrief enforces `"noUnusedLocals": true`, `"noUnusedParameters": true`, and `"strictNullChecks": true`. Ensure there are zero TypeScript compiler warnings or syntax errors.

2. **Vitest Unit Test Execution**:
   ```bash
   npm test
   ```
   All test suites under `src/tests/` must pass with 100% green status.

3. **Writing New Tests**:
   - For UI components: Use React Testing Library within `src/tests/*.test.tsx`.
   - For logic utilities: Write pure TypeScript tests in `src/tests/*.test.ts`.

---

## 📐 Code Style & Architecture Conventions

- **Component Design**: Functional React components with hooks. Keep components modular and single-purpose.
- **Custom Hooks**: Extract stateful domain logic into dedicated hooks under `src/hooks/` (e.g. `useProjectManager`, `useHistoryState`).
- **Modal Dialogs**: Place standalone modal dialogs under `src/components/modals/`.
- **Canvas Elements**: Place custom React Flow nodes and edges under `src/components/flow/`.
- **Styling**: Tailwind CSS utility classes exclusively. No inline styles or separate CSS modules.
- **Theme Palette**: Strict pure white background theme (`#FFFFFF`) with 1px neutral gray borders (`border-slate-200`) and the signature `#FF0071` active highlight color.
- **Icons**: Use `lucide-react` icons exclusively.

---

## 🚀 Pull Request (PR) Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "feat(canvas): add snap-to-grid coordinate alignment"
   ```
3. Push to your fork and submit a Pull Request targeting the `main` branch.
4. Ensure the GitHub Actions CI pipeline passes all checks on your PR.

---

## 👤 Maintainer

Created and maintained with ❤️ by [Micheal Ataklt](https://github.com/matakltm-code).
