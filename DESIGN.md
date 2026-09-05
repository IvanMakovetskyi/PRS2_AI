---
version: alpha
name: "Rock Paper Scissors 2"
description: "A dark tournament analysis desk where a corner-to-corner race stays visible and inspectable."
colors:
  canvas: "#0C0817"
  surface: "#151024"
  surface-raised: "#211936"
  primary: "#7C5CFF"
  blue: "#48A8FF"
  red: "#FF5D87"
  signal: "#D7FF72"
  text: "#F7F2FF"
  text-muted: "#A99FBE"
  border: "#3A2E52"
  danger: "#FF6B6B"
  warning: "#FFCB6B"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
rounded:
  sm: "0.5rem"
  DEFAULT: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
spacing:
  xs: "0.375rem"
  sm: "0.625rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  board: {}
  button: {}
  panel: {}
  dialog: {}
  field: {}
---

# Rock Paper Scissors 2 Design System

## Overview

### Creative North Star

The interface takes its cues from a serious tabletop tournament broadcast desk: dark felt, crisp score instrumentation, luminous side markers, and one physical route across the table. It should feel built to study a game, not dressed like a generic cyberpunk dashboard.

### Product context and register

- **Audience and primary job:** Players and engine developers need to play, replay, edit, and inspect every deterministic state transition.
- **Target markets:** Global browser users; the assignment is the authoritative product brief.
- **Locale:** English in this phase. Domain values use locale-neutral algebraic coordinates and invariant serialized data.
- **Usage scene:** Desktop-first analysis sessions with a complete, usable narrow-screen layout.
- **Register:** Product. Dense information earns hierarchy through grouping, not decoration.
- **Memorable signature:** A restrained diagonal route from Red's `a1` target to Blue's `i9` target, echoed in the board target beacons.
- **Restraint:** Panels, forms, history, and inspector data use calm tonal surfaces and compact typography.
- **Anti-references:** Neon cyberpunk dashboards, casino interfaces, glassmorphism, and toy-like emoji boards; each would weaken legibility or analytical trust.
- **Token ownership/runtime mapping:** `DESIGN.md` is the authored source. Exact values map one-to-one to CSS custom properties in `src/ui/styles.css`, which shared UI primitives consume. `designmd lint`, the premium audit, and browser inspection are the drift gates.

## Colors

Canvas and surfaces are aubergine rather than neutral black. Blue and coral-red always identify the two sides with labels and shapes as non-color cues. Chartreuse is reserved for legal actions, focus, and successful readiness—not general decoration. Warning and danger remain semantically separate.

## Typography

Sora gives titles and concise section labels a geometric, competitive voice. DM Sans carries controls and explanatory copy. JetBrains Mono is limited to hashes, timing, indices, bitboards, and serialization. Body copy starts at 14px in dense areas and 16px for guidance; interactive labels do not use all caps.

## Layout

The Play workspace uses a board-led asymmetric grid: board and transport controls at left, live information and history at right, with the inspector spanning beneath. Match Lab and Observer reuse the same shell and panel primitives. At 1080px panels reflow; at 720px the board remains square, toolbars wrap, and secondary data follows the primary task in document order. Scrollbars reserve their gutter on bounded data panels.

## Elevation & Depth

Hierarchy comes from tonal layers and precise borders. The board may use a broad purple ambient shadow to establish the single focal plane. Static data panels remain flat; dialogs use overlay dimming and one raised shadow. Blur is limited to the sticky app header.

## Shapes

The 24px board radius is the most generous shape. Panels use 16px, controls 10–12px, and status chips use a compact pill. Pieces are circular tokens with an internal type silhouette. Target corners use clipped corner markers rather than another rounded badge.

## Components

### Foundational visual states

Enabled controls expose default, hover, visible focus, pressed, and disabled states without shifting geometry. Selection combines color, outline, and text. Busy controls preserve dimensions. Errors stay adjacent to the affected control. Loading is a compact app-owned spinner in reserved space; skeletons are not used.

### Buttons and actions

Buttons combine solid, outline, or ghost emphasis with brand, neutral, warning, or danger intent. Reset confirmation uses warning because the current game is recoverable only through explicit export; routine undo has no confirmation. Icon-only controls always have an accessible name.

### Navigation and data display

Three route-like tabs switch Play, Match Lab, and Observer and update the document title. Technical values use the mono face. Charts retain visible labels and textual empty states. History is a numbered list with semantic buttons, not a table.

### Forms and overlays

Platform-native selects are an intentional canonical choice; operating-system popup geometry is accepted in this global developer tool. Shared fields own labels, help, and errors. Radix Dialog owns modal semantics, focus containment, Escape, and restoration. Textareas are fixed-size with internal scrolling.

### Iconography

Lucide's 1.75px rounded strokes support navigation and utilities. Rock, Paper, and Scissors use purpose-built CSS/letter symbols because the type distinction is game state, never decoration.

### Motion

Movement and selection use 160–220ms ease-out transitions to communicate state. Dialogs fade and scale once. Reduced-motion mode removes transforms and limits fades to 80ms.

### Content and data visualization

Copy is direct and technical without sounding clinical. Actions name outcomes: “Load position,” “Return to live,” “Restart game.” Empty AI states explicitly distinguish missing providers from errors. Charts never display fabricated results.

## Do's and Don'ts

- **Do:** Keep the board and current turn visually dominant.
- **Do:** Pair every player color with a name, token shape, or icon.
- **Don't:** Spend chartreuse on decorative borders that compete with legal moves.
- **Don't:** hide engine truth behind vague summaries when exact state is available.

