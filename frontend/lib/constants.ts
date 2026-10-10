import type { Environment } from "./api";

export const ENVIRONMENTS: {
  value: Environment;
  label: string;
}[] = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "production-db", label: "Production DB" },
];

export const ALLOWED_ROLES: Record<Environment, string[]> = {
  development: ["ECS-ReadOnly", "ECS-Developer", "DatabaseReader"],
  staging: [
    "ECS-ReadOnly",
    "ECS-Developer",
    "DatabaseReader",
    "DatabaseWriter",
  ],
  production: ["ECS-ReadOnly", "ECS-Prod-BreakGlass"],
  "production-db": ["DatabaseReader", "DatabaseWriter"],
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  auto_approved: "Auto Approved",
  approved: "Approved",
  denied: "Denied",
  expired: "Expired",
  revoked: "Revoked",
};