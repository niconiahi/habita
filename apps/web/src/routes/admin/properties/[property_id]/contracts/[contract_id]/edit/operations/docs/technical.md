# /admin/properties/[property_id]/contracts/[contract_id]/edit/operations

## Loader

No page-level loader. Data comes from parent layout (`contract`, `signature`).

## Actions (5 total)

PDF: `CREATE_PDF` — generates contract PDF document
Signatures: `CHECK_CERTIFICATES`, `START_ONBOARDING`, `SEND_FOR_SIGNING`, `VERIFY_SIGNATURE`

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Button

## Notes

- State-dependent UI: shows different views based on PDF existence and signature status
- `CHECK_CERTIFICATES` returns data inline (`check_certificates_data`) displayed in the same page
- Digital signature actions integrate with Alpha2000 Firmador API
- `SEND_FOR_SIGNING` only available when both parties have certificates
- Uses `SIGNATURE_STATUS` enum: `PENDING`, `SIGNED`
