# /admin/properties/[property_id]/edit/members

## Loader

No page-level loader. Member data comes from parent layout (`property`).

## Actions (1 total)

- `INVITE_LANDLORD` — sends invitation email to a landlord

Action imports from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

WhatsappButton

## Notes

- Landlord invite form only visible when no landlord exists
- Avatar fallback to first letter of name
