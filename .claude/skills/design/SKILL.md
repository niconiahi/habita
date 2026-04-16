---
name: design
description: Design-to-code workflow. Use when implementing UI from Figma, styling components, or working with design tokens.
---

This skill guides how designs are translated into code

## Figma file

- File key: `pwgsZM9ts0fJjczhT6bx5B`
- Components page node: `427:274`

## Figma MCP tools — when to use what

1. `get_screenshot(nodeId, fileKey)` — first step, always works. Get a visual overview of the design.
2. `get_design_context(nodeId, fileKey)` — primary tool for implementation. Returns reference React+Tailwind code, text styles, and a screenshot. **Must adapt to Svelte + native CSS.** Sometimes fails with "nothing selected" — retry with a child frame node ID.
3. `get_variable_defs(nodeId, fileKey)` — returns design tokens and **text style definitions** used in a node. This is how you get exact font sizes, weights, line-heights. Returns entries like `"heading/lg": "Font(family: ..., weight: 700, size: font/size/heading/lg, lineHeight: 1.4)"`.
4. `get_metadata(nodeId, fileKey)` — XML structure of a node/page. Useful for discovering child node IDs and component names. Use `0:1` for the first page.
5. `search_design_system(query, fileKey)` — search for components, variables, styles across libraries. Filter with `includeComponents`, `includeVariables`, `includeStyles`.
6. `get_screenshot` on `427:274` gives the full components page overview. Then use `get_metadata` on it to find specific component node IDs.

## Design tokens

1. Never use hardcoded values (colors, spacing, radii, font sizes, etc.) — strictly use the design tokens defined in `apps/web/src/lib/styles/tokens.css`
2. If a Figma design uses hardcoded values instead of tokens, do not silently replicate them. Flag the discrepancy to the user before proceeding
3. When a needed token does not exist in `tokens.css`, inform the user rather than inventing a new one or using a hardcoded value

## Text styles

All Figma text styles are defined as global CSS classes in `apps/web/src/lib/styles/text_styles.css`. These are imported via `styles.css`.

### Available classes (from Figma `get_variable_defs`)

| Class | Size | Weight | Line-height | Figma style |
|-------|------|--------|-------------|-------------|
| `.heading-lg` | `--font-size-heading-lg` (32px) | 700 | 1.4 | heading/lg |
| `.heading-md` | `--font-size-heading-md` (28px) | 700 | 1.4 | heading/md |
| `.heading-sm` | `--font-size-heading-sm` (24px) | 700 | 1.4 | heading/sm |
| `.body-md-medium` | `--font-size-body-md` (16px) | 500 | 1.4 | body/md/medium |
| `.body-md-bold` | `--font-size-body-md` (16px) | 700 | 1.4 | body/md/bold |
| `.body-sm-medium` | `--font-size-body-sm` (14px) | 500 | 1.4 | body/sm/medium |
| `.body-sm-bold` | `--font-size-body-sm` (14px) | 700 | 1.4 | body/sm/bold |

All use `font-family: var(--font-family-body)` ("DM Sans").

### Rules

- **Never define `font-size`, `font-weight`, `font-family`, or `line-height` inline in component `<style>` blocks.** Use the global text style class on the HTML element instead.
- Scoped CSS should only handle layout (flex, grid, gap, padding) and color — typography comes from text style classes.
- When a text element doesn't match any defined text style (e.g., 0.75rem badge text), keep it inline and note it as an exception.
- `Content.Title` already applies `heading-lg` via its class.

### Example

```svelte
<!-- Good: text style class + scoped color -->
<span class="body-md-medium label">Nombre</span>
<style>
  .label { color: var(--color-text-body); }
</style>

<!-- Bad: inline font properties -->
<span class="label">Nombre</span>
<style>
  .label {
    font-family: var(--font-family-body);
    font-size: var(--font-size-body-md);
    font-weight: 500;
    line-height: 1.4;
    color: var(--color-text-body);
  }
</style>
```

## Fonts

- **DM Sans** — primary font, loaded in `apps/web/src/lib/styles/fonts.css` (Regular 400, Medium 500, Bold 700)
- **Geist Mono** — legacy font for admin/old pages
- The `(centered)` layout sets `font-family: var(--font-family-body)` on its container, so all pages within inherit DM Sans

## Component location

- **Design system components** → `$lib/components/` (Tab, TabGroup, SegmentedButton, Button, Togglable, Badge, Avatar, etc.)
- **Page-specific components** → `routes/.../components/` colocated with the page they serve (AdminCard, Visualizer, DetailRow, PricingCard, etc.)

### Design system components inventory (from Figma `427:274`)

| Component | Figma node | Status |
|-----------|-----------|--------|
| Button | `433:2453` | Implemented |
| Togglable | `948:1757` | Implemented |
| Tab | `807:408` | Not yet |
| TabGroup | `807:1009` | Not yet |
| SegmentedButton | `807:4642` | Not yet |
| Badge | `435:798` | Not yet |
| Avatar | `436:1306` | Not yet |
| Card | `931:678` | Not yet |
| Icon | `440:1311` | Not yet |
| Input | `1050:1042` | Implemented (Formulary/Input) |
| Link | `1090:1133` | Not yet |
| Modal | `1329:1669` | Not yet (using native `<dialog>`) |
| Carousel | `496:550` | Implemented |
| Header | `526:290` | Implemented |
| ContainerCentered | `670:5193` | Implemented (layout) |
| PropertyCard | `507:654` | Not yet |
| ToggleButton | `948:1319` | Not yet |
| RoomMap | `807:1148` | Implemented |

## Layout — `(centered)` group

All redesigned public-facing pages live under `routes/(centered)/`. This layout provides:
- Header component with logo + user popover + notifications
- White background (`--color-absolute-white`)
- Centered content at `--dimension-screen-lg` (1024px) max-width
- DM Sans font family inherited by all children
- Vertical padding `--dimension-spacing-6`

### Pages in `(centered)`

| Page | Route | Status |
|------|-------|--------|
| Login | `/(centered)/login` | Done |
| Signup | `/(centered)/signup` | Done |
| Signup verification | `/(centered)/signup/verification` | Done |
| Onboarding | `/(centered)/onboarding` | Done |
| Visit selection (book) | `/(centered)/properties/[property_id]/book` | Done |
| Book success | `/(centered)/book/success` | Done |
| Property detail | `/(centered)/properties/[property_id]` | In progress |
| Property list | `/(centered)/properties` | Not yet |

## User avatar

- Default avatar SVG at `static/images/default-avatar.svg`
- Set in Better Auth's `databaseHooks.user.create.before` when `user.image` is falsy (email signups)
- Google OAuth users keep Google's profile image
- Use `user.image` everywhere in the app — always truthy, no null checks needed

## Workflow checklist

When implementing a Figma design:

1. Get screenshot of the target node to understand the layout
2. Get design context for specific sub-components (text styles, spacing, colors)
3. Get variable defs to extract exact token values
4. Check existing components in `$lib/components/` before creating new ones
5. Use text style classes — never inline font properties
6. Use design tokens from `tokens.css` — never hardcode values
7. Page-specific components go in `routes/.../components/`
8. Design system components go in `$lib/components/`
