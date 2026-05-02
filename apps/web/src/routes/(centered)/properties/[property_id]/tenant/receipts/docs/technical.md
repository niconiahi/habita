# /properties/[property_id]/tenant/receipts

## Loader

Fetches `dates`, `receipt_types` (rent + service types filtered by property services), `contract`, `receipts` (matching date range), and `next_day` (for pagination).

## Actions (1 total)

- `UPLOAD_RECEIPT` — uploads a receipt file (image or PDF) for a specific type and month

## Auth

Inherited from parent layout (tenant access).

## Key Components

Dialog, WhatsappButton

## Notes

- Receipts grouped by month; only current month is editable
- Paginated history via `next_day` parameter
- Deletion redirects to WhatsApp contact with manager
