# Future Features

## White-Label Admin Control Plane (Financial Institutions)

### Outcome
- Evolve admin from a single dashboard into a tenant-safe control plane for multiple institutions.
- Support white-label deployment, enterprise identity, and compliance-grade reporting.

### Core Capability Areas
- Tenant management: org profile, domains/subdomains, feature flags, usage limits.
- Identity and access: SSO (SAML/OIDC), SCIM provisioning, role templates, approval workflows.
- White-label branding: logos, theme tokens, institution-specific copy, email templates.
- Learning controls: institution-specific catalogs, assignment rules, scoring/rubric policies.
- Analytics and exports: org/desk/user drilldowns, scheduled reports, CSV/API exports.
- Governance and compliance: immutable audit logs, retention policies, PII masking, legal hold toggles.

### Platform/Architecture Enablers
- Central tenant context enforcement across backend endpoints and jobs.
- Policy/RBAC engine with org-scoped permissions.
- Versioned tenant configuration service for branding/auth/features.
- Event and audit pipeline for admin actions and compliance reporting.

### Suggested Delivery Sequence
1. Foundation: tenant boundary enforcement, RBAC hardening, audit log baseline.
2. Enterprise onboarding: SSO/SCIM, domain verification, subdomain lifecycle tooling.
3. White-label UX: theme/copy/email customization in admin settings.
4. Compliance analytics: policy dashboards, SLA tracking, scheduled attestations.
5. Integrations: APIs/webhooks for LMS/HRIS/BI consumers.
