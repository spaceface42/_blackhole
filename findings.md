# Code Quality Findings

## Scope
- Reviewed and hardened `admin/admin.js` and `admin/admin.html`
- Ran diagnostics and basic project checks

## Checks Executed
- `node --check admin/admin.js` → pass
- `node scripts/build-partials.mjs` → pass (`Built dist`)
- VS Code diagnostics:
  - `admin/admin.js` → no diagnostics
  - `admin/admin.html` → no diagnostics

## Security Findings and Status

### 1) Token persisted in localStorage
- **Severity:** High
- **Status:** Fixed
- **Original location:** `admin/admin.js:194` (`SafeStore`)
- **Fix:** PAT is no longer written to localStorage. Local storage now keeps non-sensitive form state only; PAT is stored in sessionStorage for the current tab session when remember is checked. Legacy localStorage PAT is auto-migrated to sessionStorage and scrubbed.

### 2) No Content-Security-Policy meta tag
- **Severity:** High
- **Status:** Fixed
- **Location:** `admin/admin.html:7`
- **Fix:** Added CSP meta policy:
  - `default-src 'self'`
  - `script-src 'self'`
  - `connect-src 'self' https://api.github.com`
  - `img-src 'self' data: blob: https:`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src https://fonts.gstatic.com data:`
  - `frame-src 'self' blob:`
  - `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`

### 3) `innerHTML` with partially escaped values
- **Severity:** Medium
- **Status:** Fixed for reported hotspots
- **Locations fixed:**
  - `admin/admin.js:1206` (`ConnectView.updateRemote`)
  - `admin/admin.js:1582`, `admin/admin.js:1599` (`DeploymentView.showPending/showRun`)
- **Fix:** Replaced `innerHTML` rendering with `textContent` for these status strings.
- **Note:** Other `innerHTML` usages remain in unrelated UI list rendering paths and were not part of the requested hotspot set.

### 4) Media MIME trust is browser-supplied (`file.type`)
- **Severity:** Medium
- **Status:** Fixed
- **Location:** `admin/admin.js:807`, `admin/admin.js:845`
- **Fix:** Added byte-signature validation before upload:
  - JPEG magic bytes
  - PNG signature
  - GIF87a/GIF89a header
  - WebP RIFF/WEBP header
  Upload now fails if content signature does not match file extension.

### 5) Preview iframe sandbox behavior may confuse users
- **Severity:** Informational
- **Status:** Clarified
- **Locations:**
  - `admin/admin.html:127` (`sandbox=""` already present and good)
  - `admin/admin.html:118` (new preview-tab tooltip)
  - `admin/admin.js:1013` (existing preview note remains)
- **Fix:** Added explicit tooltip to preview tab: “Sandboxed standalone preview; site CSS is not loaded.”


## Robustness / Logic Findings and Status

### 6) No AbortController on fetch requests
- **Severity:** Medium
- **Status:** Fixed
- **Locations:** `admin/admin.js:289`, `admin/admin.js:2078`
- **Fix:** Added cancellation plumbing in API requests and file-open flow:
  - `GitHubClient.request(...)` now accepts `signal`
  - `AppController.openFile(...)` aborts previous in-flight open request before starting a new one
  - stale responses are ignored if a newer open request is active

### 7) No fetch timeout
- **Severity:** Medium
- **Status:** Fixed
- **Location:** `admin/admin.js:289`
- **Fix:** Added timeout handling in `GitHubClient.request(...)` with default `REQUEST_TIMEOUT_MS = 20000` and timeout-specific error status (`408`) plus user-facing message mapping.

### 8) `tryRecoverStaleShaCommit` recovery failures unclear
- **Severity:** Medium
- **Status:** Fixed
- **Location:** `admin/admin.js:2205`
- **Fix:** In `saveFile(...)`, recovery errors now explicitly:
  - show the conflict UI,
  - set status to `recovery failed`,
  - show a clear actionable toast,
  - and stop ambiguous fallthrough.

### 9) `normalizeName`/create flow cleanup
- **Severity:** Low
- **Status:** Fixed
- **Location:** `admin/admin.js:2293`
- **Fix:** `createPartial(...)` flow now performs normalization and duplicate checks in a clearer single `try` block so normalization errors are handled consistently by the existing error path.

### 10) `validateProjectConfig` absolute-path validation gap
- **Severity:** Medium
- **Status:** Fixed
- **Locations:** `admin/admin.js:35`, `admin/admin.js:168`
- **Fix:** Added `isAbsoluteRepoPath(...)` helper and explicit rejection of absolute paths (`/x`, `C:\x`, `\server\share`) for repo-relative config fields.

## Other Findings (still open)

### A) Silent exception swallowing reduces debuggability
- **Severity:** Medium
- **Examples:** `admin/admin.js:214`, `admin/admin.js:218`, `admin/admin.js:276` and similar empty catches
- **Recommendation:** Route swallowed errors to a debug log/status channel.

### B) No formal lint/format/typecheck configuration present
- **Severity:** Medium
- **Location:** repository root
- **Details:** No ESLint/Prettier/TypeScript quality gates discovered.
- **Recommendation:** Add minimal lint configuration and CI quality checks.

### C) Large single-file architecture impacts maintainability
- **Severity:** Low
- **Location:** `admin/admin.js` (monolithic file)
- **Recommendation:** Incrementally split by concern when practical.

### D) Cache-busting uses `Math.random()`
- **Severity:** Low
- **Location:** `admin/admin.js:274`
- **Recommendation:** Prefer deterministic nonce strategy if needed for repeatable tests.

## Overall Assessment
- The requested security items are now addressed:
  - PAT localStorage persistence removed
  - CSP added
  - hotspot `innerHTML` status rendering removed
  - upload content signature checks added
  - preview sandbox behavior explicitly explained in UI
- Project remains functionally healthy under available checks.
