# Form submission patterns

How to handle pending state, success feedback, and the "save" model for forms in Habita. Clarity-first.

## The three commitment levels

Every form action falls into one of three buckets. Pick the pattern that matches the bucket.

### Low-commitment — atomic single-field edits
Examples: organization name, construction year, CBU, fine percentage, tag toggles, photo delete, floor reorder.

Pattern: **optimistic + auto-save on blur (or change)**.
- No submit button.
- No spinner.
- Inline "Guardado ✓" microcopy that fades after 2s.
- `Cmd+Z` / undo where feasible.

This is the Linear pattern. Use it where mutations are atomic, commutative, and frequent.

### Medium-commitment — composed multi-field forms
Examples: warranty creation, period editing, member invite, property characteristics, contract sections.

Pattern: **explicit submit + always-show pending with minimum-hold + toast on success + stable button width**.
- Submit button with explicit verb ("Guardar", "Crear", "Eliminar").
- Pending state shown immediately on click: button disabled, label changes to gerund ("Guardando...", "Creando...", "Eliminando...").
- Minimum-hold-duration: pending state stays visible at least ~400ms even if the response arrives in 30ms. Hold from `started_at`, not from "we decided to show".
- No delay-before-show. The earlier "skip pending if response is fast" pattern looks elegant on paper but is twitchy in practice (browser repaint timing + reactivity batching create a race window where state can flash on/off in the same frame). Always-show eliminates the race entirely.
- Stable button width via grid-stacked labels (see `<Formulary.PendingLabel>` in this codebase) so the gerund vs verb width difference doesn't reflow.
- Toast on success ("Guardado").

This is the default for Habita. Most forms are medium-commitment.

### High-commitment — destructive or irreversible actions
Examples: contract activation, payment, account deletion, contract creation.

Pattern: **confirmation dialog + explicit pending + dedicated success/failure result**.
- Confirmation modal explaining consequences in plain Spanish.
- Explicit pending state on the confirm button.
- Dedicated result page or persistent toast — Peak-End rule applies most strongly here.
- Never auto-trigger; always require deliberate user action.

## Timing constants

Magic numbers everyone converges on. Sourced from Nielsen response-time research, Doherty Threshold (1982 IBM), and Material Motion guidelines on minimum perceptible state-change duration.

| Threshold | Meaning | Source |
|-----------|---------|--------|
| <100ms | Feedback rendering must land here to feel "instant." | Nielsen, Norman |
| <400ms | Conversational task throughput. | Doherty Threshold |
| ~250-500ms | Minimum perceptible hold for a visual state change to read as intentional, not glitchy. | Material Motion, motion design heuristics |
| >1s | Use stages or progress, never indeterminate spinner. | Nielsen, Goal-Gradient Effect |
| >10s | User loses focus. Background task + notification. | Nielsen |

For Habita's pending state: **400ms minimum-hold from click, no delay-before-show**. Show pending immediately on submit; hold visible at least 400ms even if response is faster. This is the only number that matters.

Why not delay-before-show: theoretically, "skip showing pending if response <100ms" preserves the instant-feel for fast operations. In practice, browser repaint timing + Svelte reactivity batching make the 100ms boundary fuzzy — fast responses can land in the same paint frame as the delayed-show, producing an on/off flash that's worse than either showing or not showing. Always-show with a hold floor sidesteps this entirely.

Doherty's 400ms is about *task throughput*, not feedback rendering. A 400ms hold on a button doesn't slow down a user filling out a form (their bottleneck is typing + thinking). The hold paces perception, it doesn't impede productivity.

## Why not full-Linear (auto-save everywhere)

