import type { AuditEvent } from "./api";

function escape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  "id",
  "event_type",
  "actor_id",
  "actor_name",
  "request_id",
  "lease_id",
  "created_at",
  "payload",
];

export function eventsToCsv(events: AuditEvent[]): string {
  const lines = [HEADERS.join(",")];
  for (const event of events) {
    const row = [
      event.id,
      event.event_type,
      event.actor_id ?? "",
      event.actor_name ?? "",
      event.request_id ?? "",
      event.lease_id ?? "",
      event.created_at,
      JSON.stringify(event.payload),
    ].map((value) => escape(String(value)));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}