# Agent-oriented Copilot instructions for PR checks

Purpose: keep only the checks and guidance that an automated coding agent (Copilot-style) can perform reliably during a PR review. Manual tasks and interactive certification steps moved to `HUMAN-certification-checklist.md`.

Agent-capable checks (what the agent should do on each PR):

- Verify presence of required files: `capabilities.json`, `pbiviz.json`, `package.json`, `tsconfig.json`, `src/visual.ts`.
- Static scan for strictly forbidden patterns and unsafe APIs:
  - `fetch\(`, `XMLHttpRequest`, `WebSocket` usages
  - `eval\(`, `new Function\(`, `setTimeout\(.*\bFunction\b`, `setInterval\(.*\bFunction\b`
  - `innerHTML\s*=`, `D3.html\(` or other direct HTML injection points
  - Any `.min.js` or obviously minified JS/TS code committed to `src/`
- Validate `capabilities.json` does not include WebAccess privileges and that dataRoles/dataViewMappings exist.
<!-- TEMPORARILY DISABLED: TypeScript strictness check. Uncomment this line when ready to re-enable.
- Check TypeScript strictness: `tsconfig.json` contains `"strict": true` (or explicitly documents deviations).
-->
- Check `package.json` scripts include common targets: `lint`, `package` (or `pbiviz package`).
- Lint configuration: presence of ESLint config or `eslint` devDependency.
- Detect unsafe network or runtime requirements in source (hard-coded URLs, credentials, external service calls).
- Validate use of safe DOM APIs: prefer `textContent`, `setAttribute` over `innerHTML` in `src/` files.
- Search for `TODO`/`FIXME` comments that indicate unfinished security-sensitive code and flag them.
- Check spelling of user-facing string values and string literals (agent-built spellcheck; no external scripts required). Scan `stringResources/en-US/**` and `src/` and report likely misspellings with file/line locations.
- Verify code is not minified: simple heuristics such as very long single-line files or `.min.` in filenames under `src/`.
- Check for large bundled assets accidentally committed under `src/`.
- Run repository-wide text searches for banned patterns and report exact file/line matches in PR comments.
- Suggest automated fixes where safe and trivial (e.g., replace `innerHTML = x` with `textContent = x` when x is simple string literal), but do not apply changes that require semantic understanding without reviewer approval.

What the agent must not attempt automatically:

- Any operation that requires running or packaging the visual (`npm install`, `pbiviz package`, running Power BI Desktop/Service) unless explicitly allowed by a human maintainer.
- Submitting or interacting with external certification portals.

Notes for maintainers

- Keep this file focused on machine-checkable rules. Maintain a separate human checklist for steps that require environment, manual testing, or certification submission.
- When adding new automated checks, document the exact regex or rule and expected remediation message so the agent can create precise PR comments.

# Refer to `HUMAN-certification-checklist.md` for manual steps and interactive QA.