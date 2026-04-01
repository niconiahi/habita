# Habita

Rental property management platform for the Argentine real estate market. Connects property managers, landlords, and tenants through property listing, visit scheduling, contract drafting, digital signing, and payment tracking.

## Product

| Document | Description |
|----------|-------------|
| [Product description](./apps/web/docs/product/description.md) | Platform overview: users, flows, and lifecycles |

## Infrastructure

| Document | Description |
|----------|-------------|
| [Infrastructure overview](./infra/README.md) | Docker services quick start guide |
| [Infrastructure design](./infra/docs/infrastructure_design.md) | System architecture decisions and service configuration |
| [Docker concepts](./infra/docs/docker.md) | Docker concepts explained using Habita's infrastructure |
| [Production setup](./infra/docs/setup_production_environment.md) | Production server provisioning and configuration |
| [VPS setup scripts](./infra/scripts/README.md) | Scripts for production deployment |
| [Security audit](./infra/docs/security_audit.md) | Security audit documentation |

## Operations

| Document | Description |
|----------|-------------|
| [Secrets management](./infra/docs/secrets.md) | SOPS + age encryption workflows |
| [Database backups](./infra/docs/recovery/backups.md) | Backup procedures |
| [Deploy rollback](./infra/docs/recovery/deploy_rollback.md) | Emergency rollback steps for failed deployments |

## Security

| Document | Description |
|----------|-------------|
| [Authorization and authentication](./apps/web/docs/security/authorization_and_authentication.md) | Better Auth and two-layer authorization system |
| [Roles vs data scoping](./apps/web/docs/security/authorization_roles_vs_business_data_scoping.md) | Role-based vs data-scoping authorization patterns |
| [Encryption](./apps/web/docs/security/encryption.md) | File encryption at rest using AES-256-GCM |

## Technical

| Document | Description |
|----------|-------------|
| [Error handling](./apps/web/docs/technical/error_handling.md) | Go-style error handling with tuples |
| [Message broker](./apps/web/docs/technical/broker.md) | Redpanda architecture for job processing |
| [Subscriptions](./apps/web/docs/technical/subscription.md) | Subscription and paywall implementation |
| [Zone filtering](./apps/web/docs/technical/zone.md) | Zone filtering with polygon geometry |

### Digital signature API

| Document | Description |
|----------|-------------|
| [User journey](./apps/web/docs/technical/digital_signature/user_journey.md) | Digital signature flow overview |
| [Request format](./apps/web/docs/technical/digital_signature/request.md) | API request conventions |
| [PostIniciarRegistracionUsuario](./apps/web/docs/technical/digital_signature/PostIniciarRegistracionUsuario/) | User registration endpoint |
| [PostIniciarOnboardingPersonaFisica](./apps/web/docs/technical/digital_signature/PostIniciarOnboardingPersonaFisica/) | Physical person onboarding endpoint |
| [PostObtenerCertificado](./apps/web/docs/technical/digital_signature/PostObtenerCertificado/) | Certificate retrieval endpoint |
| [PostFirmarDocumentoFirmaDigital](./apps/web/docs/technical/digital_signature/PostFirmarDocumentoFirmaDigital/) | Document signing endpoint |
| [PostObtenerEstadoFirmaDigitalDocumento](./apps/web/docs/technical/digital_signature/PostObtenerEstadoFirmaDigitalDocumento/) | Signature status endpoint |
| [PostVerificarFirmaHash](./apps/web/docs/technical/digital_signature/PostVerificarFirmaHash/) | Hash verification endpoint |

## Design / UX

### Jobs to Be Done

| Document | Description |
|----------|-------------|
| [What is JTBD](./apps/web/docs/design/ux/jobs_to_be_done/what_is_jtbd.md) | Introduction to Jobs to Be Done framework |
| [Manager](./apps/web/docs/design/ux/jobs_to_be_done/manager.md) | JTBD analysis for property managers |
| [Landlord](./apps/web/docs/design/ux/jobs_to_be_done/landlord.md) | JTBD analysis for landlords |
| [Tenant](./apps/web/docs/design/ux/jobs_to_be_done/tenant.md) | JTBD analysis for tenants |
| [Realtor](./apps/web/docs/design/ux/jobs_to_be_done/realtor.md) | JTBD analysis for realtors |

### User journeys

#### Manager (19 steps)

