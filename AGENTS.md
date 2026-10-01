# Superapps Workspace AI Agent Guidelines

This workspace uses strict milestone-driven development and requires adhering to the project documentation and architecture standards.

## 1. Documentation & Milestone-Driven Development
- **Mandatory References**:
  - Always consult `docs/DEVELOPER_GUIDE.md` for technical architecture, routing, design language, and detailed milestone breakdowns.
  - Always consult `docs/AI_DEVELOPER_AGENT_SPEC.md` for agent operating procedures, coding standards, and verification checklists.
  - Refer to `README.md` for project overview and environment setup.
- **Milestone Sequencing**:
  - Work must be organized and executed according to the defined milestones:
    - **Milestone 1**: Core Foundation & 8 Essential Modules *(Completed)*
    - **Milestone 2**: Cloud Sync & Enhanced Authentication *(Active / Next)*
    - **Milestone 3**: Rich Interaction Upgrades (Kanban DnD, WYSIWYG, Analytics)
    - **Milestone 4**: Data Portability & Backup Center (JSON/CSV export, Client encryption)
    - **Milestone 5**: Native PWA Superpowers (Web Share Target, File System Access)
  - When asked to implement or develop features, check the current milestone status, implement incremental changes, and update tests accordingly.

## 2. Architecture & Free-Tier Guardrails
- **100% Free Tier Invariant**: Never introduce paid APIs, server-side containers, or compute that requires a credit card.
- **Dual Persistence**: Every data mutation must support both Firebase Cloud Firestore (when configured and online) and browser `localStorage` fallback (when offline or in guest mode) in `src/services/dataService.ts`.
- **GitHub Pages SPA Routing**: Keep `public/CNAME` (`apps.k31.my.id`) and `public/404.html` intact for client-side routing without server 404s.

## 3. Verification & Git Workflow
- **Verification Gate**: Always run `npm run test` and `npm run build` before concluding a task. Both must pass with exit code 0.
- **Git Safety**: Never execute `git commit` or `git push` without explicit, direct user instructions. Always prepare a structured conventional commit message draft.
