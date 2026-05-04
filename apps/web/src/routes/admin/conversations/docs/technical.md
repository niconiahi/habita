# Conversaciones (Admin) — Technical

## Loader

- `require_authentication` — admin-only (protected by admin layout)
- `fetch_conversations` — all conversations with user email, sorted by most recent
- `fetch_conversation_messages` — messages for selected conversation (via `?selected=` URL param)

## Actions

- `create_conversation_reply` — inserts message as admin, updates conversation timestamp, sends email notification to user via Go email service

## Auth

- Protected by admin layout (`require_authentication` + `require_active_subscription`)

## Key Components

- Split-panel layout: conversation list (left) + message detail (right)
- Reply form with `use:enhance` for optimistic submission

## Notes

- Selected conversation tracked via URL search param (`?selected=id`) to survive form submissions
- Email notification is non-critical: if it fails, the reply is still saved and logged
