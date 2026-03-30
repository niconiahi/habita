# /profile

## Loader

Requires auth (redirects to `/auth/google` if not). Loads:

- `user_profile` — via `fetch_user_profile()`, decrypts sensitive fields (name, surname, phone_number, document_number, cuil) using `decrypt()`
- `user_files` — via `fetch_user_files()`, joins `user_file` → `file` to get id, basename, type
- `properties` — via `fetch_properties()` for accessible property IDs

## Actions

- `UPDATE_USER` — validates and updates user personal info (name, surname, phone_number, document_number, cuil). Uses `update_user()`.
- `CREATE_FILE` — uploads a typed document (from `USER_FILE_TYPE`). Uses `create_file()`.

## Auth

Requires authenticated user. Redirects to `/auth/google` if not logged in.

## Key Components

Content, Section, Formulary, Button, TypedFileUploadButton

## Notes

- Personal data is encrypted at rest — the loader decrypts for display
- `has_action_error(form, "update_user")` narrows form errors for the update action
- Document types come from `USER_FILE_TYPE` enum with labels via `get_user_file_type_label()`
