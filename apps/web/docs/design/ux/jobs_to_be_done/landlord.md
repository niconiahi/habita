# Landlord — Jobs to Be Done

> Inferred emotional and social dimensions are marked with _(validate)_ — the designer should confirm these with real users.

---

## Primary job

**"When I own a property that I'm not using, I want someone competent to handle the rental process end-to-end, so I receive income from my asset without doing the operational work myself."**

### Functional dimension

Delegate the entire rental operation to a property manager — listing, tenant selection, contract drafting — while retaining visibility into what's happening and authority over the final agreement (through signing). Receive rental income with legal protection (warranty, contract).

### Emotional dimension _(validate)_

Feel that the property is in good hands. The landlord's biggest anxiety is delegating control over a valuable asset to someone else. Transparency is what converts anxiety into trust.

### Social dimension _(validate)_

Be perceived as a responsible property owner — by the manager (who depends on the landlord's cooperation), by the tenant (who expects the landlord to uphold the contract), and by the broader community (a well-maintained, legally rented property reflects positively).

---

## Secondary jobs

### Accept the invitation to participate

**"When a property manager invites me to be connected to my property in the system, I want to verify the invitation is legitimate and join, so I have formal access to the property's management details."**

- **Functional:** Receive an email with an invitation link. Click it, verify that the token is valid and the email matches, and get granted landlord-level access to the property.
- **Emotional** _(validate)_: Feel that the onboarding is secure — the token expiration and email verification should signal legitimacy, not make the process feel bureaucratic.
- **Social** _(validate)_: Minimal — this is a one-time private action.

### Stay informed about the rental agreement

**"When a contract is being prepared for my property, I want to see what's being agreed to, so I'm not surprised by terms I didn't approve."**

- **Functional:** View the contract details — pricing, warranty, escalation terms, fine conditions — from the landlord's access level. See the property's current state and tenant information.
- **Emotional** _(validate)_: Feel informed and in control, even though the manager handles the operational work. The alternative — finding out about contract terms after they're signed — would be a trust-breaking moment.
- **Social** _(validate)_: Be perceived by the manager as an engaged owner, not an absentee one. This signals that the landlord cares about the property.

### Establish digital identity for signing

**"When I need to sign a contract digitally, I want to set up my digital certificate once and then be ready for any future signings, so I'm not blocked when the contract is ready."**

- **Functional:** Complete the digital certificate onboarding process through the external provider (Alpha2000). This requires identity verification using CUIL. Once done, the certificate is reusable.
- **Emotional** _(validate)_: Feel that the setup is a one-time effort with lasting value, not a confusing technical process. The redirect to an external provider is jarring — it should feel like a necessary step, not a dead end.
- **Social** _(validate)_: Be perceived as someone who takes legal formalities seriously.

### Sign the contract with legal certainty

**"When the contract PDF is ready and I've reviewed the terms, I want to apply my legally binding digital signature, so the agreement is enforceable and I'm protected."**

- **Functional:** Receive an email with a signing link. Sign through the external provider's interface. The system records the signature status and, when both parties have signed, automatically stores the signed PDF and activates the contract.
- **Emotional** _(validate)_: Feel that the signing is final and legally valid — equivalent to signing physical papers at a notary. The automatic activation of the contract after both signatures should feel like closure, not like something happened without the landlord's explicit approval.
- **Social** _(validate)_: Be perceived as a cooperative counterpart who signs promptly. Delays in signing block the entire process and strain the relationship with the manager and tenant.

### View all pending signature obligations

**"When I have contracts waiting for my signature across multiple properties, I want to see them all in one place, so I don't miss any and can prioritize."**

- **Functional:** See all contracts that require the landlord's signature, with property address, signature status (pending/signed/rejected) for both landlord and tenant, and a link to sign.
- **Emotional** _(validate)_: Feel on top of obligations. Missing a signing request means the contract stays in limbo — the landlord wants to know what's pending, not discover it through an angry call from the manager.
- **Social** _(validate)_: Be perceived as responsive and reliable by the manager.

### Verify that signatures are authentic

**"When a contract has been signed by all parties, I want to confirm that the signatures are genuine and the document hasn't been tampered with, so I trust the signed contract."**

- **Functional:** Verify each party's signature against the original document hash and the signer's certificate. This is a cryptographic verification — it proves the signed PDF matches what was submitted.
- **Emotional** _(validate)_: Feel that the digital process is as trustworthy as traditional paper signing. The verification step is reassurance — even if rarely used, knowing it exists provides confidence.
- **Social** _(validate)_: Minimal — this is a verification action, not a public one.

---

## Consumption jobs

- **Invitation acceptance:** The landlord's first interaction with the platform is clicking an email link. If they're not already logged in, they need to sign up or log in first — then the token is processed. This cold start can be confusing if the landlord doesn't understand why they're being asked to create an account.
- **Digital certificate onboarding:** This redirects to an external provider (Alpha2000) for identity verification. The landlord has no control over that provider's UX. If the onboarding fails or is rejected, the landlord needs to understand what went wrong and what to do next.
- **Signing flow:** The landlord clicks a link in an email, gets redirected to the signature provider, signs (or rejects), and is redirected back. The back-and-forth between platforms can feel disorienting — the landlord needs to trust that the redirects are part of the legitimate process.
- **Passive role:** Unlike the manager or tenant, the landlord has very few active tasks — mostly waiting and responding to invitations and signing requests. This passivity can feel like being out of the loop if the manager doesn't communicate proactively.
