class AuditEventType:
    REQUEST_CREATED = "request.created"
    POLICY_EVALUATED = "policy.evaluated"
    REQUEST_AUTO_APPROVED = "request.auto_approved"
    REQUEST_APPROVED = "request.approved"
    REQUEST_DENIED = "request.denied"
    CREDENTIAL_ISSUED = "credential.issued"
    LEASE_EXPIRED = "lease.expired"
    LEASE_REVOKED = "lease.revoked"
    USER_LOGGED_IN = "user.logged_in"
    DEMO_RESET = "demo.reset"

    ALL = {
        REQUEST_CREATED,
        POLICY_EVALUATED,
        REQUEST_AUTO_APPROVED,
        REQUEST_APPROVED,
        REQUEST_DENIED,
        CREDENTIAL_ISSUED,
        LEASE_EXPIRED,
        LEASE_REVOKED,
        USER_LOGGED_IN,
        DEMO_RESET,
    }