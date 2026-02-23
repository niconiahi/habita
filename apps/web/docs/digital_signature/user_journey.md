# User Journey

## First time setup (once per person)

The admin is editing a contract in the app. The contract PDF is already generated. Now they need both the landlord and the tenant to digitally sign it.

The admin clicks "Verificar certificados" to check if the landlord and tenant already have digital certificates. The system looks up their CUILs and asks Alpha2000 if certificates exist. Most likely, they don't — neither person has ever used digital signatures before.

So the admin clicks "Iniciar onboarding" for the landlord. Alpha2000 sends the landlord an email with instructions to get their digital certificate. The landlord opens the email, goes through identity verification on Alpha2000's platform, and eventually their private key gets stored on Alpha2000's servers ("clave en custodia"). When they're done, they get redirected back to the app. The admin repeats this for the tenant.

The admin clicks "Verificar certificados" again. This time both come back green — both parties have valid certificates. The contract is ready for signing.

## Signing the contract

The admin clicks "Enviar a firmar". The app uploads the contract PDF to Alpha2000 along with the CUILs of both signers. Alpha2000 returns two authorization URLs — one for the landlord and one for the tenant.

The admin shares the landlord's URL with the landlord (or they access it from the app directly). The landlord opens the URL, sees the document on Alpha2000's platform, and authorizes the signing. Alpha2000 uses their stored private key to sign, then redirects the landlord back to the app. The callback updates the landlord's status to "signed".

The same happens for the tenant. When the tenant's callback arrives and both statuses are "signed", the app immediately calls Alpha2000 to fetch the fully signed PDF. It stores the signed PDF, and the contract transitions to "active".

## After signing (optional)

If there's ever a need to prove the contract's authenticity — say, a legal dispute — the admin can verify the signature. The app takes the certificate, the original hash, and the signed hash, and asks Alpha2000 to confirm it's valid.
