# /profile

## Loader

Requires auth. Fetches:

- `user_profile` — name, surname, phone, document_number, CUIL (decrypted)
- `user_files` — user documents with type labels
- `properties` — accessible properties for context

## Actions (2 total)

- `UPDATE_USER` — updates personal information (name, surname, phone, document_number, CUIL)
- `CREATE_FILE` — uploads a user document (DNI, passport, credit report, etc.)

## Auth

Requires authenticated user.

## Key Components

Formulary, TypedFileUploadButton, Table
