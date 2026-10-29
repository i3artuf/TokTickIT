# TokTickIT — Sprint 4 UI Specification
`docs/lab-04/ui-spec.md`

## 1. IT Staff Dashboard (`/dashboard`, IT Staff/Admin)

### 1.1 Structure
- Audit correction (2026-10-29): **Recent Tickets** is the global authorized recent list, with
  View all opening `/staff/queue`. **My Recent Actions Taken** is a separate list of up to five
  actions performed by the session user in the last seven Bangkok calendar days, linking to
  their Tickets, with an explicit empty state.
- Header: "Welcome back, {firstName}!" + subtitle + a **Refresh** action.
- Metric card row: **New**, **Open** (includes `Reopened` Tickets — see `specification.md`
  BR-12), **In Progress**, **Waiting for Requester**, **My Assigned** (current user as Ticket
  Owner). Each card: label, large numeric value, small "Δ from yesterday" trend (optional — omit
  entirely if the trend value is unavailable rather than showing a placeholder).
- Two-column content row:
  - **My Recent Tickets** (left, wider): up to 5 Tickets ordered by `updatedAt` desc, each row
    showing Ticket number, title, status badge, and updated date. "View all" link routes to the
    Ticket Queue filtered to the current user's owned Tickets.
  - **Quick Actions** (right): Search Tickets, My Queue — icon + label buttons. Note: "Create
    Ticket" is not shown for IT Staff/Admin (per Lab 3 Decision D-5 / SEC-09; only Requesters
    may create Tickets).

### 1.2 Interaction
- Open links to `/staff/queue?status=DASHBOARD_OPEN`, including both Open and Reopened.
  The Requester My Open card links to `/my-tickets?status=DASHBOARD_OPEN`, including New, Open,
  Waiting for Requester, and Reopened. Each destination exposes the selected group in its filter.
- Each metric card is a link/button; activating it opens the Ticket Queue pre-filtered to that
  status (or to "owned by me" for My Assigned). Cards are reachable and activatable by keyboard
  (`Tab` + `Enter`/`Space`), with a visible focus ring.
- Each row in "My Recent Tickets" opens that Ticket's Detail screen.
- **Refresh** re-fetches dashboard data without a full page reload; shows the existing values
  (not skeletons) with a subtle loading indicator on the refresh control itself.

