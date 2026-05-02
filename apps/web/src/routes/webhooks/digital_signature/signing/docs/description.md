# Digital signature signing callback

This is the endpoint that the digital signature provider calls after a landlord or tenant completes, rejects, or fails their digital signature. It updates the signature status for the relevant party.

When both the landlord and tenant have successfully signed, the system automatically downloads the fully signed PDF document and activates the contract — meaning it goes from draft to active status.

After processing, the user is redirected to the appropriate result page (success, rejected, or error).
