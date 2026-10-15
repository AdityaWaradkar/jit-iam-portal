export type TourStep = {
  id: string;
  target: string | null;
  title: string;
  description: string;
  route?: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to JIT IAM Portal",
    description:
      "A quick tour of the portal. You will see how engineers request temporary access, how approvers review it, and how the platform issues and revokes credentials automatically. You can skip at any time.",
  },
  {
    id: "persona-switcher",
    target: '[data-tour="persona-switcher"]',
    title: "Switch personas",
    description:
      "The sandbox provides three personas. Engineers submit requests, approvers review them, and auditors inspect the compliance trail. Switch to test each role.",
  },
  {
    id: "request-form",
    target: '[data-tour="request-form"]',
    title: "Submit an access request",
    description:
      "Engineers request temporary permissions here. Choose an environment, a role, and a duration. In this example, we will submit a staging request that auto-approves.",
    route: "/requests",
  },
  {
    id: "request-list",
    target: '[data-tour="request-list"]',
    title: "Track your requests",
    description:
      "Every request you submit appears here with a status badge and a policy reason. Auto-approved requests can be issued immediately; pending requests wait for an approver.",
    route: "/requests",
  },
  {
    id: "issue-button",
    target: '[data-tour="issue-credentials"]',
    title: "Issue ephemeral credentials",
    description:
      "When a request is approved, the portal issues short-lived credentials through a mock Vault and STS engine. The secret is shown once and never stored in plaintext.",
    route: "/requests",
  },
  {
    id: "approver-view",
    target: '[data-tour="approver-view-toggle"]',
    title: "Approver view",
    description:
      "Approvers see the pending queue and can also view it as a Slack-style channel. Both views call the same backend endpoints and write the same audit events.",
    route: "/approver",
  },
  {
    id: "terminal",
    target: '[data-tour="terminal"]',
    title: "Test credentials in the terminal",
    description:
      "Once a credential is loaded, you can run simulated AWS CLI commands. The backend verifies the secret hash on every command and refuses expired or revoked leases.",
    route: "/leases",
  },
  {
    id: "audit-viewer",
    target: '[data-tour="audit-table"]',
    title: "Inspect the audit trail",
    description:
      "Every action writes an audit event. The auditor persona sees the full log with filters for event type, actor, request, lease, and date range, and can export it as CSV.",
    route: "/audit",
  },
  {
    id: "security-dashboard",
    target: '[data-tour="zsp-card"]',
    title: "Security dashboard",
    description:
      "The auditor's dashboard summarizes the security posture: ZSP status, elevation heatmap, top requesters, recent credentials, and decision latency.",
    route: "/",
  },
  {
    id: "done",
    target: null,
    title: "You're done",
    description:
      "That is the tour. Sign in as a different persona to see the other views, or explore any page on your own.",
  },
];