# UX Contract

## Product context

- Audience: strategy players, engine developers, and future AI researchers.
- Primary jobs: play a correct game; inspect state; replay and branch; prepare AI match configurations.
- Target market: global browser use.
- Active locale: English.
- Timezone/calendar: elapsed durations only; no civil-time data.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

The current assignment is the authoritative game-rule and product-behavior brief. No permissions, billing, privacy, retention, or legal flows exist in this phase.

| Domain / scope           | Authoritative source | Source type   | Reviewed date |
| ------------------------ | -------------------- | ------------- | ------------- |
| Game lifecycle and rules | Current assignment   | Product brief | 2026-09-04    |
| AI exclusions            | Current assignment   | Product brief | 2026-09-04    |
| Import/export lifecycle  | Current assignment   | Product brief | 2026-09-04    |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`
- Token ownership: DESIGN.md authored; exact CSS variable adapter maintained in `src/ui/styles.css`.
- Supported theme: dark tournament desk.
- Drift gates: DESIGN.md lint, premium audit, browser inspection, and UI tests.

## Canonical UI Map

| Capability     | Canonical owner                                   | Source of truth | Allowed variants                 | Verification                |
| -------------- | ------------------------------------------------- | --------------- | -------------------------------- | --------------------------- |
| Select/Listbox | Shared `SelectField` using native select          | UX contract     | native                           | keyboard + browser popup    |
| Form           | Shared `Field` components and explicit validation | UX contract     | editor / lab                     | integration tests           |
| Scrollbar      | Global application stylesheet                     | DESIGN.md       | stable-gutter geometry           | computed/browser inspection |
| Toast          | Shared live status region                         | UX contract     | success / warning / info / error | accessibility test          |
| Game lifecycle | `GameSession` service                             | Product brief   | live / history branch            | engine + UI integration     |

## Component behavior

| Component    | Default              | Hover           | Focus           | Active         | Disabled     | Busy           | Error                   |
| ------------ | -------------------- | --------------- | --------------- | -------------- | ------------ | -------------- | ----------------------- |
| Button       | tonal/outline        | brighter border | chartreuse ring | inset          | dim + reason | stable spinner | adjacent status         |
| Icon button  | labeled icon         | raised surface  | chartreuse ring | inset          | dim + reason | stable         | adjacent status         |
| Input/select | dark field           | border lift     | chartreuse ring | n/a            | dim          | n/a            | text + aria-invalid     |
| Textarea     | fixed resize, scroll | border lift     | chartreuse ring | n/a            | dim          | n/a            | text + aria-invalid     |
| History list | numbered moves       | surface lift    | chartreuse ring | current marker | n/a          | n/a            | persistent import error |

## Dataset navigation

Move history and received observer games are bounded by the current session/configuration and render as complete, internally scrollable lists. No search or pagination is needed in this phase. Empty states state what event will populate the list.

## Flow ledger

| Operation       | Trigger              | Pending               | Success destination | Success feedback    | Failure recovery            | Focus outcome          | Source ref    |
| --------------- | -------------------- | --------------------- | ------------------- | ------------------- | --------------------------- | ---------------------- | ------------- |
| Make move       | Board square         | piece animation       | live position       | event/status update | illegal target feedback     | moved square           | Product brief |
| Restart         | Restart              | confirmation dialog   | initial position    | status update       | cancel retains game         | board                  | Product brief |
| Import game     | Import game          | dialog button busy    | imported live state | status update       | dialog retains text/error   | board or invalid field | Product brief |
| Load editor     | Load position        | validation            | live position       | status update       | inline errors retained      | board or first error   | Product brief |
| Branch history  | Make historical move | confirmation dialog   | new live branch     | branch status       | cancel retains history view | board                  | Product brief |
| Save lab config | Save configuration   | immediate local write | same screen         | saved status        | in-page storage error       | save control           | Product brief |

## Navigation and responsive behavior

- Route-like tabs are in-page peers, keyboard navigable, and update document title.
- The desktop analysis grid becomes one natural document column on narrow screens.
- Board stays square; tables/charts retain horizontal or internal scrolling where needed.
- Focus rings and scroll margins prevent the sticky header from obscuring controls.

## Overlays and feedback

- Dialog primitive: shared Radix-based `Dialog`.
- Restart confirmation: warning intent, cancel initially focused.
- Toast/status: one polite live region, bottom-right, deduplicated by current message.
- Unsaved editor changes: closing is allowed because editor state remains in memory until the editor is reopened; resetting/clearing editor is explicit.
- Layer order: dialog overlay and content above sticky header; live status above normal panels.

## Async and resilience

The deterministic engine is synchronous. Clipboard and file import/export failures remain visible with retry guidance. Match Lab configuration persistence wraps local storage access and reports unavailability. No remote mutation or background job exists yet.

## Validation

- Engine deserialization and `validatePosition` are canonical.
- Forms use `noValidate`, inline errors, `aria-invalid`, referenced help/error text, and first-error focus.
- Non-sensitive serialized input is preserved after failure.
- Duplicate actions are blocked while a modal action is processing.

## Permission and clipboard

No permission model exists. Clipboard actions expose full non-secret engine state only after explicit activation and show success/failure in the shared status region.

## Verification

- Required: format check, ESLint, TypeScript, Vitest unit/integration/accessibility, production build, strict premium audit, DESIGN.md lint.
- Browser matrix: Chromium desktop and narrow viewport; keyboard flow; reduced motion; empty/error/success states.
- Canonical sibling comparison: Play, Match Lab, and Observer all use the same shell, buttons, fields, panels, dialogs, and status region.