| Step | Document |
|------|----------|
| 01 | [Sign up and subscribe](./apps/web/docs/design/ux/user-journey/manager/01-sign-up-and-subscribe.md) |
| 02 | [Create property](./apps/web/docs/design/ux/user-journey/manager/02-create-property.md) |
| 03 | [Edit property location](./apps/web/docs/design/ux/user-journey/manager/03-edit-property-location.md) |
| 04 | [Edit property rooms](./apps/web/docs/design/ux/user-journey/manager/04-edit-property-rooms.md) |
| 05 | [Edit property services, tags, photos](./apps/web/docs/design/ux/user-journey/manager/05-edit-property-services-tags-photos.md) |
| 06 | [Invite landlord](./apps/web/docs/design/ux/user-journey/manager/06-invite-landlord.md) |
| 07 | [Publish property](./apps/web/docs/design/ux/user-journey/manager/07-publish-property.md) |
| 08 | [Unpublish property](./apps/web/docs/design/ux/user-journey/manager/08-unpublish-property.md) |
| 09 | [Setup visit calendar](./apps/web/docs/design/ux/user-journey/manager/09-setup-visit-calendar.md) |
| 10 | [Review candidates](./apps/web/docs/design/ux/user-journey/manager/10-review-candidates.md) |
| 11 | [Select tenant](./apps/web/docs/design/ux/user-journey/manager/11-select-tenant.md) |
| 12 | [Create contract](./apps/web/docs/design/ux/user-journey/manager/12-create-contract.md) |
| 13 | [Configure contract details](./apps/web/docs/design/ux/user-journey/manager/13-configure-contract-details.md) |
| 14 | [Configure warranty](./apps/web/docs/design/ux/user-journey/manager/14-configure-warranty.md) |
| 15 | [Generate contract PDF](./apps/web/docs/design/ux/user-journey/manager/15-generate-contract-pdf.md) |
| 16 | [Setup digital signatures](./apps/web/docs/design/ux/user-journey/manager/16-setup-digital-signatures.md) |
| 17 | [View all contracts](./apps/web/docs/design/ux/user-journey/manager/17-view-all-contracts.md) |
| 18 | [View all tenants](./apps/web/docs/design/ux/user-journey/manager/18-view-all-tenants.md) |
| 19 | [Renew subscription](./apps/web/docs/design/ux/user-journey/manager/19-renew-subscription.md) |

#### Landlord (2 steps)

| Step | Document |
|------|----------|
| 01 | [Accept invitation](./apps/web/docs/design/ux/user-journey/landlord/01-accept-invitation.md) |
| 02 | [Sign contract](./apps/web/docs/design/ux/user-journey/landlord/02-sign-contract.md) |

#### Tenant (7 steps)

| Step | Document |
|------|----------|
| 01 | [Sign up](./apps/web/docs/design/ux/user-journey/tenant/01-sign-up.md) |
| 02 | [Complete profile](./apps/web/docs/design/ux/user-journey/tenant/02-complete-profile.md) |
| 03 | [Browse properties](./apps/web/docs/design/ux/user-journey/tenant/03-browse-properties.md) |
| 04 | [Evaluate property](./apps/web/docs/design/ux/user-journey/tenant/04-evaluate-property.md) |
| 05 | [Book visit](./apps/web/docs/design/ux/user-journey/tenant/05-book-visit.md) |
| 06 | [Sign contract](./apps/web/docs/design/ux/user-journey/tenant/06-sign-contract.md) |
| 07 | [Upload receipts](./apps/web/docs/design/ux/user-journey/tenant/07-upload-receipts.md) |

#### Realtor (6 steps)

| Step | Document |
|------|----------|
| 01 | [Sign up and subscribe](./apps/web/docs/design/ux/user-journey/realtor/01-sign-up-and-subscribe.md) |
| 02 | [Invite managers](./apps/web/docs/design/ux/user-journey/realtor/02-invite-managers.md) |
| 03 | [Remove manager](./apps/web/docs/design/ux/user-journey/realtor/03-remove-manager.md) |
| 04 | [Reassign property](./apps/web/docs/design/ux/user-journey/realtor/04-reassign-property.md) |
| 05 | [Overview agency](./apps/web/docs/design/ux/user-journey/realtor/05-overview-agency.md) |
| 06 | [Renew subscription](./apps/web/docs/design/ux/user-journey/realtor/06-renew-subscription.md) |

#### Webmaster (2 steps)

| Step | Document |
|------|----------|
| 01 | [Manage rates](./apps/web/docs/design/ux/user-journey/webmaster/01-manage-rates.md) |
| 02 | [Test payments](./apps/web/docs/design/ux/user-journey/webmaster/02-test-payments.md) |

---

## Quick links

**New to the project?** Start with [Product description](./apps/web/docs/product/description.md) then [Infrastructure overview](./infra/README.md)
**Need to deploy?** See [Infrastructure design](./infra/docs/infrastructure_design.md) or run `just --list`
**Something broken?** Check [Deploy rollback](./infra/docs/recovery/deploy_rollback.md) or [Database backups](./infra/docs/recovery/backups.md)
**Managing secrets?** See [Secrets management](./infra/docs/secrets.md)