Linear works for Linear because:
- Atomic field-level mutations (one field = one HTTP call, ~50 bytes).
- Commutative (order doesn't matter).
- Last-write-wins is acceptable for issue metadata.
- Massive sync infrastructure makes it feel instant.

It breaks for forms with:
- **Cross-field validation** (warranty type + guarantor + cadastral data validated together — can't save field-by-field because individual fields aren't valid in isolation).
- **Side effects** (payment, contract activation, sending invitations — user needs to feel deliberate).
- **Composition tasks** (writing a new contract — the user has a "I'm not done yet" mental model).
- **Irreversible actions** (no rollback possible).

Most of Habita's forms are composed transactions. Going full-Linear would *reduce* clarity, not increase it.

## Implementation primitives

`Formulary.Root` owns the 4-state lifecycle (`idle` → `busy` → `done`/`error` → `idle`) and exposes `submit_state` via snippet render-prop. `Formulary.SubmitLabel` renders all four labels grid-stacked so width never reflows; the active one is shown, the others are visibility-hidden but still in the DOM.

```svelte
<Formulary.Root method="POST" action={...}>
  {#snippet children({ submit_state })}
    <Formulary.Fields>...</Formulary.Fields>
    <Formulary.Actions>
      <Button
        variant="primary"
        type="submit"
        disabled={submit_state === "busy"}
      >
        <Formulary.SubmitLabel
          state={submit_state}
          idle="Guardar"
          busy="Guardando..."
          done="Guardado"
          error="No se pudo guardar"
        />
      </Button>
    </Formulary.Actions>
  {/snippet}
</Formulary.Root>
```

Done renders as a green pill with white text + ✓; error renders as a red pill with white text + ✕. Both overlay the button's normal background via `position: absolute; inset: 0`.

Centralizing in `Root` means timing + state machine are implemented once and inherited by every form (Tesler's Law: system absorbs complexity).

## Label conventions (Spanish)

Match the action verb across all four states.

| Verb | Idle | Busy | Done | Error |
|------|------|------|------|-------|
| Guardar | Guardar | Guardando... | Guardado | No se pudo guardar |
| Crear | Crear | Creando... | Creado | No se pudo crear |
| Eliminar | Eliminar | Eliminando... | Eliminado | No se pudo eliminar |
| Editar | Editar | Editando... | Editado | No se pudo editar |
| Confirmar | Confirmar | Confirmando... | Confirmado | No se pudo confirmar |
| Enviar | Enviar | Enviando... | Enviado | No se pudo enviar |
| Pagar | Pagar | Pagando... | Pagado | No se pudo pagar |
| Activar | Activar | Activando... | Activado | No se pudo activar |
| Invitar | Invitar | Invitando... | Invitado | No se pudo invitar |
| Agregar | Agregar | Agregando... | Agregado | No se pudo agregar |
| Reservar | Reservar | Reservando... | Reservado | No se pudo reservar |

Never use a generic "Cargando..." for submits. The verb is information.

## Things to avoid

- **Pending state with no minimum hold.** Letting pending state vanish in <250ms produces a perceived flicker even though technically the feedback was shown. Always enforce a hold floor.
- **Delay-before-show patterns.** Theoretically elegant ("skip pending if response is fast"), practically twitchy due to repaint timing. Always-show + minimum-hold is the safer default.
- **Disabling cancel during submit.** User must always have an escape hatch (Nielsen #3).
- **Validation errors during typing.** Wait for blur or submit. Mid-typing errors are jarring.
- **Disabled submits without explanation.** If a button is disabled, helper text must say why ("Faltan campos obligatorios"). Linear nails this.
- **Reflow on label change.** Lock button width so "Guardar" → "Guardando..." doesn't shift surrounding elements.
- **Skeletons on form submits.** Skeletons are for *loading* (queries, page transitions). Using them on submit makes the form look broken.
- **Toast for every microaction.** Toasts are for medium/high-commitment confirmations. Atomic edits use inline microcopy.

## Accessibility requirements

- `aria-busy="true"` on the submit button while pending.
- `aria-disabled="true"` (not just `disabled`) so screen readers still focus and announce.
- Status changes announced via `aria-live="polite"` region.
- Pending labels readable to screen readers (don't hide the label change behind CSS only).
- Keyboard focus stays on the submit button after success (don't steal focus to a toast).

## Sources

- Jakob Nielsen, *10 Usability Heuristics* (1994), especially #1 (visibility) and #5 (error prevention).
- Don Norman, *The Design of Everyday Things* (2013) — Feedback principle.
- Doherty Threshold — IBM/Doherty (1982), popularized by Yablonski.
- Daniel Kahneman, *Thinking, Fast and Slow* — Peak-End Rule.
- Steve Krug, *Don't Make Me Think* (2014) — "mindless choice" principle.
- WCAG 2.2 — `aria-busy`, `aria-live`, `aria-disabled`.
- Linear's product (observed pattern, not a published guideline).
- Stripe, Vercel, Notion, Figma — convergent industry pattern for medium-commitment forms.

## Decision tree

```
Is the action atomic (one field, one HTTP call)?
├─ Yes → Is it commutative and reversible?
│        ├─ Yes → Optimistic + auto-save + inline "Guardado ✓"
│        └─ No  → Explicit submit + pending + toast
└─ No  → Does it have side effects (payment, email, irreversible)?
         ├─ Yes → Confirmation dialog + explicit pending + result page
         └─ No  → Explicit submit + pending + toast
```