### 1.3 Feedback States
| State | Behavior |
|---|---|
| Loading (first load) | Skeleton cards + skeleton list rows, matching Lab 2/3 skeleton conventions. |
| Empty (a card's count is 0) | Card still renders with value `0`; no separate empty graphic on the card itself. |
| Empty ("Recent Tickets" has no rows) | Standard empty-state block: icon, "No recent tickets", short helper text, Browse the queue link. |
| Forbidden (Requester hits this route) | Redirect to the Requester Dashboard; never render staff data. |
| Safe API failure | Standard error banner ("Couldn't load your dashboard. Try again.") with a Retry button; metric cards do not silently show stale or zero values as if they were real. |

### 1.4 Responsive
- Desktop: 5 metric cards in one row; two-column content row.
- Tablet: metric cards wrap to a 3+2 grid; content row collapses to a single column (Recent
  Tickets above Quick Actions).
- Mobile: metric cards stack 2-per-row (or 1-per-row on the narrowest devices); content sections
  stack vertically; no horizontal scroll anywhere on the page.

---

## 2. Requester Dashboard (`/dashboard`, Requester)

### 2.1 Structure
- Header: "Welcome, {firstName}!" + subtitle.
- Metric card row: **My Open Tickets**, **In Progress**, **Resolved**, **Closed** — each with a
  "View all" link beneath the value, routing to My Tickets filtered by that status. The four
  cards are mutually exclusive by current status (`specification.md` BR-11): a Ticket in
  `In Progress` counts only on the "In Progress" card, never also on "My Open Tickets".
- Two-column content row: **My Recent Tickets** (left) with "View all" → My Tickets; **Quick
  Actions** (right): Create Ticket, View My Tickets.

### 2.2 Interaction & Ownership
- Every value on this screen is computed from Tickets owned by the authenticated Requester only;
  the UI never sends or accepts a Requester ID from the client — the backend derives it from the
  session (defense in depth alongside the backend's own scoping).

### 2.3 Feedback States
Same pattern as §1.3 (loading skeletons, `0`-value cards, empty "Recent Tickets" block with
Create Ticket CTA, standard error banner with Retry). A Requester with zero Tickets sees all four
cards at `0` and the empty-state block — this is a normal, tested state (BR seed data covers it).

### 2.4 Responsive
Same breakpoint behavior as §1.4, with 4 metric cards instead of 5 (2×2 on tablet/mobile).

---

## 3. Actions Taken Panel (on existing Ticket Detail screen)

### 3.1 Placement & Structure
- New section on Ticket Detail, below the existing Public Comments / Internal Notes tabs (or as
  its own tab, "Actions Taken" — reuse the existing tab component), visible to all roles that can
  view the Ticket.
- **List/table mode** (default): rows ordered by `actionDateTime` descending. Each row shows:
  date/time, short description (truncated), result (truncated), performed-by name,
  follow-up badge (shown only if `followUpRequired = true`).
- Row expands (click/`Enter`) to a **view mode** showing the full Description, Result, Follow-up
  Note (if any), and Attachment Notes.
- **"Add Action Taken"** button, visible only to IT Staff/Admin, opens **create mode** — a form
  (inline panel or modal, reusing the existing Lab 2/3 form/modal component) with fields:
  Description (textarea, required), Result (textarea, required), Follow-Up Required? (toggle),
  Follow-up Note (textarea, shown/required only when the toggle is on), Attachment Notes
  (textarea, optional). Action Date/Time and Performed By are not shown as editable inputs — they
  are set by the server and surfacing them as read-only labels after save is sufficient.
- **Edit affordance**: an "Edit" action appears on a row only when the current user is its
  creator and the 15-minute window (BR-10) has not elapsed, or the current user is an
  Administrator. Once the window elapses, the row becomes fully read-only for its creator — no
  disabled button with a misleading tooltip; the action is simply absent, with a tooltip on hover
  of the row explaining "Edit window has passed."

### 3.2 Role Behavior
- **Requester**: entire panel is read-only — list and expand, no create/edit affordances
  anywhere, even if a Ticket status change occurred via another tab.
- **IT Staff/Admin**: full read + create + edit (per §3.1 edit-window rule). If the Ticket is
  `Cancelled`, the "Add Action Taken" button is hidden and replaced with inline text ("This
  Ticket is cancelled; no further actions can be recorded.") — the backend also rejects the
  write independently (AC-12).

### 3.3 Feedback States
| State | Behavior |
|---|---|
| Loading | Skeleton rows in the list area. |
| Empty | "No actions recorded yet." message; Add Action Taken button still available (IT Staff/Admin) if the Ticket is not Cancelled. |
| Validation error (missing Follow-up Note) | Inline field-level error under the Follow-up Note field; form does not close; entered values are preserved. |
| Submit in flight | Submit button shows a spinner and is disabled to prevent double submission (client-side complement to the required `Idempotency-Key` + server-side fallback de-dup, FR-15/BR-17). |
| Conflict (stale edit) | On save, if the server returns 409 `STALE_UPDATE`, show a banner: "This action was updated elsewhere. Reload to see the latest version," with a Reload action; the user's in-progress edits are kept in a recoverable draft state rather than discarded silently. |
| Forbidden write attempt reaches the client somehow | Standard 403 error toast; no partial UI state change. |

### 3.4 Responsive
- Desktop/tablet: table layout (columns: Date/Time, Description, Result, Performed By,
  Follow-up).
- Mobile: table collapses to a stacked card-per-row layout (each field as a labeled line) to
  avoid horizontal scroll, matching the Lab 2/3 mobile table pattern.

---

## 4. Ticket Status Control (on Ticket Detail)

### 4.1 Structure & Behavior
- A single control (dropdown or segmented control, reusing the existing Lab 2/3 component) next
  to the Ticket's status badge.
- Options shown are computed from the current status + current user's role against the matrix in
  `specification.md` §5.1 (FR-07) — **only valid next statuses appear as options, full stop.**
  Invalid transitions are never rendered, not even as a disabled option with an explanatory
  tooltip: the control's option list itself is the source of truth for what's permitted, so
  there's nothing for a disabled state to add.
- If the current status + role combination has **zero** valid next statuses — for example, a
  Requester viewing a Ticket they cannot cancel (already `In Progress` or later) — **no control
  renders at all**; the screen shows only the status badge, with no dropdown, no disabled
  affordance, and no tooltip on the badge itself.
- On selecting a new status, a confirmation step is required for the `Resolved`, `Closed`, and
  `Cancelled` transitions (these are consequential); `In Progress` / `Waiting for Requester` /
  `Reopened` apply immediately.
- On success, the status badge in the Ticket summary header refreshes immediately from the
  response payload (no full page reload) — this is the "successful changes must refresh the
  Ticket summary status" requirement (handout §8.4).
- **On a `409`, branch on the error `code` first, then — for `STALE_UPDATE` specifically —
  compare the returned current status to what was requested, per `specification.md` §10.1 /
  `api-spec.md` §2.1:**
  - `INVALID_TRANSITION` (only reachable via a direct/crafted API call, since the UI never offers
    an invalid option): show a generic "That change isn't allowed" toast, and refresh the status
    from the response.
  - `STALE_UPDATE` **where `data.current.status` differs from the status just requested** — a
    genuine external conflict (someone else changed the Ticket first, AC-07): show the conflict
    banner used elsewhere in this app ("This ticket was changed elsewhere. Reload to see the
    latest version.") and refresh the status from the response before letting the user retry.
  - `STALE_UPDATE` **where `data.current.status` matches the status just requested** — the
    server now holds exactly the status just requested. Treat this as "already applied,"
    regardless of exactly why it matches: most often this is the client's own submission (a
    double-click, or a network retry whose original attempt actually landed) landing a second
    time (AC-16); rarely, it could instead be a **different** actor independently choosing the
    same target status at nearly the same moment — the status match alone cannot tell these
    apart (`specification.md` Assumption #15). **Do not show the conflict banner in either case**
    — that message implies someone *else* changed the Ticket to something *different*, which
    isn't informative here even in the rare coincidental scenario, since the Ticket already
    reflects what this client wanted. Instead, resync the status badge from `data.current`
    silently; at most, a brief neutral confirmation (e.g. the badge simply reflecting the
    already-applied status) is enough. No error toast, no banner.
- A disable-while-submitting affordance on the control (to avoid the extra round trip in the
  first place) is still good practice, but is not required for correctness — the branching above
  guarantees the right outcome either way, unlike the Actions Taken create form (§3.3), which
  does need its own submit-guard because a `POST` has no prior state to compare against.

### 4.2 Advisory "Looks Resolved" (Requester only)
- Separate, clearly secondary control near the status area, visible to Requesters on their own
  Tickets, labeled "Mark as looks resolved" (checkbox or toggle). Activating it calls the
  appears-resolved endpoint; it never changes the visible status badge, and copy next to it
  states plainly: "This lets IT Staff know you think it's fixed — they'll still confirm and close
  it."
- This flag is automatically reset to unchecked if the Ticket is later Reopened or the Requester
  edits the Ticket (`specification.md` BR-16); the control reflects the current server value on
  every load rather than assuming its own last-set state persists.

---

## 5. Navigation, Visual Consistency & Accessibility (applies to all of the above)

- Dashboard link appears in the primary nav for every role, routing to `/dashboard`, with the
  active-page indicator matching the existing nav convention.
- Status badges reuse the existing Lab 2/3 color + icon/text pairing so status is never conveyed
  by color alone; follow-up badges on Actions Taken rows follow the same non-color-alone rule
  (icon + short text, e.g., "⚑ Follow-up needed").
- All new interactive elements (cards, rows, buttons, toggles) are reachable by keyboard, have a
  visible focus outline, and carry a semantic label/`aria-label` where the visible text alone is
  ambiguous (e.g., an icon-only quick action).
- No modal used in this sprint (edit forms, confirmations) traps focus permanently or is missing
  a keyboard-reachable close action.
- No screen introduces horizontal page scroll at any breakpoint; wide tables (Actions Taken on
  desktop) scroll only within their own container if content genuinely overflows.
- Any leftover placeholder text, temporary debug UI, or duplicate controls from Labs 1–3 found
  during hardening are removed as part of this sprint, not left "for later."

---

## 6. Visual & Accessibility Checklist

The following checklist has been fully completed and verified for all Lab 4 screens before submission. Each item has been tested and verified at desktop (1280 px), tablet (768 px / 820 px), and mobile (375 px) widths:

- [x] **Design consistency** — all new components use Zen Green design tokens (`--zen-primary`, `--zen-bg`, `--zen-surface`, typography, spacing, border radii) matching Labs 1–3 screens. Verified via `STYLE-01` and `artifacts/lab-04/screenshots/`.
- [x] **Dashboards** — Metric cards are properly aligned, equally sized, and readable across all breakpoints (grid 5 cards on desktop, 3+2 on tablet, stacked 1 col on mobile); numeric values use consistent font weight (700) and size (2rem). Verified via `RESP-01` and dashboard screenshot suites.
- [x] **Actions Taken** — the panel/table and create/edit form are visually consistent with existing Public Comments / Internal Notes styling; follow-up badges use icon + text (`BiCheckCircle` / `BiClockHistory`), not color alone. Verified via `STYLE-02` and `ActionsTaken.test.tsx`.
- [x] **Editable / read-only fields** — editable form fields have clear input affordance (1px solid border, white background, interactive focus); read-only summary and requester views are visually distinct with muted backgrounds and disabled/plain text indicators. Verified in `TicketDetail.tsx` and `TicketWorkflow.tsx`.
- [x] **Validation placement** — inline error messages appear directly below the relevant input field with dedicated `data-testid` (`*-error`); error states use the standard red/error token (`#dc3545` / `.invalid-feedback`), not custom colors. Verified via `E2E-02` and component test suites.
- [x] **Keyboard focus ring & accessibility labels** — every interactive element (metric cards, recent ticket rows, buttons, inputs, modal dialogs) has a visible `2px solid` focus outline (`:focus-visible`) and semantic or `aria-label` attributes; keyboard tab order is strictly sequential. Verified via `A11Y-01` and automated `@axe-core/playwright` scan (`A11Y-02` with 0 violations).
- [x] **No clipping** — no text, badge, card, or button is clipped or truncated beyond its container at any breakpoint (1280px, 820px, 375px). Multi-line descriptions wrap safely with `overflow-wrap: break-word`.
- [x] **No overlapping controls** — no interactive elements overlap or obscure each other at any breakpoint, including when validation error banners or optimistic concurrency warning banners are rendered.
- [x] **No horizontal overflow** — no page-level horizontal scrollbar appears at 375 px, 768 px, or 1280 px (`window.scrollX === 0` invariant); wide Action Taken tables reflow to stacked card layouts on mobile (`RESP-02`), and pre-formatted text wraps within its responsive card bounds. Verified via `RESP-01` and `RESP-02`.

---

## 7. `data-testid` Conventions (Lab 4 Components)

Following the Lab 3 convention of explicit `data-testid` attributes for Playwright E2E and
component tests. All new Lab 4 components should use these identifiers:

### IT Staff Dashboard
`staff-dashboard-card-new`, `staff-dashboard-card-open`, `staff-dashboard-card-in-progress`,
`staff-dashboard-card-waiting`, `staff-dashboard-card-my-assigned`,
`staff-dashboard-recent-tickets`, `staff-dashboard-refresh-btn`,
`staff-dashboard-quick-action-search`, `staff-dashboard-quick-action-queue`.

### Requester Dashboard
`requester-dashboard-card-open`, `requester-dashboard-card-in-progress`,
`requester-dashboard-card-resolved`, `requester-dashboard-card-closed`,
`requester-dashboard-recent-tickets`, `requester-dashboard-quick-action-create`,
`requester-dashboard-quick-action-my-tickets`.

### Actions Taken Panel (Ticket Detail)
`actions-taken-table`, `actions-taken-row-{id}`, `actions-taken-add-btn`,
`actions-taken-form`, `actions-taken-description-input`, `actions-taken-result-input`,
`actions-taken-follow-up-toggle`, `actions-taken-follow-up-note-input`,
`actions-taken-attachment-notes-input`, `actions-taken-submit-btn`,
`actions-taken-edit-btn-{id}`, `actions-taken-empty-state`,
`actions-taken-cancelled-notice`.

### Ticket Status Control
`ticket-status-select`, `ticket-status-confirm-dialog`,
`ticket-status-confirm-btn`, `ticket-status-cancel-btn`,
`ticket-status-conflict-banner`, `ticket-status-badge`.

### Advisory "Looks Resolved"
`appears-resolved-toggle`, `appears-resolved-helper-text`.
