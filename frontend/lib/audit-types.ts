export const AUDIT_EVENT_TYPES: { value: string; label: string }[] = [
  { value: "request.created", label: "Request created" },
  { value: "policy.evaluated", label: "Policy evaluated" },
  { value: "request.auto_approved", label: "Request auto approved" },
  { value: "request.approved", label: "Request approved" },
  { value: "request.denied", label: "Request denied" },
  { value: "credential.issued", label: "Credential issued" },
  { value: "credential.used", label: "Credential used" },
  { value: "lease.expired", label: "Lease expired" },
  { value: "lease.revoked", label: "Lease revoked" },
  { value: "user.logged_in", label: "User logged in" },
  { value: "demo.reset", label: "Demo reset" },
];

export const EVENT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIT_EVENT_TYPES.map((entry) => [entry.value, entry.label]),
);

export function eventTypeLabel(value: string): string {
  return EVENT_TYPE_LABEL[value] ?? value;
}